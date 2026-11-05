import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Clock, HeartHandshake } from 'lucide-react';
import { Loading } from '../components/ui/Feedback.jsx';
import { usePolledSession } from './store/OrderConfirmation.jsx';
import { usePageMeta } from '../lib/hooks.js';
import { formatDateTime, money } from '../lib/format.js';

export default function DonationThankYou() {
  usePageMeta('Thank You for Your Gift', 'Thank you for supporting House of Love International Ministries.');
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { data: d, error, gaveUp } = usePolledSession(
    sessionId ? `/donations/session/${encodeURIComponent(sessionId)}` : null,
    (x) => x.paymentStatus !== 'pending',
  );

  if (!sessionId) {
    return (
      <section className="section"><div className="container card confirm-card">
        <div className="confirm-icon error"><AlertCircle size={44} aria-hidden="true" /></div>
        <h1 style={{ fontSize: '2.4rem' }}>No donation reference</h1>
        <Link to="/give" className="btn">Go to the giving page</Link>
      </div></section>
    );
  }
  if (!d && !error) return <section className="section"><Loading label="Confirming your gift…" /></section>;

  const completed = d && ['completed', 'review_required'].includes(d.paymentStatus);
  const received = completed || d?.stripePaymentStatus === 'paid';
  const failed = d && ['failed', 'expired'].includes(d.paymentStatus);

  let icon = <Clock size={44} aria-hidden="true" />;
  let cls = 'pending';
  let title = 'Confirming your gift…';
  let message = 'Please keep this page open while we confirm your payment with Stripe.';
  if (error) {
    icon = <AlertCircle size={44} aria-hidden="true" />; cls = 'error';
    title = 'We could not load your donation';
    message = `${error.message} If your payment went through, you will receive a receipt by email.`;
  } else if (completed) {
    icon = <HeartHandshake size={44} aria-hidden="true" />; cls = '';
    title = `Thank you${d.donorName ? `, ${d.donorName.split(' ')[0]}` : ''}!`;
    message = d.frequency === 'monthly'
      ? 'Your monthly partnership has begun. Your faithful generosity will make a lasting difference. A receipt has been emailed to you.'
      : 'Your generous gift has been received. A receipt has been emailed to you. May God bless you abundantly!';
  } else if (failed) {
    icon = <AlertCircle size={44} aria-hidden="true" />; cls = 'error';
    title = 'Your donation was not completed';
    message = 'You have not been charged. Please try again.';
  } else if (received || gaveUp) {
    title = 'Payment received – thank you!';
    message = 'We are finalising your donation record. Your receipt will arrive by email shortly.';
  }

  return (
    <section className="section bg-ivory">
      <div className="container">
        <div className="card confirm-card" aria-live="polite">
          <div className={`confirm-icon ${cls}`}>{icon}</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>{title}</h1>
          <p className="lead" style={{ marginInline: 'auto' }}>{message}</p>
          {d && (
            <div className="receipt">
              <div className="receipt-row receipt-total"><span>Donation amount</span><span>{money(d.amount, d.currency)}{d.frequency === 'monthly' ? ' / month' : ''}</span></div>
              <div className="receipt-row"><span>Frequency</span><span>{d.frequency === 'monthly' ? 'Monthly (recurring)' : 'One-time'}</span></div>
              <div className="receipt-row"><span>Designation</span><span>{d.fundLabel}</span></div>
              <div className="receipt-row"><span>Reference</span><strong>{d.reference}</strong></div>
              {d.transactionId && <div className="receipt-row"><span>Transaction ID</span><span>{d.transactionId}</span></div>}
              <div className="receipt-row"><span>Date</span><span>{formatDateTime(d.completedAt || d.createdAt)}</span></div>
              {d.anonymous && <div className="receipt-row"><span>Recognition</span><span>Anonymous gift</span></div>}
            </div>
          )}
          {completed && (
            <p className="scripture mt-3" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--wine-700)' }}>
              “Give, and it will be given to you.” – Luke 6:38
            </p>
          )}
          <div className="btn-row mt-3" style={{ justifyContent: 'center' }}>
            {failed ? <Link to="/give" className="btn">Try again</Link> : <Link to="/" className="btn">Back to home</Link>}
            <Link to="/events" className="btn btn-outline">Upcoming events</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
