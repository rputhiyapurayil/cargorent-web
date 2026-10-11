import { Link } from 'react-router-dom';
import VehicleImage from './VehicleImage';
import { money, title } from '../lib/format';

export default function VehicleCard({ vehicle: v, reason, query = '' }) {
  return (
    <Link to={`/vehicles/${v.id}${query}`} className="vehicle-card">
      <VehicleImage vehicle={v} />
      <div className="vehicle-card-body">
        <div className="vehicle-card-top">
          <div>
            <div className="vehicle-name">{v.brand} {v.model}</div>
            <div className="muted small">{title(v.type)} · {v.city}</div>
          </div>
          <div className="price">{money(v.pricePerDay)}<span>/day</span></div>
        </div>
        <div className="chips">
          {v.seats && <span className="chip">👤 {v.seats} seats</span>}
          {v.fuelType && <span className="chip">⛽ {v.fuelType}</span>}
          {v.transmission && <span className="chip">⚙️ {v.transmission}</span>}
        </div>
        {reason && <div className="reason">✨ {reason}</div>}
      </div>
    </Link>
  );
}
