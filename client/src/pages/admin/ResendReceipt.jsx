import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import Field from '../../components/ui/Field.jsx';
import { Alert, Spinner } from '../../components/ui/Feedback.jsx';
import { useAdminRequest } from '../../lib/adminApi.js';
import { formatDateTime } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * "Resend receipt" button + dialog for a paid order or completed donation.
 * Staff can send to the address on file or to a corrected address; every resend is recorded.
 */
export default function ResendReceipt({ kind, record, onSent, compact = false }) {
  const request = useAdminRequest();
  const { notify } = useToast();
  const onFile = kind === 'order' ? record.customerEmail : record.donorEmail;
  const ref = kind === 'order' ? record.orderNumber : record.reference;
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(onFile);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const history = record.receiptResends || [];

  const close = () => { setOpen(false); setStatus({ state: 'idle', message: '' }); setTo(onFile); };

  async function send(e) {
    e.preventDefault();
    setStatus({ state: 'loading', message: '' });
    try {
      const path = kind === 'order' ? `/orders/${record.id}/resend-receipt` : `/donations/${record.id}/resend-receipt`;
      const res = await request(path, { method: 'POST', body: { to: to.trim() } });
      notify(`Receipt ${ref} sent to ${res.to}.`);
      close();
      onSent?.();
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <>
      <button type="button" className={`btn btn-ghost ${compact ? 'btn-sm' : ''}`} onClick={() => setOpen(true)}>
        <Mail size={16} aria-hidden="true" /> Resend receipt
      </button>
      {open && (
        <Modal title={`Resend receipt ${ref}`} onClose={close} width={520}>
          <form className="form-grid" onSubmit={send} noValidate>
            {status.state === 'error' && <Alert type="error">{status.message}</Alert>}
            <p className="muted" style={{ margin: 0 }}>
              Sends the same {kind === 'order' ? 'order confirmation' : 'donation receipt'} again. If the person typed their email
              wrongly, enter the correct address below. Ask them to check their spam or junk folder too.
            </p>
            <Field
              label="Send to" type="email" required autoFocus value={to}
              onChange={(e) => setTo(e.target.value)}
              hint={to.trim().toLowerCase() === onFile.toLowerCase() ? 'The address entered at checkout.' : `On file: ${onFile}`}
            />
            {history.length > 0 && (
              <div className="small muted">
                <strong>Previously resent:</strong>
                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem' }}>
                  {history.slice(-5).reverse().map((h) => <li key={h.at}>{formatDateTime(h.at)} to {h.to} by {h.by}</li>)}
                </ul>
              </div>
            )}
            <div className="flex gap-1">
              <button className="btn" type="submit" disabled={status.state === 'loading'}>
                {status.state === 'loading' ? <Spinner /> : <Send size={16} aria-hidden="true" />} Send receipt
              </button>
              <button className="btn btn-ghost" type="button" onClick={close}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
