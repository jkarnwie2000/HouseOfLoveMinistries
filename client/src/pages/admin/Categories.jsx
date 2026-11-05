import { useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import Field from '../../components/ui/Field.jsx';
import { Alert, ErrorState, Loading, Spinner } from '../../components/ui/Feedback.jsx';
import { useAdminData, useAdminRequest } from '../../lib/adminApi.js';
import { useToast } from '../../context/ToastContext.jsx';

const BLANK = { name: '', description: '', sortOrder: 99 };

export default function Categories() {
  const { data, loading, error, reload } = useAdminData('/categories');
  const request = useAdminRequest();
  const { notify } = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [values, setValues] = useState(BLANK);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const start = (c) => {
    setEditing(c ? c.id : 'new');
    setValues(c ? { name: c.name, description: c.description || '', sortOrder: c.sortOrder ?? 99 } : BLANK);
    setStatus({ state: 'idle', message: '' });
  };

  async function save(e) {
    e.preventDefault();
    if (values.name.trim().length < 2) { setStatus({ state: 'error', message: 'Please enter a category name.' }); return; }
    setStatus({ state: 'loading' });
    try {
      await request(editing === 'new' ? '/categories' : `/categories/${editing}`, { method: editing === 'new' ? 'POST' : 'PUT', body: { ...values, sortOrder: Number(values.sortOrder) } });
      notify('Category saved.');
      setEditing(null);
      reload();
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete the “${c.name}” category?`)) return;
    try {
      await request(`/categories/${c.id}`, { method: 'DELETE' });
      notify('Category deleted.');
      reload();
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1>Categories</h1>
        <button type="button" className="btn" onClick={() => start(null)}><Plus size={18} aria-hidden="true" /> Add category</button>
      </div>
      {status.state === 'error' && !editing && <div className="mb-2"><Alert type="error">{status.message}</Alert></div>}

      {editing && (
        <form className="panel" onSubmit={save} noValidate>
          <div className="panel-head"><h2>{editing === 'new' ? 'New category' : 'Edit category'}</h2></div>
          <div className="panel-body form-grid">
            {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
            <div className="form-row">
              <Field label="Name" required value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} maxLength={80} autoFocus />
              <Field label="Sort order" type="number" min={0} max={999} value={values.sortOrder} onChange={(e) => setValues((v) => ({ ...v, sortOrder: e.target.value }))} />
            </div>
            <Field label="Description" as="textarea" rows={3} value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} maxLength={500} />
            <div className="btn-row">
              <button className="btn" type="submit" disabled={status.state === 'loading'}>{status.state === 'loading' ? <Spinner /> : <Save size={16} aria-hidden="true" />} Save</button>
              <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}><X size={16} aria-hidden="true" /> Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="panel">
        {loading && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Description</th><th className="num">Products</th><th className="num">Order</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong><br /><span className="small muted">{c.id}</span></td>
                    <td className="small">{c.description}</td>
                    <td className="num">{c.productCount}</td>
                    <td className="num">{c.sortOrder}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => start(c)} aria-label={`Edit ${c.name}`}><Pencil size={15} aria-hidden="true" /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(c)} aria-label={`Delete ${c.name}`} disabled={c.productCount > 0} title={c.productCount > 0 ? 'Move or delete its products first' : undefined}><Trash2 size={15} aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
