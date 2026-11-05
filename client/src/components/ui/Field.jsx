import { useId } from 'react';
import { FieldError } from './Feedback.jsx';

/** Accessible labelled form control with hint and error wiring. */
export default function Field({ label, error, hint, required, as = 'input', children, className = '', ...props }) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(' ') || undefined;
  const Control = as;
  const cls = as === 'textarea' ? 'textarea' : as === 'select' ? 'select' : 'input';

  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required" aria-hidden="true">*</span>}
      </label>
      <Control
        id={id}
        className={cls}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        {...props}
      >
        {children}
      </Control>
      {hint && <span className="hint" id={hintId}>{hint}</span>}
      <FieldError id={errId} message={error} />
    </div>
  );
}
