import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Avatar, Empty, Modal, useToast } from '../../components/ui';
import Crud from './Crud';
import { COLORS, downloadFile, fmtDate, fmtShort, levelFor, num } from '../../lib/utils';

export function ManageBooks() {
  const { data, api, catById, memberById } = useStore();
  const fields = [
    { key: 'coverUrl', label: 'صورة الغلاف', type: 'image', table: true, folder: 'books', render: (b) => (b.coverUrl ? <img className="thumb thumb-book" src={b.coverUrl} alt="" loading="lazy" /> : '—') },
    { key: 'title', label: 'اسم الكتاب', required: true, table: true },
    { key: 'author', label: 'المؤلف', required: true, table: true },
    { key: 'categoryId', label: 'الفئة', type: 'select', required: true, options: () => data.categories.map((c) => [c.id, c.name]), table: true, render: (b) => catById[b.categoryId]?.name || '—' },
    { key: 'pickedBy', label: 'اختاره العضو', type: 'select', options: () => data.members.map((m) => [m.id, m.name]), table: true, render: (b) => memberById[b.pickedBy]?.name || '—' },
    { key: 'status', label: 'الحالة', type: 'select', required: true, options: () => [['reading', 'نقرأه الآن'], ['done', 'تمت قراءته']], table: true, render: (b) => (b.status === 'reading' ? 'نقرأه الآن' : 'تمت قراءته') },
    { key: 'description', label: 'نبذة قصيرة', type: 'textarea' },
  ];
  return <Crud title="الكتب" singular="كتاب" items={data.books} fields={fields} defaults={{ status: 'reading', categoryId: data.settings.currentCategoryId }}
    onSave={(b) => api.upsert('books', b)} onDelete={(id) => api.remove('books', id)} />;
}

export function ManageCategories() {
  const { data, api } = useStore();
  const toast = useToast();
  const fields = [
    { key: 'image', label: 'صورة الفئة', type: 'image', table: true, folder: 'categories', render: (c) => (c.image ? <img className="thumb" src={c.image} alt="" loading="lazy" /> : '—') },
    { key: 'name', label: 'اسم الفئة', required: true, table: true },
    { key: 'description', label: 'وصف', type: 'textarea', table: true },
    { key: 'color', label: 'لون الغلاف البديل (لو مفيش صورة للكتاب)', type: 'select', required: true, options: () => Object.entries(COLORS).map(([k, v]) => [k, v.label]), table: true, render: (c) => COLORS[c.color]?.label },
  ];
  const cur = data.settings.currentCategoryId;
  return <Crud title="الفئات" singular="فئة" items={data.categories} fields={fields} defaults={{ color: 'navy' }}
    hint="اختر «فئة الجولة الحالية» لتظهر في الصفحة الرئيسية."
    onSave={(c) => api.upsert('categories', c)} onDelete={(id) => api.remove('categories', id)}
    extra={(c) => c.id === cur
      ? <span className="tag tag-live">الجولة الحالية</span>
      : <button className="btn btn-sm btn-gold-line" onClick={() => { api.setSettings({ currentCategoryId: c.id }); toast(`فئة الجولة الآن: ${c.name}`); }}>اجعلها الجولة الحالية</button>} />;
}

export function ManageEvents() {
  const { data, api, catById } = useStore();
  const sorted = [...data.events].sort((a, b) => b.date.localeCompare(a.date));
  const fields = [
    { key: 'image', label: 'صورة اللقاء / المناقشة', type: 'image', table: true, folder: 'events', render: (e) => (e.image ? <img className="thumb" src={e.image} alt="" loading="lazy" /> : '—') },
    { key: 'title', label: 'عنوان اللقاء', required: true, table: true },
    { key: 'date', label: 'التاريخ', type: 'date', required: true, table: true, render: (e) => fmtShort(e.date) },
    { key: 'time', label: 'الوقت', type: 'time', required: true },
    { key: 'mode', label: 'النوع', type: 'select', required: true, options: () => [['حضوري', 'حضوري'], ['أونلاين', 'أونلاين']], table: true },
    { key: 'location', label: 'المكان (للحضوري)' },
    { key: 'link', label: 'رابط الاجتماع (للأونلاين)', type: 'url' },
    { key: 'categoryId', label: 'الفئة', type: 'select', options: () => data.categories.map((c) => [c.id, c.name]), table: true, render: (e) => catById[e.categoryId]?.name || '—' },
    { key: 'description', label: 'وصف اللقاء', type: 'textarea' },
    { key: 'notes', label: 'ملخص بعد اللقاء (يظهر في اللقاءات السابقة)', type: 'textarea' },
  ];
  return <Crud title="اللقاءات" singular="لقاء" items={sorted} fields={fields} defaults={{ mode: 'حضوري', time: '18:00', categoryId: data.settings.currentCategoryId }}
    onSave={(e) => api.upsert('events', e)} onDelete={(id) => api.remove('events', id)} />;
}

export function ManageMembers() {
  const { data, api, memberLeaderboard, totals } = useStore();
  const toast = useToast();
  const [pts, setPts] = useState(null);
  const [log, setLog] = useState(null);
  const [form, setForm] = useState({ amount: '', reason: '' });
  const fields = [
    { key: 'photo', label: 'صورة العضو', type: 'image', table: true, folder: 'members', render: (m) => <Avatar member={m} size={38} /> },
    { key: 'name', label: 'الاسم', required: true, table: true },
    { key: 'role', label: 'الدور', type: 'select', required: true, options: () => [['عضو', 'عضو'], ['منظّم', 'منظّم'], ['مؤسس', 'مؤسس']], table: true },
    { key: 'points', label: 'النقاط', table: true, render: (m) => `${num(totals[m.id] || 0)} (${levelFor(totals[m.id] || 0).name})` },
  ];
  const submit = async (e) => {
    e.preventDefault();
    const saved = await api.adjustPoints(pts.id, form.amount, form.reason);
    if (!saved) return;
    toast(`تم تحديث نقاط ${pts.name}`);
    setPts(null); setForm({ amount: '', reason: '' });
  };
  return (
    <>
      <Crud title="الأعضاء والنقاط" singular="عضو" items={memberLeaderboard} fields={fields} defaults={{ role: 'عضو' }}
        hint="الترتيب حسب النقاط. استخدم «نقاط» للإضافة أو الخصم مع ذكر السبب."
        onSave={(m) => api.upsert('members', m)} onDelete={(id) => api.remove('members', id)}
        extra={(m) => (<>
          <button className="btn btn-sm btn-gold-line" onClick={() => setPts(m)}>نقاط</button>
          <button className="btn btn-sm btn-line" onClick={() => setLog(m)}>السجل</button>
        </>)} />
      {pts && (
        <Modal title={`تعديل نقاط ${pts.name}`} onClose={() => setPts(null)}>
          <form className="form" onSubmit={submit}>
            <label>عدد النقاط (اكتب رقمًا سالبًا للخصم)
              <input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </label>
            <label>السبب
              <input required placeholder="مثال: انتظام في النشر لمدة ٣ أسابيع" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </label>
            <button className="btn btn-navy" type="submit">حفظ</button>
          </form>
        </Modal>
      )}
      {log && (
        <Modal title={`سجل نقاط ${log.name}`} onClose={() => setLog(null)}>
          {data.pointsLog.filter((p) => p.memberId === log.id).length ? (
            <ul className="log">
              {data.pointsLog.filter((p) => p.memberId === log.id).map((p) => (
                <li key={p.id}><strong className={p.amount < 0 ? 'neg' : 'pos'}>{p.amount > 0 ? '+' : ''}{num(p.amount)}</strong><span>{p.reason}</span><small className="muted">{fmtDate(p.date)}</small></li>
              ))}
            </ul>
          ) : <Empty>ما فيش حركات نقاط لهذا العضو.</Empty>}
        </Modal>
      )}
    </>
  );
}

export function ManageUsers() {
  const { userProfiles, userTotals, api } = useStore();
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ amount: '', reason: '' });
  const [search, setSearch] = useState('');
  const toast = useToast();
  const users = userProfiles
    .filter((profile) => `${profile.name} ${profile.email}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, 'ar'));

  const submit = async (event) => {
    event.preventDefault();
    const saved = await api.adjustUserPoints(selected.id, form.amount, form.reason);
    if (!saved) return;
    toast(`تم تحديث نقاط ${selected.name || selected.email}`);
    setSelected(null);
    setForm({ amount: '', reason: '' });
  };

  return (
    <div>
      <div className="admin-bar"><h2>حسابات المستخدمين</h2></div>
      <label className="user-search">بحث بالاسم أو البريد
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      {users.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الرصيد</th><th>إجراء</th></tr></thead>
            <tbody>{users.map((profile) => (
              <tr key={profile.id}>
                <td data-label="الاسم">{profile.name || '—'}</td>
                <td data-label="البريد الإلكتروني" dir="ltr">{profile.email}</td>
                <td data-label="الرصيد">{num(userTotals[profile.id] || 0)} نقطة</td>
                <td className="actions"><button className="btn btn-sm btn-gold-line" onClick={() => setSelected(profile)}>تعديل النقاط</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <Empty>{userProfiles.length ? 'لا توجد نتائج مطابقة.' : 'لا توجد حسابات مسجلة بعد.'}</Empty>}
      {selected && (
        <Modal title={`تعديل نقاط ${selected.name || selected.email}`} onClose={() => setSelected(null)}>
          <form className="form" onSubmit={submit}>
            <p className="muted">الرصيد الحالي: {num(userTotals[selected.id] || 0)} نقطة</p>
            <label>عدد النقاط (اكتب رقمًا سالبًا للخصم)
              <input type="number" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
            </label>
            <label>السبب
              <input required maxLength={240} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
            </label>
            <button className="btn btn-navy" type="submit">حفظ النقاط</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function ManageQuotes() {
  const { data, api, memberById } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [sel, setSel] = useState(null);       // moderation modal
  const [edit, setEdit] = useState(null);
  const [mid, setMid] = useState('');
  const [pts, setPts] = useState(0);
  const [saving, setSaving] = useState(false);
  const list = data.quotes.filter((q) => q.status === tab);
  const counts = (s) => data.quotes.filter((q) => q.status === s).length;
  const s = data.settings;

  const open = (q) => { setSel(q); setMid(q.memberId || ''); setPts(q.type === 'review' ? s.pointsPerReview : s.pointsPerQuote); };
  const approve = async () => {
    setSaving(true);
    try {
      const saved = await api.approveQuote(sel.id, mid, pts);
      if (saved) { toast('تم النشر وإضافة النقاط'); setSel(null); }
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="admin-bar"><h2>الاقتباسات والمراجعات</h2></div>
      <div className="chips">
        {[['pending', 'بانتظار المراجعة'], ['approved', 'منشورة'], ['rejected', 'مرفوضة']].map(([k, l]) => (
          <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l} ({num(counts(k))})</button>
        ))}
      </div>
      {list.length ? (
        <div className="stack" style={{ marginTop: 16 }}>
          {list.map((q) => (
            <div className="mod-card" key={q.id}>
              <div className="tags"><span className="tag">{q.type === 'review' ? 'مراجعة' : 'اقتباس'}</span>
                {q.status === 'approved' && <span className="tag tag-live">{num(q.pointsAwarded)} نقطة</span>}</div>
              <p>{q.text}</p>
              <p className="small muted">{q.authorName}{q.bookTitle ? ` — ${q.bookTitle}` : ''}{!q.memberId && q.status === 'pending' ? ' — الاسم غير مرتبط بعضو' : ''}</p>
              <div className="btn-row">
                {q.status !== 'approved' && <button className="btn btn-sm btn-navy" onClick={() => open(q)}>مراجعة ونشر</button>}
                {q.status === 'pending' && <button className="btn btn-sm btn-line" onClick={() => api.rejectQuote(q.id)}>رفض</button>}
                <button className="btn btn-sm btn-line" onClick={() => setEdit({ ...q })}>تعديل النص</button>
                <button className="btn btn-sm btn-danger" onClick={() => api.remove('quotes', q.id)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty>لا توجد عناصر في هذا القسم.</Empty>}

      {sel && (
        <Modal title="مراجعة ونشر" onClose={() => setSel(null)}>
          <p>{sel.text}</p>
          <div className="form">
            {sel.userId ? <p className="muted small">المشاركة مرتبطة بحساب {sel.authorName}؛ النقاط ستُضاف تلقائيًا لحسابه ولوحة الشرف.</p> : (
              <label>اختيار عضو للمشاركة القديمة لاحتساب نقاطه
                <select value={mid} onChange={(e) => setMid(e.target.value)}>
                  <option value="">— انشر من غير نقاط لعضو —</option>
                  {data.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
            )}
            <label>النقاط الممنوحة
              <input type="number" value={pts} onChange={(e) => setPts(e.target.value)} />
            </label>
            <button className="btn btn-navy" disabled={saving} onClick={approve}>{saving ? 'جارٍ النشر...' : 'نشر الآن'}</button>
          </div>
        </Modal>
      )}
      {edit && (
        <Modal title="تعديل النص" onClose={() => setEdit(null)}>
          <form className="form" onSubmit={(e) => { e.preventDefault(); api.upsert('quotes', edit); setEdit(null); }}>
            <textarea rows={6} required value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} />
            <button className="btn btn-navy" type="submit">حفظ</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function ManageRequests() {
  const { data, api } = useStore();
  const { catById } = useStore();
  return (
    <div>
      <div className="admin-bar"><h2>طلبات الانضمام</h2></div>
      {data.requests.length ? (
        <div className="stack">
          {data.requests.map((r) => (
            <div key={r.id} className={`mod-card ${r.handled ? 'done' : ''}`}>
              <div className="tags">
                <strong>{r.name}</strong>
                {r.handled && <span className="tag">تم التواصل</span>}
              </div>
              <p className="small" dir="auto">{r.contact}{r.about ? ` — ${r.about}` : ''}</p>
              {r.categories?.length > 0 && <p className="small muted">يهتم بـ: {r.categories.map((id) => catById[id]?.name).filter(Boolean).join('، ')}</p>}
              {r.message && <p>{r.message}</p>}
              <div className="btn-row">
                <button className="btn btn-sm btn-line" onClick={() => api.upsert('requests', { ...r, handled: !r.handled })}>{r.handled ? 'إلغاء علامة التواصل' : 'تم التواصل'}</button>
                <button className="btn btn-sm btn-gold-line" onClick={() => api.upsert('members', { id: 'm_' + r.id, name: r.name, role: 'عضو' })}>إضافته كعضو</button>
                <button className="btn btn-sm btn-danger" onClick={() => api.remove('requests', r.id)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty>لا توجد طلبات انضمام جديدة.</Empty>}
    </div>
  );
}

export function Settings() {
  const { data, api, changePassword, logout, remote } = useStore();
  const toast = useToast();
  const s = data.settings;
  const [f, setF] = useState({ clubName: s.clubName, pointsPerQuote: s.pointsPerQuote, pointsPerReview: s.pointsPerReview, pointsRules: s.pointsRules, links: { ...s.links } });
  const [pw, setPw] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setL = (k) => (e) => setF({ ...f, links: { ...f.links, [k]: e.target.value } });

  const save = (e) => {
    e.preventDefault();
    api.setSettings({ clubName: f.clubName, links: f.links, pointsRules: f.pointsRules, pointsPerQuote: Number(f.pointsPerQuote), pointsPerReview: Number(f.pointsPerReview) });
    toast('تم حفظ الإعدادات');
  };
  const savePw = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return toast('كلمة المرور لازم تكون ٦ أحرف على الأقل');
    try { await changePassword(pw); setPw(''); toast('تم تغيير كلمة المرور'); }
    catch (err) { toast('تعذر تغيير كلمة المرور: ' + (err.message || '')); }
  };
  return (
    <div>
      <div className="admin-bar"><h2>الإعدادات</h2></div>
      <p className="muted small">العناوين والنصوص والصور تتعدل من صفحة «المحتوى والصور».</p>
      <form className="form panel" onSubmit={save}>
        <h3>الاسم</h3>
        <label>اسم النادي<input required value={f.clubName} onChange={set('clubName')} /></label>
        <h3>روابط التواصل</h3>
        <label>واتساب<input type="url" dir="ltr" value={f.links.whatsapp} onChange={setL('whatsapp')} /></label>
        <label>تيليجرام<input type="url" dir="ltr" value={f.links.telegram} onChange={setL('telegram')} /></label>
        <label>فيسبوك<input type="url" dir="ltr" value={f.links.facebook} onChange={setL('facebook')} /></label>
        <h3>نظام النقاط</h3>
        <label>نقاط الاقتباس الافتراضية<input type="number" min="0" value={f.pointsPerQuote} onChange={set('pointsPerQuote')} /></label>
        <label>نقاط المراجعة الافتراضية<input type="number" min="0" value={f.pointsPerReview} onChange={set('pointsPerReview')} /></label>
        <label>قواعد النقاط (سطر لكل قاعدة، تظهر للزوار)<textarea rows={4} value={f.pointsRules} onChange={set('pointsRules')} /></label>
        <button className="btn btn-navy" type="submit">حفظ الإعدادات</button>
      </form>
      <form className="form panel" onSubmit={savePw}>
        <h3>{remote ? 'كلمة مرور حسابك' : 'كلمة مرور الأدمن'}</h3>
        <label>كلمة المرور الجديدة<input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <div className="btn-row">
          <button className="btn btn-navy" type="submit">تغيير كلمة المرور</button>
          <button className="btn btn-line" type="button" onClick={logout}>تسجيل الخروج</button>
        </div>
      </form>
    </div>
  );
}

export function DataTools() {
  const { data, api, remote } = useStore();
  const toast = useToast();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const exportData = () => downloadFile(`bayn-alsotour-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
  const importFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { await api.importData(JSON.parse(await file.text())); toast('تم استيراد البيانات'); }
    catch { toast('الملف غير صالح'); }
    e.target.value = '';
  };
  const seed = async () => {
    setBusy(true);
    try { await api.seedRemote(); await api.refresh(); toast('تم رفع المحتوى التجريبي لقاعدة البيانات'); }
    catch (err) { toast('تعذر الرفع: ' + (err.message || '')); }
    finally { setBusy(false); setAsk(false); }
  };
  return (
    <div>
      <div className="admin-bar"><h2>النسخ الاحتياطي والبيانات</h2></div>
      <div className="panel">
        <p>{remote
          ? 'البيانات محفوظة في قاعدة بيانات Supabase ومشتركة بين كل الأجهزة. صدّر نسخة احتياطية بشكل دوري.'
          : 'الموقع شغال في الوضع التجريبي: البيانات محفوظة في هذا المتصفح فقط. اربطه بـ Supabase عشان تتشارك بين الأجهزة.'}</p>
        <div className="btn-row">
          <button className="btn btn-navy" onClick={exportData}>تصدير نسخة (JSON)</button>
          <label className="btn btn-line file-btn">استيراد نسخة<input type="file" accept="application/json" onChange={importFile} hidden /></label>
          {remote && <button className="btn btn-line" onClick={() => api.refresh().then(() => toast('تم تحديث البيانات'))}>تحديث من قاعدة البيانات</button>}
          <button className="btn btn-danger" disabled={busy} onClick={() => setAsk(true)}>{remote ? 'رفع المحتوى التجريبي لقاعدة البيانات' : 'إعادة المحتوى التجريبي'}</button>
        </div>
      </div>
      {ask && (
        <Modal title="تأكيد" onClose={() => setAsk(false)}>
          <p>{remote ? 'هيتم رفع الكتب والفئات واللقاءات التجريبية إلى قاعدة البيانات (ولو فيه عناصر بنفس المعرّف هتتبدل). متأكد؟' : 'سيتم حذف كل بياناتك الحالية واستبدالها بالمحتوى التجريبي. متأكد؟'}</p>
          <div className="btn-row">
            <button className="btn btn-danger" disabled={busy} onClick={remote ? seed : () => { api.reset(); setAsk(false); toast('تمت إعادة الضبط'); }}>{busy ? 'جارٍ الرفع...' : 'نعم، أكمل'}</button>
            <button className="btn btn-line" onClick={() => setAsk(false)}>تراجع</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
