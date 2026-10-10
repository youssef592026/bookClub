import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useToast } from '../../components/ui';
import ImageField from '../../components/ImageField';
import { CONTENT_GROUPS, DEFAULT_CONTENT } from '../../data/content';

/** يعدّل أي عنوان أو نص أو صورة في الموقع */
export default function ContentAdmin() {
  const { data, api, content } = useStore();
  const toast = useToast();
  const s = data.settings;
  const [f, setF] = useState({ ...content, tagline: s.tagline, about: s.about, goal: s.goal });
  const [saving, setSaving] = useState(false);
  const setKey = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { tagline, about, goal, ...rest } = f;
    await api.setSettings({ tagline, about, goal, content: rest });
    setSaving(false);
    toast('تم حفظ المحتوى والصور');
  };

  return (
    <form onSubmit={save}>
      <div className="admin-bar">
        <h2>المحتوى والصور</h2>
        <button className="btn btn-navy" type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ كل التغييرات'}</button>
      </div>
      <p className="muted small">غيّر أي عنوان أو نص أو صورة في الموقع. صور الكتب والفئات واللقاءات والأعضاء بتتغير من صفحاتها.</p>
      {CONTENT_GROUPS.map((g) => (
        <fieldset className="panel form content-group" key={g.title}>
          <legend>{g.title}</legend>
          {g.fields.map((fl) => (fl.type === 'image' ? (
            <div className="lbl" key={fl.key}>
              <span>{fl.label}</span>
              <ImageField value={f[fl.key] || ''} folder="site" defaultValue={DEFAULT_CONTENT[fl.key]} onChange={(v) => setKey(fl.key, v)} />
            </div>
          ) : (
            <label key={fl.key}>{fl.label}
              {fl.type === 'textarea'
                ? <textarea rows={3} value={f[fl.key] ?? ''} onChange={(e) => setKey(fl.key, e.target.value)} />
                : <input value={f[fl.key] ?? ''} onChange={(e) => setKey(fl.key, e.target.value)} />}
            </label>
          )))}
        </fieldset>
      ))}
      <button className="btn btn-navy" type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ كل التغييرات'}</button>
    </form>
  );
}
