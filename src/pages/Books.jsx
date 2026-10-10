import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { BookCard } from '../components/Cards';
import PageHero from '../components/PageHero';
import { Cover, Empty, Modal, Reveal, Tilt } from '../components/ui';

export default function Books() {
  const { data, catById, memberById, content: c } = useStore();
  const [cat, setCat] = useState('all');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);

  const list = useMemo(() => data.books.filter((b) =>
    (cat === 'all' || b.categoryId === cat) &&
    (status === 'all' || b.status === status) &&
    (!q.trim() || (b.title + ' ' + b.author).includes(q.trim()))
  ), [data.books, cat, status, q]);
  const selected = catById[cat];

  return (
    <>
      <PageHero title={c.booksTitle} sub={c.booksSub} image={c.booksBannerImage} />
      <section className="section">
        <div className="wrap">
          <div className="filters">
            <input type="search" placeholder="ابحث باسم الكتاب أو المؤلف" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث" />
            <div className="chips" role="group" aria-label="الفئات">
              <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>الكل</button>
              {data.categories.map((x) => (
                <button key={x.id} className={`chip ${cat === x.id ? 'on' : ''}`} onClick={() => setCat(x.id)}>
                  {x.name}{x.id === data.settings.currentCategoryId ? ' (الجولة الحالية)' : ''}
                </button>
              ))}
            </div>
            <div className="chips" role="group" aria-label="الحالة">
              {[['all', 'كل الحالات'], ['reading', 'نقرأه الآن'], ['done', 'تمت قراءته']].map(([k, l]) => (
                <button key={k} className={`chip chip-sm ${status === k ? 'on' : ''}`} onClick={() => setStatus(k)}>{l}</button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="cat-banner">
              {selected.image && <Tilt className="frame small"><img src={selected.image} alt="" /></Tilt>}
              <div><h3>{selected.name}</h3><p className="muted">{selected.description}</p></div>
            </div>
          )}

          {list.length ? <div className="grid books-grid">{list.map((b, i) => <Reveal key={b.id} delay={(i % 6) * 60}><BookCard book={b} onOpen={setOpen} /></Reveal>)}</div>
            : <Empty>ما لقيناش كتب مطابقة. جرّب تغيّر البحث أو الفئة.</Empty>}
        </div>

        {open && (
          <Modal title={open.title} onClose={() => setOpen(null)}>
            <div className="book-detail">
              <Cover book={open} category={catById[open.categoryId]} size="lg" />
              <div>
                <p className="muted">{open.author}</p>
                <div className="tags">
                  <span className="tag">{catById[open.categoryId]?.name || 'بدون فئة'}</span>
                  <span className={`tag ${open.status === 'reading' ? 'tag-live' : ''}`}>{open.status === 'reading' ? 'نقرأه الآن' : 'تمت قراءته'}</span>
                </div>
                {open.description && <p>{open.description}</p>}
                {memberById[open.pickedBy] && <p className="small muted">اختاره: {memberById[open.pickedBy].name}</p>}
              </div>
            </div>
          </Modal>
        )}
      </section>
    </>
  );
}
