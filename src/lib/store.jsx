import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { makeSeed } from '../data/seed';
import { DEFAULT_CONTENT, IMAGE_KEYS } from '../data/content';
import { localISO, sha256, uid } from './utils';
import { supabase, TABLES } from './supabase';
import { useToast } from '../components/ui';

const KEY = 'bayn-alsotour:data:v2';
const AUTH = 'bayn-alsotour:admin';
const USERS = 'bayn-alsotour:users:v1';
const USER_AUTH = 'bayn-alsotour:user';
const DEFAULT_PASSWORD = 'admin123';
const COLLECTIONS = Object.keys(TABLES);
export const REMOTE = !!supabase;
const Ctx = createContext(null);

const mergeSettings = (base, extra) => ({
  ...base, ...(extra || {}),
  links: { ...base.links, ...((extra || {}).links || {}) },
  content: { ...((extra || {}).content || {}) },
});

function emptyRemote() {
  const seed = makeSeed();
  const d = { settings: mergeSettings(seed.settings, null) };
  COLLECTIONS.forEach((c) => { d[c] = []; });
  return d;
}

function loadLocal() {
  const seed = makeSeed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed;
    const d = JSON.parse(raw);
    return { ...seed, ...d, settings: mergeSettings(seed.settings, d.settings) };
  } catch { return seed; }
}

function loadLocalUser() {
  if (REMOTE) return null;
  try {
    const id = sessionStorage.getItem(USER_AUTH);
    return JSON.parse(localStorage.getItem(USERS) || '[]').find((u) => u.id === id) || null;
  } catch { return null; }
}

function loadLocalProfiles() {
  if (REMOTE) return [];
  try { return JSON.parse(localStorage.getItem(USERS) || '[]').map(({ id, name, email }) => ({ id, name, email })); }
  catch { return []; }
}

async function fetchRemote(includeUserProfiles = false) {
  const collections = COLLECTIONS.filter((col) => includeUserProfiles || col !== 'userProfiles');
  const rows = await Promise.all(collections.map(async (col) => {
    const { data, error } = await supabase.from(TABLES[col]).select('id,data').order('created_at', { ascending: true });
    if (error) throw error;
    return [col, data.map((r) => ({ ...r.data, id: r.id }))];
  }));
  const { data: s, error } = await supabase.from('settings').select('data').eq('id', 'main').maybeSingle();
  if (error) throw error;
  const base = emptyRemote();
  return { ...base, ...Object.fromEntries(rows), settings: mergeSettings(base.settings, s?.data) };
}

/**
 * طبقة البيانات: كل التعديلات بتمر من `api`.
 * مع Supabase بتتحفظ في قاعدة البيانات، وبدونه بتتحفظ في المتصفح (وضع تجريبي).
 */
export function StoreProvider({ children }) {
  const toast = useToast();
  const [data, setData] = useState(() => (REMOTE ? emptyRemote() : loadLocal()));
  const dataRef = useRef(data);
  const [ready, setReady] = useState(!REMOTE);
  const [loadError, setLoadError] = useState(null);
  const [session, setSession] = useState(null);
  const [localUser, setLocalUser] = useState(loadLocalUser);
  const [localProfiles, setLocalProfiles] = useState(loadLocalProfiles);
  const [localAdmin, setLocalAdmin] = useState(() => !REMOTE && sessionStorage.getItem(AUTH) === '1');
  const [remoteAdmin, setRemoteAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(!REMOTE);
  const isAdmin = REMOTE ? remoteAdmin : localAdmin;
  const user = REMOTE
    ? (session?.user ? { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '' } : null)
    : (localUser ? { id: localUser.id, email: localUser.email, name: localUser.name } : null);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { if (!REMOTE) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { toast('مساحة التخزين في المتصفح امتلأت. استخدم صور أصغر.'); } } }, [data, toast]);

  const refresh = useCallback(async () => {
    try {
      const d = await fetchRemote(remoteAdmin);
      dataRef.current = d; setData(d); setLoadError(null);
    } catch (e) { setLoadError(e.message || 'تعذر الاتصال بقاعدة البيانات'); }
    finally { setReady(true); }
  }, [remoteAdmin]);

  // ----- المصادقة (Supabase) -----
  useEffect(() => {
    if (!REMOTE) return undefined;
    supabase.auth.getSession().then(({ data: s }) => setSession(s.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!REMOTE) return undefined;
    let off = false;
    (async () => {
      if (!session?.user?.email) { setRemoteAdmin(false); setAdminChecked(true); return; }
      const { data: row } = await supabase.from('admins').select('email').eq('email', session.user.email).maybeSingle();
      if (!off) { setRemoteAdmin(!!row); setAdminChecked(true); }
    })();
    return () => { off = true; };
  }, [session]);
  useEffect(() => { if (REMOTE) refresh(); }, [refresh, remoteAdmin, session?.user?.id]);
  // لو الاتصال اتأخر أكتر من ٩ ثواني نعرض الموقع ونوضّح المشكلة بدل شاشة التحميل
  const readyRef = useRef(!REMOTE);
  useEffect(() => { readyRef.current = ready; }, [ready]);
  useEffect(() => {
    if (!REMOTE) return undefined;
    const t = setTimeout(() => { if (!readyRef.current) { setLoadError('انتهت مهلة الاتصال بقاعدة البيانات'); setReady(true); } }, 9000);
    return () => clearTimeout(t);
  }, []);

  // ----- تنفيذ العمليات على قاعدة البيانات -----
  const runOps = useCallback(async (ops) => {
    for (const op of ops) {
      let r;
      if (op.type === 'upsert') r = await supabase.from(TABLES[op.col]).upsert({ id: op.item.id, data: op.item });
      else if (op.type === 'bulk') r = op.items.length ? await supabase.from(TABLES[op.col]).upsert(op.items.map((item) => ({ id: item.id, data: item }))) : null;
      else if (op.type === 'delete') r = await supabase.from(TABLES[op.col]).delete().eq('id', op.id);
      else if (op.type === 'settings') { const { adminPasswordHash, ...rest } = op.value; r = await supabase.from('settings').upsert({ id: 'main', data: rest }); }
      if (r?.error) { toast('تعذر الحفظ في قاعدة البيانات: ' + r.error.message); refresh(); return false; }
    }
    return true;
  }, [toast, refresh]);

  const mutate = useCallback((fn) => {
    const { next, ops = [] } = fn(dataRef.current);
    dataRef.current = next; setData(next);
    if (REMOTE && ops.length) return runOps(ops);
    return Promise.resolve(true);
  }, [runOps]);

  const api = useMemo(() => {
    const withSettings = (d, patch) => { const settings = { ...d.settings, ...patch }; return { settings, op: { type: 'settings', value: settings } }; };
    return {
      upsert: (col, item) => mutate((d) => {
        const exists = d[col].some((x) => x.id === item.id);
        return { next: { ...d, [col]: exists ? d[col].map((x) => (x.id === item.id ? item : x)) : [...d[col], item] }, ops: [{ type: 'upsert', col, item }] };
      }),
      remove: (col, id) => mutate((d) => ({ next: { ...d, [col]: d[col].filter((x) => x.id !== id) }, ops: [{ type: 'delete', col, id }] })),
      setSettings: (patch) => mutate((d) => { const { settings, op } = withSettings(d, patch); return { next: { ...d, settings }, ops: [op] }; }),
      setLinks: (patch) => mutate((d) => { const { settings, op } = withSettings(d, { links: { ...d.settings.links, ...patch } }); return { next: { ...d, settings }, ops: [op] }; }),
      adjustPoints: (memberId, amount, reason) => {
        const userId = memberId.startsWith('u_') ? memberId.slice(2) : null;
        const item = { id: uid('p'), memberId, userId, amount: Number(amount), reason: reason || 'تعديل يدوي', date: localISO() };
        return mutate((d) => ({ next: { ...d, pointsLog: [item, ...d.pointsLog] }, ops: [{ type: 'upsert', col: 'pointsLog', item }] }));
      },
      adjustUserPoints: (userId, amount, reason) => {
        const item = { id: uid('p'), userId, memberId: `u_${userId}`, amount: Number(amount), reason: reason || 'تعديل يدوي', date: localISO() };
        return mutate((d) => ({ next: { ...d, pointsLog: [item, ...d.pointsLog] }, ops: [{ type: 'upsert', col: 'pointsLog', item }] }));
      },
      approveQuote: (id, memberId, points) => mutate((d) => {
        const q = d.quotes.find((x) => x.id === id);
        if (!q || q.status === 'approved') return { next: d };
        const pts = Number(points) || 0;
        const ops = []; let log = d.pointsLog;
        const awardMemberId = q.userId ? `u_${q.userId}` : memberId || q.memberId || null;
        if (awardMemberId && pts !== 0) {
          const entry = { id: uid('p'), userId: q.userId || null, memberId: awardMemberId, amount: pts, reason: q.type === 'review' ? 'مراجعة معتمدة' : 'اقتباس معتمد', date: localISO() };
          log = [entry, ...log]; ops.push({ type: 'upsert', col: 'pointsLog', item: entry });
        }
        const upd = { ...q, status: 'approved', memberId: awardMemberId, pointsAwarded: awardMemberId ? pts : 0 };
        ops.push({ type: 'upsert', col: 'quotes', item: upd });
        return { next: { ...d, pointsLog: log, quotes: d.quotes.map((x) => (x.id === id ? upd : x)) }, ops };
      }),
      rejectQuote: (id) => mutate((d) => {
        const q = d.quotes.find((x) => x.id === id); if (!q) return { next: d };
        const upd = { ...q, status: 'rejected' };
        return { next: { ...d, quotes: d.quotes.map((x) => (x.id === id ? upd : x)) }, ops: [{ type: 'upsert', col: 'quotes', item: upd }] };
      }),
      // الزوار: بتتبعت لقاعدة البيانات مباشرة (وبتظهر للأدمن بعد المراجعة)
      submitQuote: async (q) => {
        if (!user) throw new Error('سجّل الدخول لإرسال مشاركة');
        const item = { ...q, authorName: user.name, userId: user.id, id: uid('q'), memberId: `u_${user.id}`, status: 'pending', createdAt: new Date().toISOString(), pointsAwarded: 0 };
        if (REMOTE) {
          const { error } = await supabase.from('quotes').insert({ id: item.id, data: item });
          if (error) throw error;
          return;
        }
        await mutate((d) => ({ next: { ...d, quotes: [item, ...d.quotes] } }));
      },
      submitRequest: async (r) => {
        if (!user) throw new Error('سجّل الدخول لإرسال طلب انضمام');
        const item = { ...r, userId: user.id, id: uid('r'), createdAt: new Date().toISOString(), handled: false };
        if (REMOTE) {
          const { error } = await supabase.from('requests').insert({ id: item.id, data: item });
          if (error) throw error;
          return;
        }
        await mutate((d) => ({ next: { ...d, requests: [item, ...d.requests] } }));
      },
      refresh,
      reset: () => { if (!REMOTE) { const s = makeSeed(); dataRef.current = s; setData(s); } },
      // يرفع المحتوى التجريبي (أو أي نسخة احتياطية) إلى قاعدة البيانات
      importData: async (obj) => {
        const seed = makeSeed();
        if (!obj || typeof obj !== 'object' || !COLLECTIONS.every((k) => Array.isArray(obj[k] ?? []))) throw new Error('ملف غير صالح');
        const next = { ...Object.fromEntries(COLLECTIONS.map((k) => [k, obj[k] ?? []])), settings: mergeSettings(seed.settings, obj.settings) };
        await mutate(() => ({
          next,
          ops: [{ type: 'settings', value: next.settings }, ...COLLECTIONS.map((col) => ({ type: 'bulk', col, items: next[col] }))],
        }));
      },
      seedRemote: async () => api.importData(makeSeed()),
    };
  }, [mutate, refresh, user]);

  const registerUser = useCallback(async ({ name, email, password }) => {
    if (REMOTE) {
      const { data: result, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) throw error;
      if (result.session) setSession(result.session);
      return { needsConfirmation: !result.session };
    }
    const users = JSON.parse(localStorage.getItem(USERS) || '[]');
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('البريد الإلكتروني مسجل بالفعل');
    const account = { id: uid('u'), name: name.trim(), email: email.trim(), passwordHash: await sha256(password) };
    localStorage.setItem(USERS, JSON.stringify([...users, account]));
    sessionStorage.setItem(USER_AUTH, account.id);
    setLocalUser(account);
    const profiles = [...localProfiles, { id: account.id, name: account.name, email: account.email }];
    setLocalProfiles(profiles);
    const member = { id: `u_${account.id}`, name: account.name, role: 'قارئ' };
    dataRef.current = { ...dataRef.current, userProfiles: profiles, members: [...dataRef.current.members, member] };
    setData(dataRef.current);
    return { needsConfirmation: false };
  }, [localProfiles]);

  const loginUser = useCallback(async (email, password) => {
    if (REMOTE) {
      const { data: result, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setSession(result.session);
      return;
    }
    const users = JSON.parse(localStorage.getItem(USERS) || '[]');
    const account = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!account || account.passwordHash !== await sha256(password)) throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحين');
    sessionStorage.setItem(USER_AUTH, account.id);
    setLocalUser(account);
  }, []);

  const logoutUser = useCallback(async () => {
    if (REMOTE) { await supabase.auth.signOut(); return; }
    sessionStorage.removeItem(USER_AUTH);
    setLocalUser(null);
  }, []);

  const login = useCallback(async (emailOrPw, pw) => {
    if (REMOTE) {
      const { error } = await supabase.auth.signInWithPassword({ email: emailOrPw.trim(), password: pw });
      return !error;
    }
    const h = await sha256(emailOrPw);
    const expected = dataRef.current.settings.adminPasswordHash ?? (await sha256(DEFAULT_PASSWORD));
    if (h === expected) { sessionStorage.setItem(AUTH, '1'); setLocalAdmin(true); return true; }
    return false;
  }, []);
  const logout = useCallback(async () => {
    if (REMOTE) { await supabase.auth.signOut(); return; }
    sessionStorage.removeItem(AUTH); setLocalAdmin(false);
  }, []);
  const changePassword = useCallback(async (pw) => {
    if (REMOTE) { const { error } = await supabase.auth.updateUser({ password: pw }); if (error) throw error; return; }
    await api.setSettings({ adminPasswordHash: await sha256(pw) });
  }, [api]);

  const derived = useMemo(() => {
    const totals = {};
    data.pointsLog.forEach((p) => { totals[p.memberId] = (totals[p.memberId] || 0) + p.amount; });
    const userTotals = {};
    data.pointsLog.forEach((p) => {
      const userId = p.userId || (p.memberId?.startsWith('u_') ? p.memberId.slice(2) : null);
      if (userId) userTotals[userId] = (userTotals[userId] || 0) + p.amount;
    });
    if (!REMOTE) localProfiles.forEach((profile) => {
      if (userTotals[profile.id] === undefined) userTotals[profile.id] = 0;
    });
    const userPoints = user ? userTotals[user.id] || 0 : 0;
    const memberLeaderboard = data.members.map((m) => ({ ...m, points: totals[m.id] || 0 })).sort((a, b) => b.points - a.points);
    const leaderboard = memberLeaderboard.filter((m) => !m.hideFromLeaderboard);
    const today = localISO();
    const upcoming = data.events.filter((e) => e.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const past = data.events.filter((e) => e.date < today).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    const catById = Object.fromEntries(data.categories.map((c) => [c.id, c]));
    const memberById = Object.fromEntries(data.members.map((m) => [m.id, m]));
    const stored = data.settings.content || {};
    const content = { ...DEFAULT_CONTENT };
    Object.keys(DEFAULT_CONTENT).forEach((k) => {
      const v = stored[k];
      if (v === undefined) return;
      if (v === '' && !IMAGE_KEYS.has(k)) return; // النص الفاضي يرجع للافتراضي، والصورة الفاضية تعني «بدون صورة»
      content[k] = v;
    });
    return { totals, userTotals, userPoints, leaderboard, memberLeaderboard, upcoming, past, catById, memberById, content, currentCategory: catById[data.settings.currentCategoryId] || null };
  }, [data, localProfiles, user]);

  const value = useMemo(() => ({
    data, api, isAdmin, user, userProfiles: REMOTE ? data.userProfiles : localProfiles, loginUser, registerUser, logoutUser, login, logout, changePassword, ready, loadError, remote: REMOTE, adminChecked, session, ...derived,
  }), [data, api, isAdmin, user, loginUser, registerUser, logoutUser, login, logout, changePassword, ready, loadError, adminChecked, session, derived]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
