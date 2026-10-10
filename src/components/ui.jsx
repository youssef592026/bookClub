import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { COLORS } from '../lib/utils';

export function Stripes() {
  return <span className="stripes" aria-hidden="true"><i /><i /><i /></span>;
}

export function SectionHead({ title, children, action }) {
  return (
    <div className="section-head">
      <div>
        <Stripes />
        <h2>{title}</h2>
        {children && <p className="muted">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef();
  const toast = useCallback((text) => {
    setMsg(text); clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-zone" aria-live="polite">{msg && <div className="toast">{msg}</div>}</div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export function Cover({ book, category, size = 'md' }) {
  const c = COLORS[category?.color] || COLORS.navy;
  if (book.coverUrl) return <div className={`cover cover-${size}`}><img src={book.coverUrl} alt={`غلاف ${book.title}`} loading="lazy" /></div>;
  return (
    <div className={`cover cover-${size}`} style={{ background: c.bg, color: c.fg }} aria-hidden="true">
      <span className="cover-lines" />
      <strong>{book.title}</strong>
      <small>{book.author}</small>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

/** إمالة ثلاثية الأبعاد تتبع الماوس (بتشتغل بس على الأجهزة اللي فيها ماوس) */
export function Tilt({ children, className = '', max = 9 }) {
  const ref = useRef(null);
  const move = (e) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
    ref.current.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
  };
  const reset = () => { ref.current?.style.setProperty('--ry', '0deg'); ref.current?.style.setProperty('--rx', '0deg'); };
  return <div ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={reset}>{children}</div>;
}

/** ظهور ثلاثي الأبعاد عند التمرير */
export function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${on ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

export function Avatar({ member, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.45 };
  if (member?.photo) return <img className="avatar" style={style} src={member.photo} alt="" loading="lazy" />;
  return <span className="avatar avatar-i" style={style} aria-hidden="true">{(member?.name || '?').trim().charAt(0)}</span>;
}
