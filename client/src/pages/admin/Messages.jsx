import { useState } from 'react';
import { Mail, MailOpen } from 'lucide-react';
import { EmptyState, ErrorState, Loading } from '../../components/ui/Feedback.jsx';
import { useAdminData, useAdminRequest } from '../../lib/adminApi.js';
import { formatDateTime } from '../../lib/format.js';

export default function Messages() {
  const [tab, setTab] = useState('messages');
  const messages = useAdminData('/messages');
  const subscribers = useAdminData('/subscribers');
  const request = useAdminRequest();

  async function toggleRead(m) {
    await request(`/messages/${m.id}`, { method: 'PATCH', body: { read: !m.read } }).catch(() => {});
    messages.reload();
  }

  function exportCsv() {
    const rows = [['email', 'name', 'subscribed_at'], ...subscribers.data.map((s) => [s.email, s.name || '', s.createdAt])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'newsletter-subscribers.csv' });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="admin-header">
        <h1>Messages & Subscribers</h1>
        <div className="filter-chips" role="tablist">
          <button type="button" role="tab" className="chip" aria-selected={tab === 'messages'} aria-pressed={tab === 'messages'} onClick={() => setTab('messages')}>Contact messages</button>
          <button type="button" role="tab" className="chip" aria-selected={tab === 'subscribers'} aria-pressed={tab === 'subscribers'} onClick={() => setTab('subscribers')}>Newsletter subscribers</button>
        </div>
      </div>

      {tab === 'messages' && (
        <div className="panel">
          {messages.loading && <Loading />}
          {messages.error && <ErrorState error={messages.error} onRetry={messages.reload} />}
          {messages.data?.length === 0 && <EmptyState icon={Mail} title="No messages yet" />}
          {messages.data?.map((m) => (
            <article key={m.id} className="panel-body" style={{ borderBottom: '1px solid var(--line)', background: m.read ? undefined : '#fffaf0' }}>
              <div className="flex justify-between wrap gap-1">
                <div>
                  <strong>{m.subject}</strong> {!m.read && <span className="badge badge-gold">New</span>}
                  <div className="small muted">{m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>{m.email}</a> · {formatDateTime(m.createdAt)}</div>
                </div>
                <div className="btn-row">
                  <a className="btn btn-outline btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>Reply</a>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleRead(m)}>
                    {m.read ? <Mail size={15} aria-hidden="true" /> : <MailOpen size={15} aria-hidden="true" />} Mark {m.read ? 'unread' : 'read'}
                  </button>
                </div>
              </div>
              <p className="mt-1 mb-0" style={{ whiteSpace: 'pre-wrap' }}>{m.message}</p>
            </article>
          ))}
        </div>
      )}

      {tab === 'subscribers' && (
        <div className="panel">
          <div className="panel-head">
            <span className="small muted">{subscribers.data?.length ?? 0} subscriber(s)</span>
            {subscribers.data?.length > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv}>Export CSV</button>}
          </div>
          {subscribers.loading && <Loading />}
          {subscribers.data?.length === 0 && <EmptyState title="No subscribers yet" />}
          {subscribers.data?.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Email</th><th>Subscribed</th></tr></thead>
                <tbody>{subscribers.data.map((s) => <tr key={s.id}><td>{s.email}</td><td>{formatDateTime(s.createdAt)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
