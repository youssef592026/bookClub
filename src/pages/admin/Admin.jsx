import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { num } from '../../lib/utils';

export function AdminLogin() {
  const { login, isAdmin, remote, session, adminChecked, logout } = useStore();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  if (isAdmin) return <Navigate to="/admin" replace />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    setErr(!(await (remote ? login(email, pw) : login(pw))));
    setBusy(false);
  };
  const notAdmin = remote && session && adminChecked && !isAdmin;
  return (
    <section className="section">
      <div className="wrap login-wrap">
        <form className="form panel" onSubmit={submit}>
          <h2>دخول الأدمن</h2>
          {remote && <label>البريد الإلكتروني<input type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>}
          <label>كلمة المرور<input type="password" autoComplete="current-password" autoFocus={!remote} required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          {err && <p className="error" role="alert">{remote ? 'البريد أو كلمة المرور غير صحيحين.' : 'كلمة المرور غير صحيحة.'}</p>}
          {notAdmin && <p className="error" role="alert">الحساب ده مسجّل دخول لكنه مش أدمن. ضيف الإيميل في جدول admins.{' '}<button type="button" className="link-btn" onClick={logout}>تسجيل خروج</button></p>}
          <button className="btn btn-navy" type="submit" disabled={busy}>{busy ? 'جارٍ الدخول...' : 'دخول'}</button>
          <Link to="/" className="small muted">العودة للموقع</Link>
        </form>
      </div>
    </section>
  );
}

const tabs = [
  ['/admin', 'نظرة عامة', true],
  ['/admin/content', 'المحتوى والصور'],
  ['/admin/books', 'الكتب'],
  ['/admin/categories', 'الفئات'],
  ['/admin/events', 'اللقاءات'],
  ['/admin/members', 'الأعضاء والنقاط'],
  ['/admin/users', 'حسابات المستخدمين'],
  ['/admin/quotes', 'الاقتباسات'],
  ['/admin/requests', 'طلبات الانضمام'],
  ['/admin/settings', 'الإعدادات'],
  ['/admin/data', 'النسخ الاحتياطي'],
];

export function AdminLayout() {
  const { isAdmin, data } = useStore();
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  const pending = data.quotes.filter((q) => q.status === 'pending').length;
  const reqs = data.requests.filter((r) => !r.handled).length;
  return (
    <section className="section admin">
      <div className="wrap admin-grid">
        <nav className="admin-nav" aria-label="لوحة التحكم">
          {tabs.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
              {to === '/admin/quotes' && pending > 0 && <b className="badge">{num(pending)}</b>}
              {to === '/admin/requests' && reqs > 0 && <b className="badge">{num(reqs)}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="admin-main"><Outlet /></div>
      </div>
    </section>
  );
}

export function Dashboard() {
  const { data, upcoming, leaderboard } = useStore();
  const pending = data.quotes.filter((q) => q.status === 'pending').length;
  const reqs = data.requests.filter((r) => !r.handled).length;
  const stats = [
    ['الكتب', data.books.length, '/admin/books'],
    ['الأعضاء', data.members.length, '/admin/members'],
    ['حسابات المستخدمين', data.userProfiles.length, '/admin/users'],
    ['لقاءات قادمة', upcoming.length, '/admin/events'],
    ['مشاركات بانتظار المراجعة', pending, '/admin/quotes'],
    ['طلبات انضمام جديدة', reqs, '/admin/requests'],
  ];
  return (
    <div>
      <div className="admin-bar"><h2>نظرة عامة</h2></div>
      <div className="stat-grid">
        {stats.map(([l, v, to]) => (
          <Link key={l} to={to} className="stat"><strong>{num(v)}</strong><span>{l}</span></Link>
        ))}
      </div>
      <div className="panel">
        <h3>الأعلى نقاطًا</h3>
        <ol className="board">
          {leaderboard.slice(0, 5).map((m, i) => (
            <li key={m.id}><span className="rank">{num(i + 1)}</span><span className="grow"><strong>{m.name}</strong></span><span className="pts">{num(m.points)} نقطة</span></li>
          ))}
        </ol>
      </div>
    </div>
  );
}
