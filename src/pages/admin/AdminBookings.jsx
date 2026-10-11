import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Empty, PageHeader, Spinner, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { date, money } from '../../lib/format';

const FILTERS = [['', 'All'], ['CONFIRMED', 'To approve'], ['APPROVED', 'Ready for pickup'], ['PICKED_UP', 'On rent'],
  ['PENDING_PAYMENT', 'Unpaid'], ['RETURNED', 'Returned'], ['CANCELLED', 'Cancelled']];

const ACTIONS = {
  CONFIRMED: [['approve', 'Approve', 'btn-primary']],
  APPROVED: [['pickup', 'Mark picked up', 'btn-primary']],
  PICKED_UP: [['return', 'Mark returned', 'btn-primary']],
};

export default function AdminBookings() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const [q, setQ] = useState('');
  const { data, error, loading, reload } = useApi('/bookings', { params: { status, q } });
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(null);

  const act = async (b, action) => {
    setBusy(b.id); setActionError('');
    try {
      await api(`/bookings/${b.id}/${action}`, { method: 'PATCH', body: action === 'cancel' ? { reason: 'Rejected by admin' } : undefined });
      await reload();
    } catch (e) {
      setActionError(`#${b.id}: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container section">
      <PageHeader title="Rental management" subtitle="Approve bookings, hand over and receive vehicles." />
      <div className="toolbar">
        <div className="tabs">
          {FILTERS.map(([s, label]) => (
            <button key={s} className={status === s ? 'active' : ''} onClick={() => setParams(s ? { status: s } : {})}>{label}</button>
          ))}
        </div>
        <input className="search" placeholder="Search customer, vehicle, reg. no…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Alert>{error?.message || actionError}</Alert>
      {loading && !data && <Spinner />}
      {data?.length === 0 && <Empty icon="📋" title="No bookings found" />}
      {data?.length > 0 && (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>#</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th className="num">Amount</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.customerName}<div className="muted small">{b.customerEmail}</div></td>
                  <td>{b.vehicleName}<div className="muted small">{b.registrationNumber}</div></td>
                  <td className="nowrap">{date(b.startDate)} → {date(b.endDate)}<div className="muted small">{b.days} days</div></td>
                  <td className="num">{money(b.totalAmount)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="actions">
                    {(ACTIONS[b.status] || []).map(([a, label, cls]) => (
                      <button key={a} className={`btn btn-sm ${cls}`} disabled={busy === b.id} onClick={() => act(b, a)}>{label}</button>
                    ))}
                    {['PENDING_PAYMENT', 'CONFIRMED', 'APPROVED'].includes(b.status) && (
                      <button className="btn btn-sm btn-danger-ghost" disabled={busy === b.id}
                              onClick={() => window.confirm(`Cancel booking #${b.id}?`) && act(b, 'cancel')}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
