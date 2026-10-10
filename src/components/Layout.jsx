import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Modal } from './ui';
import { num } from '../lib/utils';

const links = [
  ['/', 'الرئيسية'],
  ['/books', 'الكتب'],
  ['/events', 'اللقاءات'],
  ['/quotes', 'المراجعات'],
  ['/join', 'انضم لنا'],
];

function AccountNotices() {
  const { data, user } = useStore();
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    if (!user) { setNotice(null); return; }
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(`bayn-alsotour:notices:${user.id}`) || '[]'); } catch { seen = []; }
    const unseen = data.quotes.filter((quote) => quote.userId === user.id && quote.status === 'approved' && !seen.includes(quote.id));
    if (unseen.length) setNotice(unseen);
  }, [data.quotes, user]);
  if (!notice?.length) return null;
  const close = () => {
    try {
      const key = `bayn-alsotour:notices:${user.id}`;
      const seen = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([...new Set([...seen, ...notice.map((quote) => quote.id)])]));
    } catch { /* Notifications can be shown again if storage is unavailable. */ }
    setNotice(null);
  };
  return (
    <Modal title="خبر حلو عن مشاركتك" onClose={close}>
      {notice.map((quote) => (
        <div className="notice-item" key={quote.id}>
          <span className="tag tag-live">{quote.type === 'review' ? 'مراجعة مقبولة' : 'اقتباس مقبول'}</span>
          <p>{quote.text}</p>
          <strong>كسبت {num(quote.pointsAwarded || 0)} نقطة</strong>
        </div>
      ))}
      <button className="btn btn-navy" onClick={close}>تمام</button>
    </Modal>
  );
}

export default function Layout() {
  const { data, content, user, isAdmin, userPoints, logout, logoutUser } = useStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);
  const { links: soc, clubName } = data.settings;

  return (
    <>
      <a className="skip" href="#main">تخطَّ إلى المحتوى</a>
      <header className="nav">
        <div className="wrap nav-in">
          <Link to="/" className="brand" aria-label={clubName}>
            {content.logo && <img src={content.logo} alt="" />}
            <span>{clubName}</span>
          </Link>
          <button className="burger" aria-expanded={open} aria-label="القائمة" onClick={() => setOpen(!open)}>
            <span /><span /><span />
          </button>
          <nav className={`nav-links ${open ? 'open' : ''}`}>
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
            ))}
            {user && <span className="nav-points">{user.name} · {num(userPoints)} نقطة</span>}
            {user || isAdmin ? <button className="nav-auth" onClick={async () => { if (user) await logoutUser(); else await logout(); navigate('/'); }}>تسجيل الخروج</button> : <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>دخول / حساب جديد</NavLink>}
          </nav>
        </div>
      </header>
      <AccountNotices />
      <main id="main"><Outlet /></main>
      <footer className="footer">
        <div className="wrap footer-in">
          <div>
            <div className="brand light">{content.heroCover && <img src={content.heroCover} alt="" />}<span>{clubName}</span></div>
            <p>{data.settings.about}</p>
          </div>
          <div>
            <h4>روابط سريعة</h4>
            {links.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
          </div>
          <div>
            <h4>تابعنا</h4>
            <a href={soc.facebook} target="_blank" rel="noreferrer">فيسبوك</a>
            <a href={soc.telegram} target="_blank" rel="noreferrer">تيليجرام</a>
            <a href={soc.whatsapp} target="_blank" rel="noreferrer">واتساب</a>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© {new Date().getFullYear().toLocaleString('ar-EG', { useGrouping: false })} {clubName}، من تأسيس طلاب كلية الحاسبات والمعلومات</span>
          <Link to="/admin">لوحة التحكم</Link>
        </div>
      </footer>
    </>
  );
}
