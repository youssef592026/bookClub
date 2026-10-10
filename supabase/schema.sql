-- ============================================================
--  قاعدة بيانات موقع «بين السطور»
--  الصق الملف كله في Supabase > SQL Editor ثم اضغط Run
--  آمن لو شغّلته أكتر من مرة
-- ============================================================

-- 1) الجداول (كل جدول بيخزّن العناصر كـ JSON عشان التعديل يكون سهل)
create table if not exists public.settings   (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table if not exists public.categories (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.members    (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.books      (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.events     (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.quotes     (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.points_log (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.requests   (id text primary key, data jsonb not null, created_at timestamptz not null default now());
create table if not exists public.user_profiles (id uuid primary key references auth.users(id) on delete cascade, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

-- 2) جدول الأدمن: أي إيميل هنا بيبقى أدمن
create table if not exists public.admins (email text primary key);

-- 3) دالة بتتأكد إن المستخدم الحالي أدمن
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

create or replace function public.create_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, data)
  values (new.id, jsonb_build_object('name', coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)), 'email', new.email))
  on conflict (id) do update set data = excluded.data;
  insert into public.members (id, data)
  values ('u_' || new.id::text, jsonb_build_object('name', coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)), 'role', 'قارئ', 'hideFromLeaderboard', exists (select 1 from public.admins where lower(email) = lower(new.email))))
  on conflict (id) do update set data = excluded.data;
  return new;
end;
$$;

drop trigger if exists create_user_profile_after_signup on auth.users;
create trigger create_user_profile_after_signup
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.create_user_profile();

insert into public.user_profiles (id, data)
select id, jsonb_build_object('name', coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), split_part(email, '@', 1)), 'email', email)
from auth.users
on conflict (id) do update set data = excluded.data;

insert into public.members (id, data)
select 'u_' || id::text, jsonb_build_object('name', coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), split_part(email, '@', 1)), 'role', 'قارئ', 'hideFromLeaderboard', exists (select 1 from public.admins where lower(admins.email) = lower(auth.users.email)))
from auth.users
on conflict (id) do update set data = excluded.data;

create or replace function public.sync_admin_member_visibility()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op <> 'INSERT' then
    update public.members
    set data = jsonb_set(coalesce(data, '{}'::jsonb), '{hideFromLeaderboard}', 'false'::jsonb, true)
    where id in (select 'u_' || id::text from auth.users where lower(email) = lower(old.email));
  end if;
  if tg_op <> 'DELETE' then
    update public.members
    set data = jsonb_set(coalesce(data, '{}'::jsonb), '{hideFromLeaderboard}', 'true'::jsonb, true)
    where id in (select 'u_' || id::text from auth.users where lower(email) = lower(new.email));
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists sync_admin_member_visibility_after_change on public.admins;
create trigger sync_admin_member_visibility_after_change
  after insert or update or delete on public.admins
  for each row execute function public.sync_admin_member_visibility();

-- 4) تفعيل الحماية (RLS) على كل الجداول
alter table public.settings   enable row level security;
alter table public.categories enable row level security;
alter table public.members    enable row level security;
alter table public.books      enable row level security;
alter table public.events     enable row level security;
alter table public.quotes     enable row level security;
alter table public.points_log enable row level security;
alter table public.requests   enable row level security;
alter table public.admins     enable row level security;
alter table public.user_profiles enable row level security;

-- 5) صلاحيات الجداول العامة: الكل يقرأ، الأدمن فقط يكتب
do $$
declare t text;
begin
  foreach t in array array['settings','categories','members','books','events','points_log'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "user profiles read self or admin" on public.user_profiles;
drop policy if exists "user profiles admin write" on public.user_profiles;
create policy "user profiles read self or admin" on public.user_profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "user profiles admin write" on public.user_profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 6) الاقتباسات: الكل يقرأ المنشور، والمستخدم المسجل يضيف مشاركته فقط، والأدمن يتحكم في الكل
drop policy if exists "quotes public read" on public.quotes;
drop policy if exists "quotes public insert" on public.quotes;
drop policy if exists "quotes admin all" on public.quotes;
create policy "quotes public read" on public.quotes for select using (data ->> 'status' = 'approved');
drop policy if exists "quotes user read own" on public.quotes;
create policy "quotes user read own" on public.quotes for select to authenticated
  using (data ->> 'userId' = auth.uid()::text);
create policy "quotes public insert" on public.quotes for insert to authenticated
  with check (data ->> 'userId' = auth.uid()::text and data ->> 'status' = 'pending' and coalesce((data ->> 'pointsAwarded')::numeric, 0) = 0 and char_length(coalesce(data ->> 'text', '')) between 1 and 1200);
create policy "quotes admin all" on public.quotes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 7) طلبات الانضمام: الزائر يضيف فقط، والأدمن فقط يقرأ ويعدّل
drop policy if exists "requests public insert" on public.requests;
drop policy if exists "requests admin all" on public.requests;
create policy "requests public insert" on public.requests for insert to authenticated
  with check (data ->> 'userId' = auth.uid()::text and coalesce(data ->> 'handled', 'false') = 'false' and char_length(coalesce(data ->> 'name', '')) between 1 and 200);
create policy "requests admin all" on public.requests for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 8) جدول الأدمن: المستخدم يقدر يشوف صفّه هو بس
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- 9) مخزن الصور (Storage): الكل يشوف الصور، والأدمن فقط يرفع ويعدّل ويحذف
insert into storage.buckets (id, name, public) values ('images', 'images', true)
on conflict (id) do update set public = true;

drop policy if exists "images public read" on storage.objects;
drop policy if exists "images admin insert" on storage.objects;
drop policy if exists "images admin update" on storage.objects;
drop policy if exists "images admin delete" on storage.objects;
create policy "images public read" on storage.objects for select using (bucket_id = 'images');
create policy "images admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'images' and public.is_admin());
create policy "images admin update" on storage.objects for update to authenticated using (bucket_id = 'images' and public.is_admin());
create policy "images admin delete" on storage.objects for delete to authenticated using (bucket_id = 'images' and public.is_admin());

-- 10) آخر خطوة: ضيف إيميلك كأدمن (غيّر الإيميل ثم شغّل السطر ده)
-- insert into public.admins (email) values ('your-email@example.com') on conflict do nothing;
