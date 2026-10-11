import { useState } from 'react';

const ICON = { BIKE: '🏍️', SCOOTER: '🛵', VAN: '🚐', MUV: '🚙', SUV: '🚙', SEDAN: '🚗', HATCHBACK: '🚗' };

/** Vehicle photo with a clean fallback when there is no image or the URL is broken. */
export default function VehicleImage({ vehicle, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!vehicle?.imageUrl || failed) {
    return (
      <div className={`vehicle-img vehicle-img-fallback ${className}`}>
        <span>{ICON[vehicle?.type] || '🚗'}</span>
      </div>
    );
  }
  return (
    <img className={`vehicle-img ${className}`} src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`}
         loading="lazy" onError={() => setFailed(true)} />
  );
}
