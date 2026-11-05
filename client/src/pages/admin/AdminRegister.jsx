import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CheckCircle2, UserPlus } from 'lucide-react';
import Logo from '../../components/ui/Logo.jsx';
import Field from '../../components/ui/Field.jsx';
import { Alert, Loading, Spinner } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { usePageMeta } from '../../lib/hooks.js';
import '../../styles/admin.css';

const EMPTY = { name: '', email: '', note: '', password: '', confirm: '', website: '' };

function validate(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Please enter a valid email address.';
  if (v.password.length < 10) errors.password = 'Use at least 10 characters.';
  if (v.confirm !== v.password) errors.confirm = 'The passwords do not match.';
  return errors;
}

/** Public staff sign-up. New accounts stay pending until an administrator approves them. */
export default function AdminRegister() {
  usePageMeta('Create a Staff Account');
  const { user, checking } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  if (checking) return <div className="login-page"><Loading /></div>;
  if (user) return <Navigate to="/admin" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus({ state: 'error', message: 'Please correct the highlighted fields.' });
      return;
    }
    setStatus({ state: 'loading', message: '' });
    try {
      const { confirm, ...body } = values;
      const res = await api('/auth/register', { method: 'POST', body });
      setStatus({ state: 'done', message: res.message });
      setValues(EMPTY);
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <div className="login-page">
      <main className="card login-card">
        <Logo />
        <h1 style={{ fontSize: '2rem', textAlign: 'center' }}>Create a staff account</h1>

        {status.state === 'done' ? (
          <div className="text-center">
            <CheckCircle2 size={44} aria-hidden="true" style={{ color: 'var(--success)', marginBottom: '0.75rem' }} />
            <Alert type="success">{status.message}</Alert>
            <p className="mt-3 mb-0"><Link className="btn btn-block" to="/admin/login">Go to staff sign in</Link></p>
          </div>
        ) : (
          <>
            <p className="muted text-center">For ministry staff and volunteers. An administrator must approve your account before you can sign in.</p>
            <form className="form-grid" onSubmit={onSubmit} noValidate>
              {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
              <Field label="Full name" required autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} autoFocus />
              <Field label="Email" type="email" required autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} />
              <Field label="Your role or ministry" value={values.note} onChange={set('note')} error={errors.note} maxLength={300} hint="Optional – helps the administrator recognise you (e.g. “Youth ministry leader”)." />
              <Field label="Password" type="password" required autoComplete="new-password" value={values.password} onChange={set('password')} error={errors.password} hint="At least 10 characters." />
              <Field label="Confirm password" type="password" required autoComplete="new-password" value={values.confirm} onChange={set('confirm')} error={errors.confirm} />
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="register-website">Leave this field empty</label>
                <input id="register-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
              </div>
              <button className="btn btn-lg btn-block" type="submit" disabled={status.state === 'loading'}>
                {status.state === 'loading' ? <Spinner /> : <UserPlus size={18} aria-hidden="true" />} Request account
              </button>
            </form>
            <p className="text-center small mt-3 mb-0">Already have an account? <Link to="/admin/login">Sign in</Link></p>
          </>
        )}
        <p className="text-center small mt-3 mb-0"><Link to="/">← Back to website</Link></p>
      </main>
    </div>
  );
}
