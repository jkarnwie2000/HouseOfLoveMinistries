import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Loading } from '../../components/ui/Feedback.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { api } from '../../lib/api.js';
import { usePageMeta } from '../../lib/hooks.js';
import { formatDateTime, money } from '../../lib/format.js';

/**
 * Polls the server for the order. The order is only marked "paid" after Stripe's
 * signed webhook has been verified on the server – never by this page.
 */
export function usePolledSession(path, isDone, { maxAttempts = 15, interval = 2000 } = {}) {
  const [state, setState] = useState({ data: null, error: null, attempts: 0 });
  const timer = useRef(null);

  useEffect(() => {
    if (!path) return undefined;
    let cancelled = false;
    let attempts = 0;
    async function tick() {
      attempts += 1;
      try {
        const data = await api(path);
        if (cancelled) return;
        setState({ data, error: null, attempts });
        if (!isDone(data) && attempts < maxAttempts) timer.current = setTimeout(tick, interval);
      } catch (error) {
        if (!cancelled) setState({ data: null, error, attempts });
      }
    }
    tick();
    return () => { cancelled = true; clearTimeout(timer.current); };
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, gaveUp: state.attempts >= maxAttempts };
}

export default function OrderConfirmation() {
  usePageMeta('Order Confirmation', 'Your House of Love Store order confirmation.');
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { clearCart } = useCart();
  const cleared = useRef(false);
  const { data: order, error, gaveUp } = usePolledSession(
    sessionId ? `/checkout/session/${encodeURIComponent(sessionId)}` : null,
    (o) => o.paymentStatus !== 'pending',
  );

  const paid = order && ['paid', 'review_required'].includes(order.paymentStatus);
  const paymentReceived = paid || order?.stripePaymentStatus === 'paid';

  useEffect(() => {
    if (paymentReceived && !cleared.current) {
      cleared.current = true;
      clearCart();
    }
  }, [paymentReceived, clearCart]);

  if (!sessionId) {
    return (
      <section className="section"><div className="container card confirm-card">
        <div className="confirm-icon error"><AlertCircle size={44} aria-hidden="true" /></div>
        <h1 style={{ fontSize: '2.4rem' }}>No order reference</h1>
        <p>We could not find an order reference in this link.</p>
        <Link to="/store" className="btn">Return to the store</Link>
      </div></section>
    );
  }
  if (!order && !error) return <section className="section"><Loading label="Confirming your order…" /></section>;

  let icon = <Clock size={44} aria-hidden="true" />;
  let iconCls = 'pending';
  let title = 'Confirming your payment…';
  let message = 'Please keep this page open while we confirm your payment with Stripe. This usually takes a few seconds.';

  if (error) {
    icon = <AlertCircle size={44} aria-hidden="true" />; iconCls = 'error';
    title = 'We could not load your order';
    message = `${error.message} If you completed payment, you will receive a confirmation email shortly.`;
  } else if (paid) {
    icon = <CheckCircle2 size={44} aria-hidden="true" />; iconCls = '';
    title = 'Thank you for your order!';
    message = `Your payment was successful. A confirmation email is on its way to ${order.customerEmail}.`;
  } else if (order.paymentStatus === 'failed' || order.paymentStatus === 'expired') {
    icon = <AlertCircle size={44} aria-hidden="true" />; iconCls = 'error';
    title = order.paymentStatus === 'expired' ? 'Your checkout session expired' : 'Your payment did not go through';
    message = 'You have not been charged. Your cart items are still saved – please try again.';
  } else if (order.stripePaymentStatus === 'paid') {
    title = 'Payment received – finalising your order';
    message = gaveUp
      ? 'Your payment was received. Your order confirmation email will arrive shortly.'
      : 'Stripe has received your payment. We are finalising your order now…';
  } else if (gaveUp) {
    title = 'Your payment is processing';
    message = 'Some payment methods take longer to confirm. We will email you as soon as your payment is confirmed.';
  }

  return (
    <section className="section">
      <div className="container">
        <div className="card confirm-card" aria-live="polite">
          <div className={`confirm-icon ${iconCls}`}>{icon}</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>{title}</h1>
          <p className="lead" style={{ marginInline: 'auto' }}>{message}</p>

          {order && (
            <div className="receipt">
              <div className="receipt-row"><span>Order number</span><strong>{order.orderNumber}</strong></div>
              <div className="receipt-row"><span>Date</span><span>{formatDateTime(order.paidAt || order.createdAt)}</span></div>
              {order.items.map((i) => (
                <div className="receipt-row" key={`${i.productId}-${i.size}-${i.color}`}>
                  <span>{i.name}{i.size && ` · ${i.size}`}{i.color && ` · ${i.color}`} × {i.quantity}</span>
                  <span>{money(i.lineTotal, order.currency)}</span>
                </div>
              ))}
              <div className="receipt-row"><span>Subtotal</span><span>{money(order.subtotal, order.currency)}</span></div>
              <div className="receipt-row"><span>Shipping ({order.shippingLabel})</span><span>{order.shippingCost === 0 ? 'Free' : money(order.shippingCost, order.currency)}</span></div>
              <div className="receipt-row receipt-total"><span>Total</span><span>{money(order.total, order.currency)}</span></div>
              <div className="receipt-row">
                <span>Delivery</span>
                <span>{order.shippingAddress
                  ? `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`
                  : 'Pick up at church'}</span>
              </div>
            </div>
          )}

          <div className="btn-row mt-4" style={{ justifyContent: 'center' }}>
            {order && ['failed', 'expired'].includes(order.paymentStatus)
              ? <Link to="/cart" className="btn">Return to cart</Link>
              : <Link to="/store" className="btn">Continue shopping</Link>}
            <Link to="/" className="btn btn-outline">Back to home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
