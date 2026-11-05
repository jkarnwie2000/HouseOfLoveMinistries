import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { PageHero } from '../components/ui/Section.jsx';
import Field from '../components/ui/Field.jsx';
import { SocialIcon } from '../components/ui/Icon.jsx';
import { Alert, Placeholder, Spinner } from '../components/ui/Feedback.jsx';
import { api } from '../lib/api.js';
import { usePageMeta } from '../lib/hooks.js';
import { email, focusFirstError, minLen, required, validateFields } from '../lib/validation.js';
import { church, serviceSchedule, socialLinks } from '../data/site.js';

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

export default function Contact() {
  usePageMeta('Contact Us', 'Contact House of Love International Ministries – send us a message, find our service times, location and social media.');
  const [params] = useSearchParams();
  const [values, setValues] = useState({ ...EMPTY, subject: params.get('subject')?.slice(0, 150) || '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const errs = validateFields(values, {
      name: [minLen(2, 'Please enter your name.')],
      email: [required('Please enter your email address.'), email()],
      subject: [minLen(2, 'Please enter a subject.')],
      message: [minLen(10, 'Please write a message of at least 10 characters.')],
    });
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus({ state: 'error', message: 'Please correct the highlighted fields.' });
      return focusFirstError(form);
    }
    setStatus({ state: 'loading', message: '' });
    try {
      const res = await api('/contact', { method: 'POST', body: values });
      setStatus({ state: 'success', message: res.message });
      setValues(EMPTY);
    } catch (err) {
      setErrors(err.fieldErrors);
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <>
      <PageHero eyebrow="Contact" title="We would love to hear from you" crumbs={[{ label: 'Contact' }]}>
        Questions, prayer requests or planning your first visit? Send us a message and our team will respond.
      </PageHero>
      <div className="kente-band thin" aria-hidden="true" />

      <section className="section">
        <div className="container contact-grid">
          <div className="card form-card">
            <h2 style={{ fontSize: '2rem' }}>Send a message</h2>
            <p className="muted">Fields marked <span className="required">*</span> are required.</p>
            <form className="form-grid" onSubmit={onSubmit} noValidate aria-describedby="contact-status">
              <div id="contact-status" aria-live="polite">
                {status.state === 'success' && <Alert type="success" title="Message sent">{status.message}</Alert>}
                {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
              </div>
              <div className="form-row">
                <Field label="Name" required value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" maxLength={120} />
                <Field label="Email" type="email" required value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" maxLength={254} />
              </div>
              <Field label="Subject" required value={values.subject} onChange={set('subject')} error={errors.subject} maxLength={150} />
              <Field label="Message" as="textarea" required rows={6} value={values.message} onChange={set('message')} error={errors.message} maxLength={5000} hint={`${values.message.length}/5000`} />
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="contact-website">Leave this field empty</label>
                <input id="contact-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
              </div>
              <button type="submit" className="btn btn-lg" disabled={status.state === 'loading'}>
                {status.state === 'loading' ? <Spinner /> : <Send size={18} aria-hidden="true" />} Send message
              </button>
            </form>
          </div>

          <div className="contact-cards">
            {church.isPlaceholderContact && <Placeholder>Contact details are placeholders – update in src/data/site.js</Placeholder>}
            <div className="card contact-card">
              <span className="icon-circle"><MapPin size={22} aria-hidden="true" /></span>
              <div><h3>Visit us</h3><p>{church.addressLines.map((l) => <span key={l} style={{ display: 'block' }}>{l}</span>)}</p></div>
            </div>
            <div className="card contact-card">
              <span className="icon-circle"><Phone size={22} aria-hidden="true" /></span>
              <div><h3>Call us</h3><p><a href={`tel:${church.phone.replace(/[^\d+]/g, '')}`}>{church.phone}</a><br />{church.officeHours}</p></div>
            </div>
            <div className="card contact-card">
              <span className="icon-circle"><Mail size={22} aria-hidden="true" /></span>
              <div><h3>Email us</h3><p><a href={`mailto:${church.email}`}>{church.email}</a></p></div>
            </div>
            <div className="card card-body">
              <h3 className="flex items-center gap-1"><Clock size={20} aria-hidden="true" color="var(--gold-600)" /> Service schedule</h3>
              <ul className="schedule">
                {serviceSchedule.map((s) => (
                  <li key={s.day}><span><strong>{s.day}</strong> · {s.name}</span><span>{s.time}</span></li>
                ))}
              </ul>
            </div>
            <div className="card card-body" id="social">
              <h3>Follow us</h3>
              <div className="social-links" style={{ marginTop: 0 }}>
                {socialLinks.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (opens in a new tab)`} style={{ color: 'var(--wine-700)', borderColor: 'var(--line)' }}>
                    <SocialIcon id={s.id} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-tight bg-ivory" aria-labelledby="map-title">
        <div className="container">
          <h2 id="map-title" className="visually-hidden">Map</h2>
          <div className="map-placeholder">
            <div>
              <div className="map-pin"><MapPin size={28} aria-hidden="true" /></div>
              <h3>Church location map</h3>
              <p className="muted mb-0">Map placeholder – embed a Google Maps iframe here once the church address is confirmed.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
