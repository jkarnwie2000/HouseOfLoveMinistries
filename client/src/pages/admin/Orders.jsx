import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Field from '../../components/ui/Field.jsx';
import { Alert, EmptyState, ErrorState, Loading, Spinner } from '../../components/ui/Feedback.jsx';
import { useAdminData, useAdminRequest } from '../../lib/adminApi.js';
import { formatDateTime, money, titleCase } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';

const FULFILLMENT = ['unfulfilled', 'processing', 'shipped', 'ready_for_pickup', 'delivered', 'canceled'];
const PAYMENT = ['paid', 'pending', 'review_required', 'failed', 'expired'];

export function PaymentBadge({ status }) {
  const cls = { paid: 'badge-success', completed: 'badge-success', pending: 'badge-warning', review_required: 'badge-error', failed: 'badge-error', expired: '' }[status] ?? '';
  return <span className={`badge ${cls}`}>{titleCase(status)}</span>;
}

export function FulfillmentBadge({ status }) {
  const cls = { delivered: 'badge-success', shipped: 'badge-gold', ready_for_pickup: 'badge-gold', processing: 'badge-wine', canceled: 'badge-error' }[status] ?? '';
  return <span className={`badge ${cls}`}>{titleCase(status)}</span>;
}

export default function Orders() {
  const [payment, setPayment] = useState('paid');
  const [fulfillment, setFulfillment] = useState('all');
  const { data, loading, error, reload } = useAdminData(`/orders?paymentStatus=${payment}&fulfillmentStatus=${fulfillment}`);

  return (
    <>
      <div className="admin-header"><h1>Orders</h1></div>
      <div className="panel">
        <div className="panel-head">
          <div className="filters">
            <label className="visually-hidden" htmlFor="f-pay">Payment status</label>
            <select id="f-pay" className="select" value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option value="all">All payment statuses</option>
              {PAYMENT.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
            <label className="visually-hidden" htmlFor="f-ful">Fulfillment status</label>
            <select id="f-ful" className="select" value={fulfillment} onChange={(e) => setFulfillment(e.target.value)}>
              <option value="all">All fulfillment statuses</option>
              {FULFILLMENT.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </div>
          <span className="small muted">{data?.length ?? 0} order(s)</span>
        </div>
        {loading && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data?.length === 0 && <EmptyState title="No orders match these filters">Paid orders appear here once Stripe confirms payment.</EmptyState>}
        {data?.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Fulfillment</th><th className="num">Total</th></tr></thead>
              <tbody>
                {data.map((o) => (
                  <tr key={o.id}>
                    <td><Link to={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td>{o.customerName}<br /><span className="small muted">{o.customerEmail}</span></td>
                    <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                    <td><PaymentBadge status={o.paymentStatus} /></td>
                    <td><FulfillmentBadge status={o.fulfillmentStatus} /></td>
                    <td className="num">{money(o.total, o.currency)}</td>
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

export function OrderDetail() {
  const { id } = useParams();
  const { data: order, loading, error, reload } = useAdminData(`/orders/${id}`);
  const request = useAdminRequest();
  const { notify } = useToast();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const f = form || { fulfillmentStatus: order.fulfillmentStatus, trackingNumber: order.trackingNumber || '', internalNote: order.internalNote || '' };
  const canFulfil = ['paid', 'review_required'].includes(order.paymentStatus);

  async function save(e) {
    e.preventDefault();
    setStatus({ state: 'loading' });
    try {
      await request(`/orders/${order.id}/fulfillment`, { method: 'PATCH', body: f });
      notify('Order updated.');
      setForm(null);
      setStatus({ state: 'idle' });
      reload();
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  const a = order.shippingAddress;
  return (
    <>
      <div className="admin-header">
        <div>
          <Link to="/admin/orders" className="link-arrow small"><ArrowLeft size={16} aria-hidden="true" /> Orders</Link>
          <h1>Order {order.orderNumber}</h1>
        </div>
        <div className="flex gap-1"><PaymentBadge status={order.paymentStatus} /><FulfillmentBadge status={order.fulfillmentStatus} /></div>
      </div>
      {order.paymentStatus === 'review_required' && (
        <div className="mb-2"><Alert type="error" title="Review required">The amount Stripe reported ({money(order.amountReceived ?? 0)}) did not match the order total. Check this payment in the Stripe Dashboard before fulfilling.</Alert></div>
      )}
      <div className="admin-cols">
        <div>
          <section className="panel">
            <div className="panel-head"><h2>Items</h2></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Product</th><th>Options</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={`${i.productId}-${i.size}-${i.color}`}>
                      <td>{i.name}</td><td>{[i.size && `Size ${i.size}`, i.color].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="num">{i.quantity}</td><td className="num">{money(i.unitPrice, order.currency)}</td><td className="num">{money(i.lineTotal, order.currency)}</td>
                    </tr>
                  ))}
                  <tr><td colSpan={4} className="num">Subtotal</td><td className="num">{money(order.subtotal, order.currency)}</td></tr>
                  <tr><td colSpan={4} className="num">Shipping ({order.shippingLabel})</td><td className="num">{money(order.shippingCost, order.currency)}</td></tr>
                  <tr><td colSpan={4} className="num"><strong>Total</strong></td><td className="num"><strong>{money(order.total, order.currency)}</strong></td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Fulfillment</h2></div>
            <form className="panel-body form-grid" onSubmit={save}>
              {!canFulfil && <Alert type="info">This order has not been paid, so it cannot be fulfilled.</Alert>}
              {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
              <div className="form-row">
                <Field label="Status" as="select" value={f.fulfillmentStatus} disabled={!canFulfil} onChange={(e) => setForm({ ...f, fulfillmentStatus: e.target.value })}>
                  {FULFILLMENT.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </Field>
                <Field label="Tracking number" value={f.trackingNumber} disabled={!canFulfil} onChange={(e) => setForm({ ...f, trackingNumber: e.target.value })} maxLength={100} />
              </div>
              <Field label="Internal note" as="textarea" rows={3} value={f.internalNote} disabled={!canFulfil} onChange={(e) => setForm({ ...f, internalNote: e.target.value })} maxLength={1000} hint="Visible to staff only. Customers are emailed when an order is shipped, ready for pickup or delivered." />
              <button className="btn" type="submit" disabled={!canFulfil || !form || status.state === 'loading'} style={{ justifySelf: 'start' }}>
                {status.state === 'loading' ? <Spinner /> : <Save size={16} aria-hidden="true" />} Update order
              </button>
              {order.fulfillmentHistory?.length > 0 && (
                <ul className="small muted" style={{ margin: 0 }}>
                  {order.fulfillmentHistory.map((h) => <li key={h.at}>{formatDateTime(h.at)} – {titleCase(h.status)} by {h.by}</li>)}
                </ul>
              )}
            </form>
          </section>
        </div>

        <div>
          <section className="panel">
            <div className="panel-head"><h2>Customer</h2></div>
            <div className="panel-body">
              <dl className="dl">
                <dt>Name</dt><dd>{order.customerName}</dd>
                <dt>Email</dt><dd><a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></dd>
                {order.customerPhone && (<><dt>Phone</dt><dd>{order.customerPhone}</dd></>)}
                <dt>Delivery</dt>
                <dd>{a ? <>{a.line1}{a.line2 && <>, {a.line2}</>}<br />{a.city}, {a.state} {a.postalCode}<br />{a.country}</> : 'Pick up at church'}</dd>
              </dl>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><h2>Payment</h2></div>
            <div className="panel-body">
              <dl className="dl">
                <dt>Placed</dt><dd>{formatDateTime(order.createdAt)}</dd>
                {order.paidAt && (<><dt>Paid</dt><dd>{formatDateTime(order.paidAt)}</dd></>)}
                <dt>Session</dt><dd className="small">{order.stripeSessionId || '—'}</dd>
                <dt>Payment ID</dt><dd className="small">{order.stripePaymentIntentId || '—'}</dd>
                {order.lastPaymentError && (<><dt>Last error</dt><dd>{order.lastPaymentError}</dd></>)}
              </dl>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
