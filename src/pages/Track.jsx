import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LiveMap from '../components/LiveMap';
import { Alert, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { dateTime } from '../lib/format';

export default function Track() {
  const { vehicleId } = useParams();
  const vehicle = useApi(`/vehicles/${vehicleId}`);
  const [trail, setTrail] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () => api(`/vehicles/${vehicleId}/locations`, { params: { limit: 60 } })
      .then((d) => { if (alive) { setTrail(d); setError(''); } })
      .catch((e) => alive && setError(e.message));
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [vehicleId]);

  const last = trail[trail.length - 1];
  const v = vehicle.data;

  return (
    <div className="container section">
      <Link to="/bookings" className="back">← My bookings</Link>
      <div className="page-header">
        <div>
          <h1>Live tracking {v && `· ${v.brand} ${v.model}`}</h1>
          <p className="muted"><span className="live-dot" /> Updates every 5 seconds (simulated GPS)</p>
        </div>
      </div>
      <Alert>{error}</Alert>
      {!last && !error && <Spinner label="Waiting for GPS…" />}
      {last && (
        <div className="track-layout">
          <LiveMap follow height={480}
                   trail={trail.map((p) => [p.latitude, p.longitude])}
                   markers={[{ id: 'v', lat: last.latitude, lng: last.longitude, label: v ? `${v.brand} ${v.model}` : 'Vehicle' }]} />
          <div className="card track-info">
            <div><span>Speed</span><strong>{last.speedKmph} km/h</strong></div>
            <div><span>Latitude</span><strong>{last.latitude.toFixed(5)}</strong></div>
            <div><span>Longitude</span><strong>{last.longitude.toFixed(5)}</strong></div>
            <div><span>Last update</span><strong>{dateTime(last.recordedAt)}</strong></div>
            <a className="btn btn-ghost btn-block" href={last.locationUrl} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>
          </div>
        </div>
      )}
    </div>
  );
}
