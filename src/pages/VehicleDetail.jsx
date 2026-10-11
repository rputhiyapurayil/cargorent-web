import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import VehicleImage from '../components/VehicleImage';
import { Alert, Spinner, StatusBadge } from '../components/ui';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { addDays, isoDate, money, title } from '../lib/format';

export default function VehicleDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const today = isoDate();
  const [from, setFrom] = useState(params.get('from') || today);
  const [to, setTo] = useState(params.get('to') || addDays(today, 1));
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { data: v, error: loadError, loading } = useApi(`/vehicles/${id}`);

  useEffect(() => {
    if (!from || !to || to <= from) { setQuote(null); setQuoteError('Return date must be after pickup date'); return; }
    setQuoteError('');
    api('/bookings/quote', { params: { vehicleId: id, from, to } })
      .then(setQuote)
      .catch((e) => { setQuote(null); setQuoteError(e.message); });
  }, [id, from, to]);

  const book = async () => {
    if (!user) { navigate('/login', { state: { from: `/vehicles/${id}?from=${from}&to=${to}` } }); return; }
    setBusy(true); setError('');
    try {
      const booking = await api('/bookings', { method: 'POST', body: { vehicleId: Number(id), startDate: from, endDate: to, notes } });
      navigate(`/pay/${booking.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="container section"><Spinner /></div>;
  if (loadError) return <div className="container section"><Alert>{loadError.message}</Alert></div>;

  return (
    <div className="container section">
      <Link to="/" className="back">← Back to vehicles</Link>
      <div className="detail">
        <div>
          <VehicleImage vehicle={v} className="detail-img" />
          <div className="card detail-info">
            <div className="detail-title">
              <div>
                <h1>{v.brand} {v.model}</h1>
                <p className="muted">{title(v.type)} · {v.year} · {v.city} · {v.registrationNumber}</p>
              </div>
              <StatusBadge status={v.status} />
            </div>
            <p>{v.description}</p>
            <div className="specs">
              <div><span>Seats</span><strong>{v.seats}</strong></div>
              <div><span>Fuel</span><strong>{v.fuelType}</strong></div>
              <div><span>Transmission</span><strong>{v.transmission}</strong></div>
              <div><span>Pickup city</span><strong>{v.city}</strong></div>
            </div>
          </div>
        </div>

        <aside className="card booking-box">
          <div className="price big">{money(v.pricePerDay)}<span>/day</span></div>
          <div className="form-row">
            <label>Pickup<input type="date" min={today} value={from}
                                onChange={(e) => { setFrom(e.target.value); if (to <= e.target.value) setTo(addDays(e.target.value, 1)); }} /></label>
            <label>Return<input type="date" min={addDays(from, 1)} value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
          <label>Notes (optional)
            <textarea rows="2" maxLength="500" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pickup time, child seat…" />
          </label>
          {quote && (
            <div className="quote">
              <div><span>{money(quote.pricePerDay)} × {quote.days} day{quote.days > 1 ? 's' : ''}</span><span>{money(quote.subtotal)}</span></div>
              {quote.discount > 0 && <div className="discount"><span>Long rental discount</span><span>−{money(quote.discount)}</span></div>}
              <div className="total"><span>Total</span><span>{money(quote.totalAmount)}</span></div>
              <div className={quote.available ? 'avail ok' : 'avail no'}>
                {quote.available ? '✓ Available for these dates' : '✕ Not available for these dates'}
              </div>
            </div>
          )}
          <Alert>{quoteError || error}</Alert>
          {isAdmin ? (
            <p className="muted small">Admins manage vehicles from the admin panel.</p>
          ) : (
            <button className="btn btn-primary btn-block btn-lg" disabled={busy || !quote?.available} onClick={book}>
              {busy ? 'Booking…' : user ? 'Book now' : 'Log in to book'}
            </button>
          )}
          <p className="muted small center">7+ days: 10% off · 30+ days: 15% off</p>
        </aside>
      </div>
    </div>
  );
}
