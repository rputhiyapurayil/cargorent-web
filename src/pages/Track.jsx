import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import LiveMap, { PopupFields } from '../components/LiveMap';
import { Alert, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { date, dateTime } from '../lib/format';
import { EngineBadge, GpsStatus, useGpsFreshness } from '../lib/tracking';

export default function Track() {
  const { vehicleId } = useParams();
  const [params] = useSearchParams();
  const bookingId = params.get('booking');
  const vehicle = useApi(`/vehicles/${vehicleId}`);
  const booking = useApi(bookingId ? `/bookings/${bookingId}` : null);
  const [trail, setTrail] = useState([]);
  const [error, setError] = useState('');
  const [follow, setFollow] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = () => api(`/vehicles/${vehicleId}/locations`, { params: { limit: 60 } })
      .then((d) => { if (alive) { setTrail(d); setError(''); } })
      .catch((e) => alive && setError(e.message));
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [vehicleId]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === panelRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const last = trail[trail.length - 1];
  const v = vehicle.data;
  const b = booking.data;
  const name = v ? `${v.brand} ${v.model}` : 'Your vehicle';

  const freshnessInput = useMemo(() => (last ? [{ id: 'v', recordedAt: last.recordedAt }] : []), [last]);
  const isLive = useGpsFreshness(freshnessInput);
  const onRent = !b || b.status === 'PICKED_UP';

  const fields = last && [
    ['Reg. No', v?.registrationNumber || '—'],
    ['Time', dateTime(last.recordedAt)],
    ['GPS status', <GpsStatus key="g" onRent={onRent} live={isLive('v')} />],
    ['Speed', `${last.speedKmph} km/h`],
    ['Engine', <EngineBadge key="e" on={onRent && last.speedKmph > 0} />],
    b && ['Booking', `#${b.id}`],
    b && ['Return by', date(b.endDate)],
    ['Location', <a key="l" href={last.locationUrl} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>],
  ];

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else panelRef.current?.requestFullscreen?.();
  };

  return (
    <div className="container section">
      <Link to="/bookings" className="back">← My bookings</Link>
      <div className="page-header">
        <div>
          <h1>Live tracking · {name}</h1>
          <p className="muted"><span className="live-dot" /> Updates every 5 seconds (simulated GPS)</p>
        </div>
      </div>
      <Alert>{error}</Alert>
      {!last && !error && <Spinner label="Waiting for GPS…" />}
      {last && (
        <div className={`card tracking-panel ${fullscreen ? 'is-fullscreen' : ''}`} ref={panelRef}>
          <div className="tracking-toolbar">
            <label className="follow-toggle">
              <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow vehicle
            </label>
            <div className="toolbar-right">
              <button className="tool-btn" onClick={toggleFullscreen} title={fullscreen ? 'Exit full screen' : 'Full screen'}
                      aria-label="Toggle full screen">{fullscreen ? '🗗' : '⛶'}</button>
            </div>
          </div>
          <div className="tracking-grid tracking-grid-customer">
            <div className="track-details">
              <PopupFields title={name} rows={fields} />
            </div>
            <div className="tracking-map">
              <LiveMap follow={follow} height="100%" selectedId="v" autoOpenPopup={false}
                       trail={trail.map((p) => [p.latitude, p.longitude])}
                       markers={[{ id: 'v', lat: last.latitude, lng: last.longitude, kind: 'rent', label: name,
                                   popup: <PopupFields title={name} rows={fields} /> }]} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
