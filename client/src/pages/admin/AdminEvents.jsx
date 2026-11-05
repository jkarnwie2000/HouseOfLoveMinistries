import { useState } from 'react';
import { ImagePlus, Pencil, Plus, Save, Trash2, Users } from 'lucide-react';
import Field from '../../components/ui/Field.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Alert, EmptyState, ErrorState, Loading, Spinner } from '../../components/ui/Feedback.jsx';
import { useAdminData, useAdminRequest } from '../../lib/adminApi.js';
import { formatDateTime } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';

// <input type="datetime-local"> works in local time; the API stores ISO (UTC).
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : '');

const BLANK = {
  title: '', description: '', category: '', startDate: '', endDate: '', recurrence: '', location: '',
  image: '', registrationRequired: false, capacity: '', published: true,
};

function EventForm({ initial, onSaved, onCancel }) {
  const request = useAdminRequest();
  const [v, setV] = useState(initial ? { ...BLANK, ...initial, startDate: toLocalInput(initial.startDate), endDate: toLocalInput(initial.endDate), capacity: initial.capacity ?? '' } : BLANK);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle' });
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await request('/uploads', { method: 'POST', formData: fd });
      setV((s) => ({ ...s, image: res.url }));
    } catch (err) {
      setErrors((er) => ({ ...er, image: err.message }));
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const errs = {};
    if (v.title.trim().length < 2) errs.title = 'Enter an event name.';
    if (!v.description.trim()) errs.description = 'Enter a description.';
    if (!v.startDate) errs.startDate = 'Choose a start date and time.';
    if (v.endDate && v.startDate && new Date(v.endDate) < new Date(v.startDate)) errs.endDate = 'End must be after the start.';
    if (!v.location.trim()) errs.location = 'Enter a location.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus({ state: 'loading' });
    const body = { ...v, startDate: fromLocalInput(v.startDate), endDate: fromLocalInput(v.endDate) || null, capacity: v.capacity === '' ? null : Number(v.capacity) };
    delete body.id; delete body.createdAt; delete body.updatedAt; delete body.registrations;
    try {
      await request(initial ? `/events/${initial.id}` : '/events', { method: initial ? 'PUT' : 'POST', body });
      onSaved();
    } catch (err) {
      setErrors(err.fieldErrors);
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
      <Field label="Event name" required value={v.title} onChange={set('title')} error={errors.title} maxLength={150} />
      <Field label="Description" as="textarea" required rows={4} value={v.description} onChange={set('description')} error={errors.description} maxLength={3000} />
      <div className="form-row">
        <Field label="Starts" type="datetime-local" required value={v.startDate} onChange={set('startDate')} error={errors.startDate} />
        <Field label="Ends" type="datetime-local" value={v.endDate} onChange={set('endDate')} error={errors.endDate} />
      </div>
      <div className="form-row">
        <Field label="Category" value={v.category} onChange={set('category')} hint="e.g. Worship, Outreach, Youth & Family" maxLength={60} />
        <Field label="Repeats" value={v.recurrence} onChange={set('recurrence')} hint="e.g. “Every Sunday” – weekly events roll forward automatically" maxLength={80} />
      </div>
      <Field label="Location" required value={v.location} onChange={set('location')} error={errors.location} maxLength={200} />
      <div className="form-row">
        <Field label="Capacity (optional)" type="number" min={1} value={v.capacity} onChange={set('capacity')} />
        <div className="field">
          <span className="label">Image</span>
          <label className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }}>
            {uploading ? <Spinner /> : <ImagePlus size={15} aria-hidden="true" />} {v.image ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="visually-hidden" onChange={upload} />
          </label>
          {v.image && <span className="small muted">{v.image}</span>}
          {errors.image && <span className="field-error">{errors.image}</span>}
        </div>
      </div>
      <div className="toggle-row">
        <label className="checkbox"><input type="checkbox" checked={v.registrationRequired} onChange={set('registrationRequired')} /> Requires registration</label>
        <label className="checkbox"><input type="checkbox" checked={v.published} onChange={set('published')} /> Published</label>
      </div>
      <div className="btn-row">
        <button className="btn" type="submit" disabled={status.state === 'loading' || uploading}>{status.state === 'loading' ? <Spinner /> : <Save size={16} aria-hidden="true" />} Save event</button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function Registrations({ event }) {
  const { data, loading, error } = useAdminData(`/events/${event.id}/registrations`);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!data.length) return <p className="muted">No registrations yet.</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th className="num">Attendees</th><th>Registered</th></tr></thead>
        <tbody>{data.map((r) => <tr key={r.id}><td>{r.name}</td><td><a href={`mailto:${r.email}`}>{r.email}</a></td><td className="num">{r.attendees}</td><td>{formatDateTime(r.createdAt)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export default function AdminEvents() {
  const { data, loading, error, reload } = useAdminData('/events');
  const request = useAdminRequest();
  const { notify } = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | event
  const [viewing, setViewing] = useState(null);

  async function remove(e) {
    if (!window.confirm(`Delete “${e.title}”?`)) return;
    try {
      await request(`/events/${e.id}`, { method: 'DELETE' });
      notify('Event deleted.');
      reload();
    } catch (err) {
      notify(err.message, { type: 'error' });
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1>Events</h1>
        <button type="button" className="btn" onClick={() => setEditing('new')}><Plus size={18} aria-hidden="true" /> Add event</button>
      </div>
      <div className="panel">
        {loading && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data?.length === 0 && <EmptyState title="No events yet" />}
        {data?.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Event</th><th>Starts</th><th>Location</th><th>Status</th><th className="num">Registered</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {data.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.title}</strong>{e.recurrence && <><br /><span className="small muted">{e.recurrence}</span></>}</td>
                    <td>{formatDateTime(e.startDate)}</td>
                    <td className="small">{e.location}</td>
                    <td><span className={`badge ${e.published ? 'badge-success' : ''}`}>{e.published ? 'Published' : 'Hidden'}</span></td>
                    <td className="num">{e.registrationRequired ? `${e.registrations}${e.capacity ? ` / ${e.capacity}` : ''}` : '—'}</td>
                    <td>
                      <div className="row-actions">
                        {e.registrationRequired && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewing(e)} aria-label={`View registrations for ${e.title}`}><Users size={15} aria-hidden="true" /></button>}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(e)} aria-label={`Edit ${e.title}`}><Pencil size={15} aria-hidden="true" /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(e)} aria-label={`Delete ${e.title}`}><Trash2 size={15} aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && (
        <Modal title={editing === 'new' ? 'Add event' : 'Edit event'} onClose={() => setEditing(null)} width={720}>
          <EventForm initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); notify('Event saved.'); reload(); }} />
        </Modal>
      )}
      {viewing && (
        <Modal title={`Registrations – ${viewing.title}`} onClose={() => setViewing(null)} width={760}>
          <Registrations event={viewing} />
        </Modal>
      )}
    </>
  );
}
