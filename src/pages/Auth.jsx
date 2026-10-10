import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';

export default function Auth() {
  const { user, loginUser, registerUser } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const registering = location.pathname === '/register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const from = location.state?.from || '/';

  if (user) return <Navigate to={from} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (registering && password !== confirm) { setError('كلمتا المرور غير متطابقتين.'); return; }
    setBusy(true);
    try {
      if (registering) {
        const result = await registerUser({ name, email, password });
        if (result.needsConfirmation) {
          setMessage('الحساب اتعمل، لكن تأكيد البريد الإلكتروني ما زال مفعّلًا. عطّله من إعدادات Supabase لتسجيل الدخول فور إنشاء الحساب.');
          return;
        }
      } else {
        await loginUser(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'تعذر إكمال العملية. حاول مرة أخرى.');
    } finally { setBusy(false); }
  };

  return (
    <section className="section">
      <div className="wrap login-wrap">
        <form className="form panel" onSubmit={submit}>
          <h2>{registering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
          {registering && <label>الاسم<input autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>}
          <label>البريد الإلكتروني<input type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>كلمة المرور<input type="password" dir="ltr" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {registering && <label>تأكيد كلمة المرور<input type="password" dir="ltr" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>}
          {error && <p className="error" role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
          <button className="btn btn-navy" type="submit" disabled={busy}>{busy ? 'جارٍ المعالجة...' : registering ? 'إنشاء الحساب' : 'دخول'}</button>
          <p className="auth-switch">
            {registering ? 'عندك حساب بالفعل؟' : 'لسه ما عندكش حساب؟'}{' '}
            <Link to={registering ? '/login' : '/register'} state={location.state}>{registering ? 'سجّل الدخول' : 'إنشاء حساب'}</Link>
          </p>
          <Link to="/" className="small muted">العودة للموقع</Link>
        </form>
      </div>
    </section>
  );
}