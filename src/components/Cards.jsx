import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Cover, Tilt } from './ui';
import { dayNum, daysUntil, fmtTime, monthName, num } from '../lib/utils';

export function BookCard({ book, onOpen }) {
  const { catById, memberById } = useStore();
  const cat = catById[book.categoryId];
  const picker = memberById[book.pickedBy];
  return (
    <button className="book-card" onClick={() => onOpen?.(book)} aria-label={`${book.title}، ${book.author}`}>
      <div className="b3d">
        <div className="b3d-body">
          <div className="b3d-face b3d-front"><Cover book={book} category={cat} size="fill" /></div>
          <div className="b3d-face b3d-back" />
          <div className="b3d-face b3d-spine" />
          <div className="b3d-face b3d-pages" />
          <div className="b3d-face b3d-top" />
        </div>
        <div className="b3d-shadow" />
      </div>
      <div className="book-info">
        <h3>{book.title}</h3>
        <p className="muted">{book.author}</p>
        <div className="tags">
          <span className="tag">{cat?.name || 'بدون فئة'}</span>
          {book.status === 'reading' && <span className="tag tag-live">نقرأه الآن</span>}
        </div>
        {picker && <p className="small muted">اختاره: {picker.name}</p>}
      </div>
    </button>
  );
}

export function DateBadge({ date }) {
  return (
    <div className="date-badge">
      <strong>{dayNum(date)}</strong>
      <span>{monthName(date)}</span>
    </div>
  );
}

export function EventCard({ ev, compact }) {
  const { catById } = useStore();
  const cat = catById[ev.categoryId];
  const d = daysUntil(ev.date);
  return (
    <article className="event-card">
      <DateBadge date={ev.date} />
      <div className="event-main">
        <h3>{ev.title}</h3>
        <p className="muted small">
          {fmtTime(ev.time)} — {ev.mode === 'أونلاين' ? 'أونلاين' : ev.location || 'حضوري'}
          {cat ? ` — ${cat.name}` : ''}
        </p>
        {!compact && ev.description && <p>{ev.description}</p>}
        {d >= 0 && <span className="tag tag-live">{d === 0 ? 'اللقاء النهارده' : d === 1 ? 'بكرة' : `بعد ${num(d)} يوم`}</span>}
      </div>
      {ev.image && <Tilt className="event-thumb" max={12}><img src={ev.image} alt="" loading="lazy" /></Tilt>}
    </article>
  );
}

export function MoreLink({ to, children }) {
  return <Link to={to} className="more-link">{children}</Link>;
}
