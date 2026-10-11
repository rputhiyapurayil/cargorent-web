import { useState } from 'react';
import { Link } from 'react-router-dom';
import BookingSteps from '../components/BookingSteps';
import { Alert, Empty, PageHeader, Spinner, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { date, dateTime, money } from '../lib/format';

const TABS = {
  upcoming: ['PENDING_PAYMENT', 'CONFIRMED', 'APPROVED', 'PICKED_UP'],
  past: ['RETURNED'],
  cancelled: ['CANCELLED'],
};

export default function MyBookings() {
  const { data, error, loading, reload } = useApi('/bookings/my');
  const [tab, setTab] = useState('upcoming');
  const [actionError, setActionError] = useState('');

  const cancel = async (b) => {
    if (!window.confirm(`Cancel booking #${b.id} for ${b.vehicleName}?`)) return;
    setActionError('');
    try {
      await api(`/bookings/${b.id}/cancel`, { method: 'PATCH', body: {} });
      reload();
    } catch (e) {
      setActionError(e.message);
    }
  };

  const list = data?.filter((b) => TABS[tab].includes(b.status)) || [];

  return (
    <div className="container section">
      <PageHeader title="My bookings" subtitle="Your rental history, payments and live tracking." />
      <div className="tabs">
        {Object.keys(TABS).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)} ({data?.filter((b) => TABS[t].includes(b.status)).length ?? 0})
          </button>
        ))}
      </div>
      {loading && <Spinner />}
      <Alert>{error?.message || actionError}</Alert>
      {!loading && list.length === 0 && (
        <Empty icon="🗓️" title="No bookings here">
          <Link to="/">Find a vehicle</Link> to start your next trip.
        </Empty>
      )}
      <div className="stack">
        {list.map((b) => (
          <div key={b.id} className="card booking-row">
            <div className="booking-row-main">
              <div className="booking-row-head">
                <div>
                  <div className="vehicle-name">{b.vehicleName}</div>
                  <div className="muted small">Booking #{b.id} · {b.registrationNumber} · {b.pickupCity}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="booking-dates">
                <div><span>Pickup</span><strong>{date(b.startDate)}</strong></div>
                <div className="arrow">→</div>
                <div><span>Return</span><strong>{date(b.endDate)}</strong></div>
                <div><span>Days</span><strong>{b.days}</strong></div>
                <div><span>Total</span><strong>{money(b.totalAmount)}</strong></div>
              </div>
              <BookingSteps status={b.status} />
              {b.status === 'CANCELLED' && <p className="muted small">Cancelled {dateTime(b.cancelledAt)} — {b.cancelReason}</p>}
              {b.status === 'PENDING_PAYMENT' && <p className="muted small">Complete payment within 30 minutes or the booking expires.</p>}
            </div>
            <div className="booking-row-actions">
              {b.status === 'PENDING_PAYMENT' && <Link className="btn btn-primary btn-sm" to={`/pay/${b.id}`}>Pay now</Link>}
              {b.status === 'PICKED_UP' && <Link className="btn btn-primary btn-sm" to={`/track/${b.vehicleId}?booking=${b.id}`}>📍 Track live</Link>}
              {b.paymentId && <Link className="btn btn-ghost btn-sm" to={`/receipt/${b.paymentId}`}>Receipt</Link>}
              {['PENDING_PAYMENT', 'CONFIRMED'].includes(b.status) && (
                <button className="btn btn-danger-ghost btn-sm" onClick={() => cancel(b)}>Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
