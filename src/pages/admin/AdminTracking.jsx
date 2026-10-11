import { useEffect, useState } from 'react';
import LiveMap from '../../components/LiveMap';
import { Alert, PageHeader, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { dateTime, title } from '../../lib/format';

export default function AdminTracking() {
  const [fleet, setFleet] = useState([]);
  const [selected, setSelected] = useState(null);
  const [trail, setTrail] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () => api('/vehicles/locations/latest').then((d) => alive && setFleet(d)).catch((e) => alive && setError(e.message));
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!selected) { setTrail([]); return; }
    api(`/vehicles/${selected}/locations`, { params: { limit: 60 } }).then((d) => setTrail(d.map((p) => [p.latitude, p.longitude]))).catch(() => {});
  }, [selected, fleet]);

  const onRent = fleet.filter((f) => f.onRent).length;
  // Draw vehicles on rent last so their markers sit on top.
  const markers = [...fleet].sort((a, b) => a.onRent - b.onRent).map((f) => ({
    id: f.vehicleId, lat: f.location.latitude, lng: f.location.longitude,
    color: f.onRent ? '#16a34a' : f.status === 'AVAILABLE' ? '#4f46e5' : '#9ca3af',
    label: `${f.name} · ${f.registrationNumber}`,
  }));

  return (
    <div className="container section">
      <PageHeader title="Fleet tracking" subtitle={<><span className="live-dot" /> {onRent} on rent · {fleet.length} vehicles · refreshes every 5 s (simulated GPS)</>} />
      <Alert>{error}</Alert>
      <div className="track-layout">
        <div>
          <LiveMap markers={markers} trail={trail} height={540} />
          <div className="map-legend">
            <span><i style={{ background: '#16a34a' }} />On rent</span>
            <span><i style={{ background: '#4f46e5' }} />Available</span>
            <span><i style={{ background: '#9ca3af' }} />Maintenance / retired</span>
          </div>
        </div>
        <div className="card fleet-list">
          {fleet.map((f) => (
            <button key={f.vehicleId} className={`fleet-item ${selected === f.vehicleId ? 'active' : ''}`}
                    onClick={() => setSelected(selected === f.vehicleId ? null : f.vehicleId)}>
              <div>
                <strong>{f.name}</strong>
                <div className="muted small">{f.registrationNumber} · {title(f.type)}</div>
                <div className="muted small">{f.location.speedKmph > 0 ? `${f.location.speedKmph} km/h · ` : ''}{dateTime(f.location.recordedAt)}</div>
              </div>
              {f.onRent ? <span className="badge badge-green">On rent</span> : <StatusBadge status={f.status} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
