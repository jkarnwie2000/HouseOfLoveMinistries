import { useState } from 'react';
import { HandCoins, Repeat, Heart, Hash } from 'lucide-react';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/ui/Feedback.jsx';
import { RequireAuth } from '../../context/AuthContext.jsx';
import { useAdminData, useAdminRequest } from '../../lib/adminApi.js';
import { formatDateTime, money, titleCase } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Stat } from './Dashboard.jsx';
import { PaymentBadge } from './Orders.jsx';

function DonationsInner() {
  const [status, setStatus] = useState('completed');
  const [frequency, setFrequency] = useState('all');
  const { data, loading, error, reload } = useAdminData(`/donations?status=${status}&frequency=${frequency}`);
  const request = useAdminRequest();
  const { notify } = useToast();
  const [actionError, setActionError] = useState('');

  async function cancel(d) {
    if (!window.confirm(`Cancel the monthly gift ${d.reference} from ${d.donorName}? Stripe will stop future charges.`)) return;
    try {
      await request(`/donations/${d.id}/cancel-subscription`, { method: 'POST' });
      notify('Monthly gift cancelled.');
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <>
      <div className="admin-header"><h1>Donations</h1></div>
      {data && (
        <div className="stat-grid">
          <Stat icon={HandCoins} label="Total (filtered)" value={money(data.totals.completedAmount)} />
          <Stat icon={Hash} label="Completed gifts" value={data.totals.completedCount} tone="gold" />
          <Stat icon={Heart} label="One-time" value={money(data.totals.oneTime)} />
          <Stat icon={Repeat} label="Monthly" value={money(data.totals.monthly)} tone="gold" />
        </div>
      )}
      {actionError && <div className="mb-2"><Alert type="error">{actionError}</Alert></div>}
      <div className="panel">
        <div className="panel-head">
          <div className="filters">
            <label className="visually-hidden" htmlFor="d-status">Status</label>
            <select id="d-status" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {['completed', 'pending', 'review_required', 'failed', 'expired'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
            <label className="visually-hidden" htmlFor="d-freq">Frequency</label>
            <select id="d-freq" className="select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="all">One-time & monthly</option>
              <option value="one-time">One-time</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        {loading && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data?.donations.length === 0 && <EmptyState title="No donations match these filters">Donations appear once Stripe confirms payment via webhook.</EmptyState>}
        {data?.donations.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Reference</th><th>Date</th><th>Donor</th><th>Designation</th><th>Frequency</th><th>Status</th><th className="num">Amount</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {data.donations.map((d) => (
                  <tr key={d.id}>
                    <td>{d.reference}<br /><span className="small muted">{d.stripePaymentIntentId || d.stripeSubscriptionId || ''}</span></td>
                    <td>{formatDateTime(d.completedAt || d.createdAt)}</td>
                    <td>{d.anonymous ? <em>Anonymous</em> : d.donorName}<br /><span className="small muted">{d.donorEmail}</span>{d.message && <><br /><span className="small">“{d.message}”</span></>}</td>
                    <td>{d.fundLabel}</td>
                    <td>
                      {d.frequency === 'monthly' ? <span className="badge badge-gold">{d.isRenewal ? 'Monthly renewal' : 'Monthly'}</span> : 'One-time'}
                      {d.subscriptionStatus && !d.isRenewal && <><br /><span className="small muted">Subscription: {titleCase(d.subscriptionStatus)}</span></>}
                    </td>
                    <td><PaymentBadge status={d.paymentStatus} /></td>
                    <td className="num">{money(d.amount, d.currency)}</td>
                    <td>
                      {d.stripeSubscriptionId && !d.isRenewal && ['active', 'past_due'].includes(d.subscriptionStatus) && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => cancel(d)}>Cancel monthly</button>
                      )}
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

export default function Donations() {
  return <RequireAuth role="admin"><DonationsInner /></RequireAuth>;
}
