import { useEffect } from 'react';
import { title } from '../lib/format';

export function Spinner({ label = 'Loading…' }) {
  return <div className="spinner-wrap"><span className="spinner" /> {label}</div>;
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null;
  return <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function Empty({ icon = '🚗', title: t, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{t}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

const STATUS_TONE = {
  PENDING_PAYMENT: 'amber', CONFIRMED: 'blue', APPROVED: 'indigo', PICKED_UP: 'green', RETURNED: 'gray',
  CANCELLED: 'red', SUCCESS: 'green', FAILED: 'red', REFUNDED: 'amber',
  AVAILABLE: 'green', MAINTENANCE: 'amber', RETIRED: 'gray', CUSTOMER: 'blue', ADMIN: 'indigo',
};
const STATUS_LABEL = { PICKED_UP: 'On rent', PENDING_PAYMENT: 'Awaiting payment' };

export function StatusBadge({ status }) {
  return <span className={`badge badge-${STATUS_TONE[status] || 'gray'}`}>{STATUS_LABEL[status] || title(status)}</span>;
}

export function Modal({ title: t, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={t}>
        <div className="modal-head">
          <h2>{t}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, hint, tone }) {
  return (
    <div className={`stat ${tone ? 'stat-' + tone : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function PageHeader({ title: t, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{t}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
