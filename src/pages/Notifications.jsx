import { Link } from 'react-router-dom';
import { Alert, Empty, PageHeader, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { timeAgo } from '../lib/format';

const ICONS = {
  BOOKING_CONFIRMED: '✅', BOOKING_APPROVED: '👍', VEHICLE_PICKED_UP: '🚗', VEHICLE_RETURNED: '🏁',
  BOOKING_CANCELLED: '❌', PICKUP_REMINDER: '⏰', RETURN_REMINDER: '⏰',
};

export default function Notifications() {
  const { data, error, loading, setData } = useApi('/notifications/my');

  const markRead = async (n) => {
    if (n.read) return;
    await api(`/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {});
    setData(data.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
  };
  const markAll = async () => {
    await api('/notifications/my/read-all', { method: 'PATCH' });
    setData(data.map((x) => ({ ...x, read: true })));
  };

  return (
    <div className="container section narrow">
      <PageHeader title="Notifications" subtitle="Booking updates and pickup / return reminders."
                  actions={data?.some((n) => !n.read) && <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>} />
      {loading && <Spinner />}
      <Alert>{error?.message}</Alert>
      {data?.length === 0 && <Empty icon="🔔" title="You're all caught up">Updates about your bookings will appear here.</Empty>}
      <div className="stack">
        {data?.map((n) => (
          <div key={n.id} className={`card notification ${n.read ? '' : 'unread'}`} onClick={() => markRead(n)}>
            <div className="notification-icon">{ICONS[n.type] || '🔔'}</div>
            <div className="grow">
              <div className="notification-title">{n.title}</div>
              <div>{n.message}</div>
              <div className="muted small">{timeAgo(n.sentAt)}{n.bookingId && <> · <Link to="/bookings">Booking #{n.bookingId}</Link></>}</div>
            </div>
            {!n.read && <span className="unread-dot" aria-label="unread" />}
          </div>
        ))}
      </div>
    </div>
  );
}
