import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Free Esri tile layers, no API key needed: a Google-like street map and satellite imagery.
const LAYERS = {
  map: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
  },
  labels: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  },
};

export const MARKER_COLORS = { rent: '#16a34a', available: '#2563eb', inactive: '#9ca3af' };

/** Side-view car icon in the given colour; the selected one is larger with a pulse ring. */
function carIcon(color, selected) {
  const w = selected ? 44 : 36;
  const h = Math.round(w * 0.62);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 22" width="${w}" height="${h}">
      <path d="M3 15.5v-3.2c0-1 .6-1.8 1.6-2l3.8-.9 3.4-4.1c.6-.7 1.4-1.1 2.3-1.1h8c.9 0 1.7.4 2.3 1l3.9 4.2 2.6.6c1 .2 1.7 1.1 1.7 2.1v3.4c0 .8-.6 1.4-1.4 1.4H4.4c-.8 0-1.4-.6-1.4-1.4z"
            fill="${color}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M12.6 9.3l2.4-3h4.1v3zM20.6 9.3v-3h2.7c.4 0 .7.2 1 .4l2.4 2.6z" fill="#e0f2fe" opacity=".95"/>
      <circle cx="10" cy="17" r="3.2" fill="#1f2937" stroke="#fff" stroke-width="1.2"/>
      <circle cx="26.5" cy="17" r="3.2" fill="#1f2937" stroke="#fff" stroke-width="1.2"/>
    </svg>`;
  return L.divIcon({
    className: `car-marker${selected ? ' car-marker-selected' : ''}`,
    html: `${selected ? '<span class="car-pulse"></span>' : ''}${svg}`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
    popupAnchor: [0, -h / 2],
    tooltipAnchor: [0, -h / 2],
  });
}

/** Keeps the map sized to its box (fullscreen, layout changes) and moves to the selected vehicle. */
function MapController({ markers, trail, selectedId, follow, fitKey }) {
  const map = useMap();
  const fitted = useRef(null);

  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);

  // Fit everything once per fitKey (first load), not on every refresh, so the user's pan/zoom is kept.
  useEffect(() => {
    if (fitted.current === fitKey || !markers.length) return;
    fitted.current = fitKey;
    const pts = [...markers.map((m) => [m.lat, m.lng]), ...trail];
    if (pts.length === 1) map.setView(pts[0], 14);
    else map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
  }, [map, markers, trail, fitKey]);

  const selected = markers.find((m) => m.id === selectedId);

  useEffect(() => {
    if (selected && !follow) map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
  }, [map, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (follow && selected) map.panTo([selected.lat, selected.lng]);
  }, [map, follow, selected?.lat, selected?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function CarMarker({ marker, selected, onSelect, onClosePopup, autoOpenPopup }) {
  const ref = useRef(null);
  const icon = useMemo(() => carIcon(MARKER_COLORS[marker.kind] || MARKER_COLORS.available, selected),
    [marker.kind, selected]);

  // Open the popup when this vehicle becomes selected (e.g. clicked in the table).
  useEffect(() => {
    if (selected && autoOpenPopup && marker.popup) ref.current?.openPopup();
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Marker ref={ref} position={[marker.lat, marker.lng]} icon={icon}
            zIndexOffset={selected ? 1000 : marker.kind === 'rent' ? 500 : 0}
            eventHandlers={{ click: () => onSelect?.(marker.id), popupclose: () => onClosePopup?.(marker.id) }}>
      {marker.label && !selected && <Tooltip direction="top">{marker.label}</Tooltip>}
      {marker.popup && <Popup className="vehicle-popup" autoPanPadding={[24, 24]} minWidth={230}>{marker.popup}</Popup>}
    </Marker>
  );
}

/**
 * Tracking map in a Google-Maps-like style using free tiles (no API key).
 * markers: [{ id, lat, lng, kind: 'rent' | 'available' | 'inactive', label, popup }]
 * trail:   [[lat, lng], ...] route of the selected vehicle
 */
export default function LiveMap({ markers = [], trail = [], selectedId = null, onSelect, onClosePopup,
                                  follow = false, height = 420, fitKey = 'initial', autoOpenPopup = true }) {
  const [layer, setLayer] = useState('map');
  const center = markers[0] ? [markers[0].lat, markers[0].lng] : [10.0, 76.3];

  return (
    <div className="map-shell" style={{ height }}>
      <div className="map-type-toggle" role="group" aria-label="Map type">
        <button className={layer === 'map' ? 'active' : ''} onClick={() => setLayer('map')}>Map</button>
        <button className={layer === 'satellite' ? 'active' : ''} onClick={() => setLayer('satellite')}>Satellite</button>
      </div>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} className="map" scrollWheelZoom>
        {layer === 'map' ? (
          <TileLayer key="map" url={LAYERS.map.url} attribution={LAYERS.map.attribution} maxZoom={19} />
        ) : (
          <>
            <TileLayer key="sat" url={LAYERS.satellite.url} attribution={LAYERS.satellite.attribution} maxZoom={19} />
            <TileLayer key="labels" url={LAYERS.labels.url} maxZoom={19} />
          </>
        )}
        {trail.length > 1 && (
          <Polyline positions={trail} pathOptions={{ color: layer === 'map' ? '#2563eb' : '#facc15', weight: 4, opacity: 0.85 }} />
        )}
        {markers.map((m) => (
          <CarMarker key={m.id} marker={m} selected={m.id === selectedId} onSelect={onSelect} onClosePopup={onClosePopup}
                     autoOpenPopup={autoOpenPopup} />
        ))}
        <MapController markers={markers} trail={trail} selectedId={selectedId} follow={follow} fitKey={fitKey} />
      </MapContainer>
    </div>
  );
}

/** The label/value list shown inside a vehicle popup. rows: [[label, value], ...] (falsy rows skipped). */
export function PopupFields({ title, rows }) {
  return (
    <div className="popup-card">
      {title && <div className="popup-title">{title}</div>}
      <dl className="popup-fields">
        {rows.filter(Boolean).map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}
