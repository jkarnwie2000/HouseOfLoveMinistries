import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback((message, { type = 'success', link, duration = 4500 } = {}) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, message, type, link }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            {t.type === 'error' ? <AlertCircle size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" color="#E8D29A" />}
            <div>
              <div>{t.message}</div>
              {t.link && <Link to={t.link.to} onClick={() => dismiss(t.id)}>{t.link.label}</Link>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"><X size={16} aria-hidden="true" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
