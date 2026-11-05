import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Logo from '../../components/ui/Logo.jsx';
import Field from '../../components/ui/Field.jsx';
import { Alert, Loading, Spinner } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePageMeta } from '../../lib/hooks.js';
import '../../styles/admin.css';

// Pages only administrators may open; anyone else goes to the Dashboard after signing in.
const ADMIN_ONLY = ['/admin/users', '/admin/donations'];
const destinationFor = (from, role) =>
  !from || (role !== 'admin' && ADMIN_ONLY.some((p) => from.startsWith(p))) ? '/admin' : from;

export default function AdminLogin() {
  usePageMeta('Staff Sign In');
  const { user, checking, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  if (checking) return <div className="login-page"><Loading /></div>;
  if (user) return <Navigate to={destinationFor(location.state?.from, user.role)} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (!values.email || !values.password) {
      setStatus({ state: 'error', message: 'Please enter your email and password.' });
      return;
    }
    setStatus({ state: 'loading', message: '' });
    try {
      const signedIn = await login(values.email, values.password);
      navigate(destinationFor(location.state?.from, signedIn.role), { replace: true });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <div className="login-page">
      <main className="card login-card">
        <Logo />
        <h1 style={{ fontSize: '2rem', textAlign: 'center' }}>Staff sign in</h1>
        <p className="muted text-center">Authorised ministry staff only.</p>
        <form className="form-grid" onSubmit={onSubmit} noValidate>
          {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
          <Field label="Email" type="email" autoComplete="username" required value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} autoFocus />
          <Field label="Password" type="password" autoComplete="current-password" required value={values.password} onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))} />
          <button className="btn btn-lg btn-block" type="submit" disabled={status.state === 'loading'}>
            {status.state === 'loading' ? <Spinner /> : <Lock size={18} aria-hidden="true" />} Sign in
          </button>
        </form>
        <p className="text-center small mt-3 mb-0">New staff member? <Link to="/admin/register">Create a staff account</Link></p>
        <p className="text-center small mt-3 mb-0"><Link to="/">← Back to website</Link></p>
      </main>
    </div>
  );
}
