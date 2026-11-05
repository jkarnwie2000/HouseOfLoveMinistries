import { AlertCircle, CheckCircle2, Info, PackageOpen, RefreshCw } from 'lucide-react';

export function Alert({ type = 'info', children, title }) {
  const IconCmp = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <IconCmp size={20} aria-hidden="true" />
      <div>
        {title && <strong style={{ display: 'block', marginBottom: 2 }}>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-block" role="alert">
      <div className="state-icon"><AlertCircle size={28} aria-hidden="true" /></div>
      <div>
        <h3 style={{ marginBottom: 4 }}>Something went wrong</h3>
        <p className="muted mb-0">{error?.message || 'Please try again.'}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: IconCmp = PackageOpen, title, children, action }) {
  return (
    <div className="state-block">
      <div className="state-icon"><IconCmp size={28} aria-hidden="true" /></div>
      <div>
        <h3 style={{ marginBottom: 4 }}>{title}</h3>
        {children && <p className="muted mb-0">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function Placeholder({ children = 'Editable placeholder' }) {
  return <span className="placeholder-note">{children}</span>;
}

export function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <span className="field-error" id={id}>
      <AlertCircle size={14} aria-hidden="true" /> {message}
    </span>
  );
}

export function Spinner() {
  return <span className="spinner spinner-sm" aria-hidden="true" />;
}
