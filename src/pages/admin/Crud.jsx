import { useState } from 'react';
import { Empty, Modal } from '../../components/ui';
import ImageField from '../../components/ImageField';
import { uid } from '../../lib/utils';

/**
 * جدول إدارة عام: بيعرض عناصر ويضيف ويعدّل ويحذف حسب تعريف `fields`.
 * field = { key, label, type: text|textarea|select|date|time|url|number, options, required, table, render }
 */
export default function Crud({ title, singular, items, fields, onSave, onDelete, defaults = {}, extra, hint }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [confirm, setConfirm] = useState(null);

  const openNew = () => { setDraft({ id: uid(singular[0]), ...defaults }); setEditing('new'); };
  const openEdit = (it) => { setDraft({ ...it }); setEditing(it.id); };
  const save = (e) => { e.preventDefault(); onSave(draft); setEditing(null); };
  const cols = fields.filter((f) => f.table);

  return (
    <div>
      <div className="admin-bar">
        <h2>{title}</h2>
        <button className="btn btn-navy btn-sm" onClick={openNew}>+ إضافة {singular}</button>
      </div>
      {hint && <p className="muted small">{hint}</p>}
      {items.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr>{cols.map((c) => <th key={c.key}>{c.label}</th>)}<th>إجراءات</th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  {cols.map((c) => <td key={c.key} data-label={c.label}>{c.render ? c.render(it) : it[c.key]}</td>)}
                  <td data-label="إجراءات" className="actions">
                    {extra?.(it)}
                    <button className="btn btn-sm btn-line" onClick={() => openEdit(it)}>تعديل</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setConfirm(it)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>ما فيش عناصر لسه. اضغط «إضافة {singular}» لتبدأ.</Empty>}

      {editing && (
        <Modal title={editing === 'new' ? `إضافة ${singular}` : `تعديل ${singular}`} onClose={() => setEditing(null)}>
          <form className="form" onSubmit={save}>
            {fields.map((f) => (f.type === 'image' ? (
              <div key={f.key} className="lbl">
                <span>{f.label}</span>
                <ImageField value={draft[f.key] || ''} folder={f.folder || singular} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
              </div>
            ) : (
              <label key={f.key}>{f.label}
                {f.type === 'textarea' ? (
                  <textarea rows={3} required={f.required} value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
                ) : f.type === 'select' ? (
                  <select required={f.required} value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}>
                    {!f.required && <option value="">— بدون —</option>}
                    {f.options().map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : (
                  <input type={f.type || 'text'} required={f.required} dir={f.type === 'url' ? 'ltr' : undefined} value={draft[f.key] ?? ''} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
                )}
              </label>
            )))}
            <div className="btn-row">
              <button className="btn btn-navy" type="submit">حفظ</button>
              <button className="btn btn-line" type="button" onClick={() => setEditing(null)}>إلغاء</button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal title="تأكيد الحذف" onClose={() => setConfirm(null)}>
          <p>هل تريد حذف «{confirm.title || confirm.name}» نهائيًا؟</p>
          <div className="btn-row">
            <button className="btn btn-danger" onClick={() => { onDelete(confirm.id); setConfirm(null); }}>نعم، احذف</button>
            <button className="btn btn-line" onClick={() => setConfirm(null)}>تراجع</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
