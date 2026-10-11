import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function FitTo({ points, follow }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (follow) map.panTo(points[points.length - 1]);
    else if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
  }, [map, follow, JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * OpenStreetMap view. `markers`: [{ id, lat, lng, label, color, popup }], `trail`: [[lat, lng], ...].
 * Uses circle markers so no marker image assets are needed.
 */
export default function LiveMap({ markers = [], trail = [], follow = false, height = 420 }) {
  const points = markers.map((m) => [m.lat, m.lng]);
  const center = points[0] || [10.0, 76.3];
  return (
    <MapContainer center={center} zoom={12} style={{ height, width: '100%' }} className="map" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {trail.length > 1 && <Polyline positions={trail} pathOptions={{ color: '#4f46e5', weight: 4, opacity: 0.7 }} />}
      {markers.map((m) => (
        <CircleMarker key={m.id} center={[m.lat, m.lng]} radius={10}
                      pathOptions={{ color: '#fff', weight: 3, fillColor: m.color || '#4f46e5', fillOpacity: 1 }}>
          {m.label && <Tooltip direction="top" offset={[0, -10]}>{m.label}</Tooltip>}
          {m.popup && <Popup>{m.popup}</Popup>}
        </CircleMarker>
      ))}
      <FitTo points={follow ? points : [...points, ...trail]} follow={follow} />
    </MapContainer>
  );
}
