import { useState } from 'react';
import BarChart, { BarTable } from '../../components/BarChart';
import { Alert, PageHeader, Spinner, Stat } from '../../components/ui';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { addDays, date, isoDate, money, title } from '../../lib/format';

const shortMoney = (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${Math.round(v)}`);

export default function Reports() {
  const [range, setRange] = useState({ from: addDays(isoDate(), -29), to: isoDate() });
  const { data: r, error, loading } = useApi('/reports/summary', { params: range });
  const [exportError, setExportError] = useState('');

  const exportCsv = async () => {
    setExportError('');
    try {
      const rows = await api('/bookings', { params: range });
      const cols = ['id', 'customerName', 'customerEmail', 'vehicleName', 'registrationNumber', 'startDate', 'endDate', 'days', 'totalAmount', 'status', 'createdAt'];
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [cols.join(','), ...rows.map((b) => cols.map((c) => esc(b[c])).join(','))].join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `cargorent-bookings-${range.from}-to-${range.to}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { setExportError(e.message); }
  };

  return (
    <div className="container section">
      <PageHeader title="Rental reports" subtitle="Bookings created in the selected period."
                  actions={<>
                    <label className="inline">From<input type="date" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
                    <label className="inline">To<input type="date" value={range.to} min={range.from} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
                    <button className="btn btn-ghost" onClick={exportCsv}>⬇ Export CSV</button>
                    <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Print</button>
                  </>} />
      <Alert>{error?.message || exportError}</Alert>
      {loading && !r && <Spinner />}
      {r && (
        <>
          <div className="stats">
            <Stat label="Revenue" value={money(r.totalRevenue)} hint={`${date(r.from)} – ${date(r.to)}`} />
            <Stat label="Paid bookings" value={r.paidBookings} hint={`of ${r.totalBookings} created`} />
            <Stat label="Completed rentals" value={r.completedRentals} hint={`${r.totalRentalDays} rental days`} />
            <Stat label="Cancelled" value={r.cancelledBookings} />
          </div>
          <div className="card">
            <h3>Revenue per day</h3>
            <BarChart ariaLabel="Revenue per day" format={shortMoney}
                      rows={r.revenueByDay.map((d) => ({ label: date(d.date), short: d.date.slice(8), value: d.revenue, sub: `${d.bookings} bookings` }))} />
          </div>
          <div className="grid grid-2 section">
            <div className="card">
              <h3>Top vehicles by revenue</h3>
              {r.topVehicles.length === 0 ? <p className="muted">No paid bookings in this period.</p> : (
                <BarTable rows={r.topVehicles} valueKey="revenue" format={money} columns={[
                  { key: 'vehicleName', label: 'Vehicle', render: (x) => <>{x.vehicleName}<div className="muted small">{x.registrationNumber}</div></> },
                  { key: 'bookings', label: 'Bookings', num: true },
                  { key: 'revenue', label: 'Revenue' },
                ]} />
              )}
            </div>
            <div className="card">
              <h3>Revenue by vehicle type</h3>
              {r.revenueByType.length === 0 ? <p className="muted">No paid bookings in this period.</p> : (
                <BarTable rows={r.revenueByType} valueKey="revenue" format={money} columns={[
                  { key: 'type', label: 'Type', render: (x) => title(x.type) },
                  { key: 'bookings', label: 'Bookings', num: true },
                  { key: 'revenue', label: 'Revenue' },
                ]} />
              )}
            </div>
          </div>
          <div className="card">
            <h3>Bookings by status</h3>
            <table className="table">
              <thead><tr>{Object.keys(r.statusCounts).map((s) => <th key={s} className="num">{title(s)}</th>)}</tr></thead>
              <tbody><tr>{Object.values(r.statusCounts).map((n, i) => <td key={i} className="num">{n}</td>)}</tr></tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
