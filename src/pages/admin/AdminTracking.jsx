import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LiveMap, { MARKER_COLORS, PopupFields } from '../../components/LiveMap';
import { Alert, PageHeader, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { dateTime, shortTime, title } from '../../lib/format';
import { EngineBadge, GpsStatus, useGpsFreshness } from '../../lib/tracking';

const PAGE_SIZE = 10;
const FILTERS = [['all', 'All'], ['rent', 'On rent'], ['available', 'Available'], ['inactive', 'Maintenance / retired']];
const COLUMNS = [
  ['recordedAt', 'Last update'], ['registrationNumber', 'Reg. No'], ['name', 'Vehicle'], ['fleet', 'Fleet'],
  ['customer', 'Customer'], ['state', 'Status'],
];

export default function AdminTracking() {
  const [fleet, setFleet] = useState([]);
  const [vehicles, setVehicles] = useState({});   // id -> vehicle (for city)
  const [rentals, setRentals] = useState({});     // vehicleId -> booking that is picked up
  const [selected, setSelected] = useState(null);
  const [trail, setTrail] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: 'state', dir: 1 });
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [latest, onRent] = await Promise.all([
        api('/vehicles/locations/latest'),
        api('/bookings', { params: { status: 'PICKED_UP' } }),
      ]);
      setFleet(latest);
      setRentals(Object.fromEntries(onRent.map((b) => [b.vehicleId, b])));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    api('/vehicles', { params: { includeAll: true } })
      .then((list) => setVehicles(Object.fromEntries(list.map((v) => [v.id, v]))))
      .catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  // Route of the selected vehicle, refreshed with the fleet.
  useEffect(() => {
    if (!selected) { setTrail([]); return; }
    api(`/vehicles/${selected}/locations`, { params: { limit: 60 } })
      .then((d) => setTrail(d.map((p) => [p.latitude, p.longitude])))
      .catch(() => {});
  }, [selected, fleet]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === panelRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const freshnessInput = useMemo(() => fleet.map((f) => ({ id: f.vehicleId, recordedAt: f.location.recordedAt })), [fleet]);
  const isLive = useGpsFreshness(freshnessInput);

  const rows = useMemo(() => fleet.map((f) => {
    const booking = rentals[f.vehicleId];
    const kind = f.onRent ? 'rent' : f.status === 'AVAILABLE' ? 'available' : 'inactive';
    return {
      id: f.vehicleId, name: f.name, registrationNumber: f.registrationNumber, type: f.type, status: f.status,
      city: vehicles[f.vehicleId]?.city || '—', onRent: f.onRent, kind,
      fleet: `${title(f.type)} · ${vehicles[f.vehicleId]?.city || '—'}`,
      state: kind === 'rent' ? 0 : kind === 'available' ? 1 : 2,
      customer: booking?.customerName || '', bookingId: booking?.id,
      speed: f.location.speedKmph, recordedAt: f.location.recordedAt,
      lat: f.location.latitude, lng: f.location.longitude, locationUrl: f.location.locationUrl,
    };
  }), [fleet, rentals, vehicles]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => filter === 'all' || r.kind === filter)
      .filter((r) => !needle || `${r.registrationNumber} ${r.name} ${r.city} ${r.customer}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        const x = a[sort.key] ?? '';
        const y = b[sort.key] ?? '';
        return (x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name)) * sort.dir;
      });
  }, [rows, filter, q, sort]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const pageRows = visible.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  useEffect(() => setPage(0), [filter, q]);

  const select = (id) => setSelected((cur) => (cur === id ? null : id));

  const markers = rows.map((r) => ({
    id: r.id, lat: r.lat, lng: r.lng, kind: r.kind,
    label: `${r.registrationNumber} · ${r.name}`,
    popup: (
      <PopupFields title={r.name} rows={[
        ['Reg. No', r.registrationNumber],
        ['Time', dateTime(r.recordedAt)],
        ['Customer', r.customer || '—'],
        ['GPS status', <GpsStatus key="g" onRent={r.onRent} live={isLive(r.id)} />],
        ['Speed', `${r.onRent ? r.speed : 0} km/h`],
        ['Engine', <EngineBadge key="e" on={r.onRent && r.speed > 0} />],
        r.bookingId && ['Booking', `#${r.bookingId}`],
        ['Fleet', r.fleet],
        ['Location', <a key="l" href={r.locationUrl} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>],
      ]} />
    ),
  }));

  const exportCsv = () => {
    const cols = ['registrationNumber', 'name', 'type', 'city', 'status', 'onRent', 'customer', 'bookingId', 'speed', 'lat', 'lng', 'recordedAt'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...visible.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `cargorent-fleet-${new Date().toISOString().slice(0, 16).replace(':', '')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else panelRef.current?.requestFullscreen?.();
  };

  const onRentCount = rows.filter((r) => r.onRent).length;

  return (
    <div className="container container-wide section">
      <PageHeader title="Fleet tracking"
                  subtitle={<><span className="live-dot" /> {onRentCount} on rent · {rows.length} vehicles · refreshes every 5 s (simulated GPS)</>} />
      <Alert>{error}</Alert>

      <div className={`card tracking-panel ${fullscreen ? 'is-fullscreen' : ''}`} ref={panelRef}>
        <div className="tracking-toolbar">
          <div className="tabs tabs-sm">
            {FILTERS.map(([k, label]) => (
              <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>
                {label} ({k === 'all' ? rows.length : rows.filter((r) => r.kind === k).length})
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <input className="search" placeholder="Search reg. no, vehicle, customer…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="tool-btn" onClick={exportCsv} title="Export CSV" aria-label="Export CSV">⬇</button>
            <button className={`tool-btn ${refreshing ? 'spinning' : ''}`} onClick={load} title="Refresh" aria-label="Refresh">⟳</button>
            <button className="tool-btn" onClick={toggleFullscreen} title={fullscreen ? 'Exit full screen' : 'Full screen'}
                    aria-label="Toggle full screen">{fullscreen ? '🗗' : '⛶'}</button>
          </div>
        </div>

        <div className="tracking-grid">
          <div className="tracking-table">
            <div className="table-wrap">
              <table className="table table-compact">
                <thead>
                  <tr>
                    <th className="num">#</th>
                    {COLUMNS.map(([key, label]) => (
                      <th key={key} className="sortable" onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))}>
                        {label}{sort.key === key && (sort.dir === 1 ? ' ▲' : ' ▼')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => (
                    <tr key={r.id} className={`clickable ${selected === r.id ? 'selected' : ''}`} onClick={() => select(r.id)}>
                      <td className="num muted">{currentPage * PAGE_SIZE + i + 1}</td>
                      <td className="nowrap" title={dateTime(r.recordedAt)}>{shortTime(r.recordedAt)}</td>
                      <td className="mono nowrap">
                        <i className="dot" style={{ background: MARKER_COLORS[r.kind] }} />{r.registrationNumber}
                      </td>
                      <td className="nowrap">{r.name}</td>
                      <td>{r.fleet}</td>
                      <td className="nowrap">{r.customer || <span className="muted">—</span>}</td>
                      <td>{r.onRent ? <span className="badge badge-green">On rent</span> : <StatusBadge status={r.status} />}</td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr><td colSpan={COLUMNS.length + 1} className="muted center">No vehicles match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span className="muted small">
                {visible.length ? `${currentPage * PAGE_SIZE + 1} to ${Math.min(visible.length, (currentPage + 1) * PAGE_SIZE)} of ${visible.length}` : '0 of 0'}
              </span>
              <div>
                <button className="tool-btn" disabled={currentPage === 0} onClick={() => setPage(0)} aria-label="First page">«</button>
                <button className="tool-btn" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">‹</button>
                <span className="small">Page {currentPage + 1} of {pages}</span>
                <button className="tool-btn" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)} aria-label="Next page">›</button>
                <button className="tool-btn" disabled={currentPage >= pages - 1} onClick={() => setPage(pages - 1)} aria-label="Last page">»</button>
              </div>
            </div>
          </div>

          <div className="tracking-map">
            <LiveMap markers={markers} trail={trail} selectedId={selected} height="100%"
                     onSelect={(id) => setSelected(id)}
                     onClosePopup={(id) => setSelected((cur) => (cur === id ? null : cur))} />
            <div className="map-legend">
              <span><i style={{ background: MARKER_COLORS.rent }} />On rent</span>
              <span><i style={{ background: MARKER_COLORS.available }} />Available</span>
              <span><i style={{ background: MARKER_COLORS.inactive }} />Maintenance / retired</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
