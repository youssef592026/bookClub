import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// لو المتغيرات مش موجودة في ملف .env الموقع بيشتغل في «وضع تجريبي» محلي
export const supabase = url && key && !key.includes('ضع') ? createClient(url, key) : null;

// اسم المجموعة في الموقع -> اسم الجدول في قاعدة البيانات
export const TABLES = {
  categories: 'categories',
  members: 'members',
  books: 'books',
  events: 'events',
  quotes: 'quotes',
  pointsLog: 'points_log',
  requests: 'requests',
  userProfiles: 'user_profiles',
};
