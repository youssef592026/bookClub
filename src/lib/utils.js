export const uid = (p = 'id') =>
  p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const pad = (n) => String(n).padStart(2, '0');
export const localISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return localISO(d); };

const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };

export const num = (x) => Number(x || 0).toLocaleString('ar-EG');
export const fmtDate = (iso) => iso ? parse(iso).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
export const fmtShort = (iso) => iso ? parse(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '';
export const dayNum = (iso) => parse(iso).toLocaleDateString('ar-EG', { day: 'numeric' });
export const monthName = (iso) => parse(iso).toLocaleDateString('ar-EG', { month: 'long' });
export const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
};
export const daysUntil = (iso) => Math.round((parse(iso) - parse(localISO())) / 86400000);

export const LEVELS = [
  { min: 0, name: 'قارئ جديد' },
  { min: 20, name: 'قارئ نشيط' },
  { min: 50, name: 'قارئ متمرّس' },
  { min: 100, name: 'حامل الشعلة' },
];
export const levelFor = (pts) => [...LEVELS].reverse().find((l) => pts >= l.min) || LEVELS[0];

export const COLORS = {
  navy: { label: 'كحلي', bg: '#1b3258', fg: '#f3e8d0' },
  gold: { label: 'ذهبي', bg: '#9a742f', fg: '#fbf3df' },
  olive: { label: 'زيتي', bg: '#59663a', fg: '#f3ecd6' },
  flame: { label: 'برتقالي', bg: '#b8631f', fg: '#fff3df' },
};

export async function sha256(text) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'x' + btoa(unescape(encodeURIComponent(text)));
  }
}

export function downloadFile(name, content, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function eventToICS(ev, clubName) {
  const [y, m, d] = ev.date.split('-');
  const [hh, mm] = (ev.time || '18:00').split(':');
  const start = `${y}${m}${d}T${hh}${mm}00`;
  const endH = pad((Number(hh) + 2) % 24);
  const end = `${y}${m}${d}T${endH}${mm}00`;
  const esc = (s = '') => s.replace(/[,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${clubName}//AR`, 'BEGIN:VEVENT',
    `UID:${ev.id}@bayn-alsotour`, `DTSTAMP:${start}`, `DTSTART:${start}`, `DTEND:${end}`,
    `SUMMARY:${esc(ev.title)}`, `LOCATION:${esc(ev.location || ev.link || '')}`,
    `DESCRIPTION:${esc(ev.description || '')}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
