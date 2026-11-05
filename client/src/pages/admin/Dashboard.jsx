import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, ClipboardList, DollarSign, HandCoins, Inbox, Package, Repeat } from 'lucide-react';
import { ErrorState, Loading } from '../../components/ui/Feedback.jsx';
import { useAdminData } from '../../lib/adminApi.js';
import { formatDateTime, money } from '../../lib/format.js';

export function Stat({ icon: I, label, value, tone }) {
  return (
    <div className="stat">
      <span className={`icon-circle ${tone || ''}`}><I size={22} aria-hidden="true" /></span>
      <div><div className="label">{label}</div><div className="value">{value}</div></div>
    </div>
  );
}

export default function Dashboard() {
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
    </>
  );
}
