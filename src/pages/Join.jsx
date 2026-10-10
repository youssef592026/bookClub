import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import PageHero from '../components/PageHero';
import { Reveal, Tilt, useToast } from '../components/ui';

export default function Join() {
  const { data, api, content: c, user } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', contact: '', about: '', categories: [], message: '' });
  useEffect(() => {
    if (user) setF((current) => ({ ...current, name: user.name, contact: current.contact || user.email || '' }));
  }, [user]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (id) => setF({ ...f, categories: f.categories.includes(id) ? f.categories.filter((x) => x !== id) : [...f.categories, id] });
  const { links } = data.settings;

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login', { state: { from: '/join?request=1' } }); return; }
    setBusy(true);
    try { await api.submitRequest(f); setSent(true); toast('تم إرسال طلبك، هنتواصل معاك قريبًا.'); }
    catch (err) { toast('تعذر إرسال الطلب: ' + (err.message || 'حاول مرة أخرى')); }
    finally { setBusy(false); }
  };

  const channels = [
    ['واتساب', 'للتنسيق السريع وإعلانات اللقاءات', links.whatsapp],
    ['تيليجرام', 'قناة الكتب والاقتباسات والملفات', links.telegram],
    ['فيسبوك', 'أخبار النادي وصور اللقاءات', links.facebook],
  ];

  return (
    <>
      <PageHero title={c.joinTitle} sub={c.joinSub} image={c.joinBannerImage} />
      <section className="section">
        <div className="wrap">
          <div className="channels">
            {channels.map(([name, desc, href], i) => (
              <Reveal key={name} delay={i * 90}>
                <Tilt className="channel-wrap" max={7}>
                  <a href={href} target="_blank" rel="noreferrer" className="channel">
                    <strong>{name}</strong>
                    <span className="muted">{desc}</span>
                    <span className="btn btn-sm btn-navy">انضم عبر {name}</span>
                  </a>
                </Tilt>
              </Reveal>
            ))}
          </div>

          <div className="join-form">
            <h3 className="sub">أو سيب بياناتك</h3>
            {sent ? (
              <div className="empty">وصلنا طلبك. شكرًا لاهتمامك بالانضمام لـ{data.settings.clubName}.</div>
            ) : !user ? (
              <div className="empty auth-prompt">
                <p>سجّل الدخول أو أنشئ حسابًا لإرسال طلب الانضمام.</p>
                <div className="btn-row"><Link className="btn btn-navy" to="/login" state={{ from: '/join?request=1' }}>تسجيل الدخول</Link><Link className="btn btn-line" to="/register" state={{ from: '/join?request=1' }}>إنشاء حساب</Link></div>
              </div>
            ) : (
              <form className="form" onSubmit={submit}>
                <label>الاسم<input required value={f.name} onChange={set('name')} /></label>
                <label>رقم واتساب أو بريد إلكتروني<input required value={f.contact} onChange={set('contact')} /></label>
                <label>دراستك أو شغلك (اختياري)<input value={f.about} onChange={set('about')} /></label>
                <fieldset>
                  <legend>إيه الفئات اللي تحب تقرأ فيها؟</legend>
                  <div className="chips">
                    {data.categories.map((x) => (
                      <button type="button" key={x.id} className={`chip chip-sm ${f.categories.includes(x.id) ? 'on' : ''}`} aria-pressed={f.categories.includes(x.id)} onClick={() => toggle(x.id)}>{x.name}</button>
                    ))}
                  </div>
                </fieldset>
                <label>رسالة (اختياري)<textarea rows={3} value={f.message} onChange={set('message')} /></label>
                <button className="btn btn-navy" type="submit" disabled={busy}>{busy ? 'جارٍ الإرسال...' : 'أرسل الطلب'}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
