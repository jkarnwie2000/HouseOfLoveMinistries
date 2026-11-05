import { useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../lib/api.js';
import { isEmail } from '../lib/validation.js';
import { Alert, FieldError, Spinner } from './ui/Feedback.jsx';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setStatus({ state: 'loading', message: '' });
    try {
      const res = await api('/newsletter', { method: 'POST', body: { email, website } });
      setStatus({ state: 'success', message: res.message });
      setEmail('');
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="newsletter-form">
        <label htmlFor="newsletter-email" className="visually-hidden">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          className="input"
          placeholder="Your email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'newsletter-err' : undefined}
        />
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="newsletter-website">Website</label>
          <input id="newsletter-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={status.state === 'loading'}>
          {status.state === 'loading' ? <Spinner /> : <Send size={17} aria-hidden="true" />} Subscribe
        </button>
      </div>
      <div className="mt-1"><FieldError id="newsletter-err" message={error} /></div>
      {status.state === 'success' && <div className="mt-2"><Alert type="success">{status.message}</Alert></div>}
      {status.state === 'error' && <div className="mt-2"><Alert type="error">{status.message}</Alert></div>}
    </form>
  );
}
