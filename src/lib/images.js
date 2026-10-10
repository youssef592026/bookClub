import { supabase } from './supabase';
import { uid } from './utils';

const BUCKET = 'images';

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

const toDataURL = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(blob);
});

// تصغير الصورة قبل الرفع عشان الموقع يفضل سريع
async function shrink(file, max, quality) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  const img = await loadImage(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise((resolve) => c.toBlob((b) => resolve(b || file), 'image/webp', quality));
}

/** يرفع الصورة ويرجّع رابطها. بدون Supabase بتتحفظ داخل المتصفح (وضع تجريبي). */
export async function uploadImage(file, folder = 'misc') {
  if (!file) throw new Error('لم يتم اختيار ملف');
  if (file.size > 12 * 1024 * 1024) throw new Error('حجم الصورة أكبر من 12 ميجا');
  if (supabase) {
    const blob = await shrink(file, 1600, 0.85);
    const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${folder}/${uid('img')}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000' });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  return toDataURL(await shrink(file, 900, 0.78));
}
