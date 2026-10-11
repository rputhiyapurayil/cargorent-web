import { Link } from 'react-router-dom';
import BarChart from '../../components/BarChart';
import { Alert, PageHeader, Spinner, Stat, StatusBadge } from '../../components/ui';
import { useApi } from '../../lib/useApi';
import { date, money } from '../../lib/format';

const shortMoney = (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${Math.round(v)}`);

export default function Dashboard() {
  const report = useApi('/reports/summary');
  const toApprove = useApi('/bookings', { params: { status: 'CONFIRMED' } });
  const onRent = useApi('/bookings', { params: { status: 'PICKED_UP' } });
  const r = report.data;

  return (
    <div className="container section">
      <PageHeader title="Dashboard" subtitle="Last 30 days at a glance." />
      {report.loading && <Spinner />}
      <Alert>{report.error?.message}</Alert>
      {r && (
        <>
          <div className="stats">
            <Stat label="Revenue (30 days)" value={money(r.totalRevenue)} hint={`${r.paidBookings} paid bookings`} />
            <Stat label="Bookings" value={r.totalBookings} hint={`${r.cancelledBookings} cancelled`} />
            <Stat label="On rent now" value={r.activeRentals} hint="vehicles picked up" />
            <Stat label="Avg. booking value" value={money(r.averageBookingValue)} hint={`${r.totalRentalDays} rental days`} />
          </div>
          <div className="card">
            <h3>Daily revenue</h3>
            <BarChart ariaLabel="Daily revenue for the last 30 days" format={shortMoney}
                      rows={r.revenueByDay.map((d) => ({ label: date(d.date), short: d.date.slice(8), value: d.revenue, sub: `${d.bookings} bookings` }))} />
          </div>
        </>
      )}

      <div className="grid grid-2 section">
        <div className="card">
          <div className="card-head"><h3>Waiting for approval</h3><Link to="/admin/bookings?status=CONFIRMED">View all</Link></div>
          {toApprove.data?.length === 0 && <p className="muted">Nothing to approve 🎉</p>}
          <MiniList rows={toApprove.data} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Currently on rent</h3><Link to="/admin/tracking">Track fleet</Link></div>
          {onRent.data?.length === 0 && <p className="muted">No vehicles out right now.</p>}
          <MiniList rows={onRent.data} />
        </div>
      </div>
    </div>
  );
}

function MiniList({ rows }) {
  if (!rows) return null;
  return (
    <ul className="mini-list">
      {rows.slice(0, 6).map((b) => (
        <li key={b.id}>
          <div><strong>{b.vehicleName}</strong><div className="muted small">#{b.id} · {b.customerName} · {date(b.startDate)} → {date(b.endDate)}</div></div>
          <StatusBadge status={b.status} />
        </li>
      ))}
    </ul>
  );
}
