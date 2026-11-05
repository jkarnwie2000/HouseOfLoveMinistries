import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, ClipboardList, DollarSign, HandCoins, Inbox, Mail, Package, Repeat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ErrorState, Loading } from '../../components/ui/Feedback.jsx';
import { useAdminData, useAdminRequest } from '../../lib/adminApi.js';
import { formatDateTime, money } from '../../lib/format.js';

export function Stat({ icon: I, label, value, tone }) {
  return (
    <div className="stat">
      <span className={`icon-circle ${tone || ''}`}><I size={22} aria-hidden="true" /></span>
      <div><div className="label">{label}</div><div className="value">{value}</div></div>
    </div>
  );
}

/** Lets an administrator confirm that receipts and confirmations can be delivered. */
function EmailCheck() {
  const request = useAdminRequest();
  const { user } = useAuth();
  const [to, setTo] = useState(user?.email || '');
  const [state, setState] = useState({ busy: false, result: null });

  const send = async (e) => {
    e.preventDefault();
    setState({ busy: true, result: null });
    try {
      const result = await request('/email/test', { method: 'POST', body: { to } });
      setState({ busy: false, result });
    } catch (err) {
      setState({ busy: false, result: { ok: false, error: err.message } });
    }
  };
  const r = state.result;

  return (
    <section className="panel" aria-labelledby="email-check-title">
      <div className="panel-head"><h2 id="email-check-title"><Mail size={20} aria-hidden="true" /> Email delivery check</h2></div>
      <form className="panel-body" onSubmit={send}>
        <p className="muted" style={{ marginTop: 0 }}>Send a test message to make sure donation receipts and order confirmations are being delivered.</p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label className="field" style={{ flex: '1 1 260px', margin: 0 }}>
            <span className="label">Send test email to</span>
            <input className="input" type="email" required value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send test email'}</button>
        </div>
        {r && (
          <div className={`alert ${r.ok ? 'alert-success' : 'alert-error'}`} role="status" style={{ marginTop: '1rem' }}>
            {r.ok
              ? <>Sent to <strong>{r.to}</strong> from <strong>{r.from}</strong>. If it hasn’t arrived within a few minutes, check the spam or junk folder.</>
              : <>{r.error}{r.from ? <><br />Sender address in use: {r.from}</> : null}</>}
          </div>
        )}
      </form>
    </section>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { data, loading, error, reload } = useAdminData('/stats');
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <div className="admin-header"><h1>Dashboard</h1></div>
      <div className="stat-grid">
        <Stat icon={DollarSign} label="Store revenue" value={money(data.orders.revenue)} />
        <Stat icon={ClipboardList} label="Paid orders" value={data.orders.paidCount} tone="gold" />
        <Stat icon={Package} label="To fulfil" value={data.orders.awaitingFulfillment} />
        {data.donations && <Stat icon={HandCoins} label="Total donations" value={money(data.donations.total)} tone="gold" />}
        {data.donations && <Stat icon={HandCoins} label="Donations this month" value={money(data.donations.thisMonth)} />}
        {data.donations && <Stat icon={Repeat} label="Active monthly donors" value={data.donations.activeMonthly} tone="gold" />}
        <Stat icon={CalendarDays} label="Upcoming events" value={data.events.upcoming} />
        <Stat icon={Inbox} label="Unread messages" value={data.messages.unread} tone="gold" />
      </div>

      <div className="admin-cols">
        <section className="panel" aria-labelledby="recent-title">
          <div className="panel-head"><h2 id="recent-title">Recent transactions</h2></div>
          {data.recentTransactions.length === 0 ? (
            <div className="panel-body muted">No completed transactions yet. Payments appear here after Stripe confirms them via webhook.</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Type</th><th>Reference</th><th>Name</th><th>Date</th><th className="num">Amount</th></tr></thead>
                <tbody>
                  {data.recentTransactions.map((t) => (
                    <tr key={`${t.kind}-${t.id}`}>
                      <td><span className={`badge ${t.kind === 'order' ? 'badge-wine' : 'badge-gold'}`}>{t.kind === 'order' ? 'Order' : 'Donation'}</span></td>
                      <td>{t.kind === 'order' ? <Link to={`/admin/orders/${t.id}`}>{t.reference}</Link> : t.reference}</td>
                      <td>{t.name}</td>
                      <td>{formatDateTime(t.date)}</td>
                      <td className="num">{money(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="stock-title">
          <div className="panel-head"><h2 id="stock-title">Low stock</h2><Link to="/admin/products" className="small">Manage</Link></div>
          <div className="panel-body">
            {data.products.lowStock.length === 0 ? <p className="muted mb-0">All active products are well stocked.</p> : (
              <ul className="info-list">
                {data.products.lowStock.map((p) => (
                  <li key={p.id}><AlertTriangle size={18} aria-hidden="true" color="#b7791f" /><div><Link to={`/admin/products/${p.id}`}>{p.name}</Link> – {p.inventory} left</div></li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
      {isAdmin && <EmailCheck />}
    </>
  );
}
