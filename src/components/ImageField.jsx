import { useRef, useState } from 'react';
import { uploadImage } from '../lib/images';
import { useToast } from './ui';

/** حقل صورة للوحة التحكم: رفع من الجهاز أو لصق رابط، مع معاينة */
export default function ImageField({ value, onChange, folder = 'misc', defaultValue }) {
  const file = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const pick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setBusy(true);
    try { onChange(await uploadImage(f, folder)); }
    catch (err) { toast('تعذر رفع الصورة: ' + (err.message || 'خطأ غير معروف')); }
    finally { setBusy(false); }
  };

  return (
    <div className="img-field">
      <div className="img-preview">
        {value ? <img src={value} alt="" /> : <span className="muted small">بدون صورة</span>}
      </div>
      <div className="img-actions">
        <button type="button" className="btn btn-sm btn-navy" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'جارٍ الرفع...' : 'رفع صورة'}</button>
        <button type="button" className="btn btn-sm btn-line" onClick={() => setShowUrl(!showUrl)}>رابط</button>
        {defaultValue !== undefined && value !== defaultValue && <button type="button" className="btn btn-sm btn-gold-line" onClick={() => onChange(defaultValue)}>الصورة الافتراضية</button>}
        {value && <button type="button" className="btn btn-sm btn-danger" onClick={() => onChange('')}>إزالة</button>}
        <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
      </div>
      {showUrl && <input type="url" dir="ltr" placeholder="https://..." value={value?.startsWith('data:') ? '' : value || ''} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}
