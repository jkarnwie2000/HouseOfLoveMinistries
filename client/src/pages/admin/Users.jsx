import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Field from '../../components/ui/Field.jsx';
import { Alert, ErrorState, Loading, Spinner } from '../../components/ui/Feedback.jsx';
import { RequireAuth, useAuth } from '../../context/AuthContext.jsx';
import { useAdminData, useAdminRequest } from '../../lib/adminApi.js';
import { formatDateTime } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';

function UsersInner() {
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useAdminData('/users');
  const request = useAdminRequest();
  const { notify } = useToast();
  const [v, setV] = useState({ name: '', email: '', role: 'editor', password: '' });
  const [status, setStatus] = useState({ state: 'idle' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function create(e) {
    e.preventDefault();
    setStatus({ state: 'loading' });
    try {
      await request('/users', { method: 'POST', body: v });
      notify(`Account created for ${v.email}.`);
      setV({ name: '', email: '', role: 'editor', password: '' });
      setErrors({});
      setStatus({ state: 'idle' });
      reload();
    } catch (err) {
      setErrors(err.fieldErrors);
      setStatus({ state: 'error', message: err.message });
    }
  }

  async function toggle(u) {
    try {
      await request(`/users/${u.id}`, { method: 'PATCH', body: { active: !u.active } });
      reload();
    } catch (err) {
      notify(err.message, { type: 'error' });
    }
  }

  return (
    <>
      <div className="admin-header"><h1>Staff accounts</h1></div>
      <div className="admin-cols">
        <div className="panel">
          {loading && <Loading />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {data && (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Name</th><th>Role</th><th>Last sign-in</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                <tbody>
                  {data.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong><br /><span className="small muted">{u.email}</span></td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-wine' : ''}`}>{u.role}</span></td>
                      <td>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}</td>
                      <td><span className={`badge ${u.active ? 'badge-success' : 'badge-error'}`}>{u.active ? 'Active' : 'Disabled'}</span></td>
                      <td>{u.id !== me.id && <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(u)}>{u.active ? 'Disable' : 'Enable'}</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <form className="panel" onSubmit={create} noValidate>
          <div className="panel-head"><h2>Add staff member</h2></div>
          <div className="panel-body form-grid">
            {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
            <Field label="Name" required value={v.name} onChange={set('name')} error={errors.name} />
            <Field label="Email" type="email" required value={v.email} onChange={set('email')} error={errors.email} autoComplete="off" />
            <Field label="Role" as="select" value={v.role} onChange={set('role')} hint="Editors manage products, events and orders. Only admins can view donations and staff accounts.">
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </Field>
            <Field label="Temporary password" type="password" required value={v.password} onChange={set('password')} error={errors.password} autoComplete="new-password" hint="At least 10 characters. Share it securely." />
            <button className="btn" type="submit" disabled={status.state === 'loading'}>{status.state === 'loading' ? <Spinner /> : <UserPlus size={16} aria-hidden="true" />} Create account</button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function Users() {
  return <RequireAuth role="admin"><UsersInner /></RequireAuth>;
}
