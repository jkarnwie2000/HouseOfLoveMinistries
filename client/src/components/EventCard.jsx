import { useState } from 'react';
import { CalendarPlus, Clock, MapPin, Repeat, Users } from 'lucide-react';
import { dateParts, downloadIcs, formatDate, timeRange } from '../lib/format.js';
import { api } from '../lib/api.js';
import { email, minLen, validateFields, focusFirstError } from '../lib/validation.js';
import Modal from './ui/Modal.jsx';
import Field from './ui/Field.jsx';
import { Alert, Spinner } from './ui/Feedback.jsx';

function RegisterForm({ event, onDone }) {
  const [values, setValues] = useState({ name: '', email: '', phone: '', attendees: 1, notes: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle' });
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = validateFields(values, {
      name: [minLen(2, 'Please enter your full name.')],
      email: [email()],
      attendees: [[(v) => Number(v) >= 1 && Number(v) <= 20, 'Choose between 1 and 20 attendees.']],
    });
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(e.currentTarget);
    setStatus({ state: 'loading' });
    try {
      const res = await api(`/events/${event.id}/register`, { method: 'POST', body: { ...values, attendees: Number(values.attendees) } });
      setStatus({ state: 'success', message: res.message });
      onDone?.();
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setStatus({ state: 'error', message: err.message });
    }
  }

  if (status.state === 'success') {
    return <Alert type="success" title="You’re registered!">{status.message}</Alert>;
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <p className="muted mb-0">{formatDate(event.startDate, { dateStyle: 'full' })} · {timeRange(event.startDate, event.endDate)}</p>
      {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
      <Field label="Full name" required value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" autoFocus />
      <Field label="Email" type="email" required value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" />
      <div className="form-row">
        <Field label="Phone (optional)" type="tel" value={values.phone} onChange={set('phone')} autoComplete="tel" />
        <Field label="Number attending" type="number" min={1} max={20} required value={values.attendees} onChange={set('attendees')} error={errors.attendees} />
      </div>
      <Field label="Notes (optional)" as="textarea" rows={3} value={values.notes} onChange={set('notes')} style={{ minHeight: 90 }} />
      <button className="btn btn-block" type="submit" disabled={status.state === 'loading'}>
        {status.state === 'loading' && <Spinner />} Complete registration
      </button>
    </form>
  );
}

export default function EventCard({ event, onRegistered }) {
  const [open, setOpen] = useState(false);
  const { month, day, weekday } = dateParts(event.startDate);
  const full = event.spotsLeft === 0;

  return (
    <article className="card event-card" id={event.id}>
      <div className="event-date" aria-hidden="true">
        <div className="month">{month}</div>
        <div className="day">{day}</div>
        <div className="weekday">{weekday}</div>
      </div>
      <div className="event-body">
        {event.category && <span className="badge badge-wine" style={{ alignSelf: 'flex-start', marginBottom: 8 }}>{event.category}</span>}
        <h3>{event.title}</h3>
        <ul className="event-meta">
          <li><Clock size={15} aria-hidden="true" /> <time dateTime={event.startDate}>{formatDate(event.startDate, { weekday: 'long', month: 'long', day: 'numeric' })}</time>, {timeRange(event.startDate, event.endDate)}</li>
          <li><MapPin size={15} aria-hidden="true" /> {event.location}</li>
          {event.recurrence && <li><Repeat size={15} aria-hidden="true" /> {event.recurrence}</li>}
          {event.capacity && <li><Users size={15} aria-hidden="true" /> {full ? 'Fully booked' : `${event.spotsLeft} of ${event.capacity} places left`}</li>}
        </ul>
        <p>{event.description}</p>
        <div className="event-actions">
          {event.registrationRequired && (
            <button type="button" className="btn btn-sm" onClick={() => setOpen(true)} disabled={full}>
              {full ? 'Fully booked' : 'Register'}
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadIcs(event)}>
            <CalendarPlus size={16} aria-hidden="true" /> Add to calendar
          </button>
        </div>
      </div>
      {open && (
        <Modal title={`Register: ${event.title}`} onClose={() => setOpen(false)}>
          <RegisterForm event={event} onDone={onRegistered} />
        </Modal>
      )}
    </article>
  );
}
