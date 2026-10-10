import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import PageHero from '../components/PageHero';
import { Avatar, Empty, Modal, Reveal, useToast } from '../components/ui';
import { fmtShort, levelFor, num } from '../lib/utils';

export function QuoteForm({ onDone }) {
  const { data, api, user } = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ type: 'quote', bookTitle: '', text: '', page: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.submitQuote({ ...f, authorName: user.name, text: f.text.trim() });
      toast('وصلت مشاركتك! هتظهر بعد مراجعة الأدمن.');
      onDone();
    } catch (err) { toast('تعذر إرسال المشاركة: ' + (err.message || 'حاول مرة أخرى')); }
    finally { setBusy(false); }
  };
  return (
    <form className="form" onSubmit={submit}>
      <label>اسمك
        <input value={user.name} readOnly />
      </label>
      <label>نوع المشاركة
        <select value={f.type} onChange={set('type')}>
          <option value="quote">اقتباس</option>
          <option value="review">مراجعة</option>
        </select>
      </label>
      <label>اسم الكتاب
        <input required list="books-list" value={f.bookTitle} onChange={set('bookTitle')} />
        <datalist id="books-list">{data.books.map((b) => <option key={b.id} value={b.title} />)}</datalist>
      </label>
      <label>{f.type === 'quote' ? 'نص الاقتباس' : 'مراجعتك'}
        <textarea required rows={5} maxLength={900} value={f.text} onChange={set('text')} />
      </label>
      {f.type === 'quote' && <label>رقم الصفحة (اختياري)<input value={f.page} onChange={set('page')} /></label>}
      <button className="btn btn-navy" type="submit" disabled={busy}>{busy ? 'جارٍ الإرسال...' : 'أرسل المشاركة'}</button>
    </form>
  );
}

export default function Quotes() {
  const { data, leaderboard, content: c, user } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState('all');
  const [form, setForm] = useState(false);
  useEffect(() => {
    if (!user || searchParams.get('compose') !== '1') return;
    setForm(true);
    const next = new URLSearchParams(searchParams);
    next.delete('compose');
    setSearchParams(next, { replace: true });
  }, [user, searchParams, setSearchParams]);
  const startSharing = () => {
    if (user) setForm(true);
    else navigate('/login', { state: { from: '/quotes?compose=1' } });
  };
  const approved = data.quotes.filter((q) => q.status === 'approved' && (type === 'all' || q.type === type));
  const rules = data.settings.pointsRules.split('\n').filter(Boolean);

  return (
    <>
      <PageHero title={c.quotesTitle} sub={c.quotesSub} image={c.quotesBannerImage}
        action={<button className="btn btn-navy" style={{ marginTop: 16 }} onClick={startSharing}>شارك اقتباسًا أو مراجعة</button>} />
      <section className="section">
        <div className="wrap">
          <div className="two-col top">
            <Reveal>
              <h3 className="sub">{c.boardTitle}</h3>
              <ol className="board">
                {leaderboard.slice(0, 10).map((m, i) => (
                  <li key={m.id}>
                    <span className="rank">{num(i + 1)}</span>
                    <Avatar member={m} />
                    <span className="grow"><strong>{m.name}</strong><small className="muted">{levelFor(m.points).name}</small></span>
                    <span className="pts">{num(m.points)} نقطة</span>
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={120}>
              <h3 className="sub">إزاي تكسب نقاط؟</h3>
              <ul className="rules">{rules.map((r) => <li key={r}>{r}</li>)}</ul>
            </Reveal>
          </div>

          <div className="chips" role="group" aria-label="النوع" style={{ marginTop: 32 }}>
            {[['all', 'الكل'], ['quote', 'اقتباسات'], ['review', 'مراجعات']].map(([k, l]) => (
              <button key={k} className={`chip ${type === k ? 'on' : ''}`} onClick={() => setType(k)}>{l}</button>
            ))}
          </div>

          {approved.length ? (
            <div className="quotes-grid">
              {approved.map((q, i) => (
                <Reveal key={q.id} delay={(i % 3) * 80}>
                  <figure className="quote">
                    <span className="tag">{q.type === 'review' ? 'مراجعة' : 'اقتباس'}</span>
                    <blockquote>{q.text}</blockquote>
                    <figcaption>
                      {q.authorName}{q.bookTitle ? `، عن ${q.bookTitle}` : ''}{q.page ? `، ص ${q.page}` : ''}
                      <small className="muted"> — {fmtShort((q.createdAt || '').slice(0, 10))}</small>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          ) : <Empty>ما فيش مشاركات منشورة بعد. كن أول من يشارك!</Empty>}
        </div>
        {form && <Modal title="مشاركة جديدة" onClose={() => setForm(false)}><QuoteForm onDone={() => setForm(false)} /></Modal>}
      </section>
    </>
  );
}
