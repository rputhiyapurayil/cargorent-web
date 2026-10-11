import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { date, money } from '../lib/format';

const BANKS = ['State Bank of India', 'Federal Bank', 'South Indian Bank', 'HDFC Bank', 'ICICI Bank', 'Canara Bank'];

const formatCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { data: b, error: loadError, loading } = useApi(`/bookings/${bookingId}`);
  const [method, setMethod] = useState('CARD');
  const [card, setCard] = useState({ cardNumber: '', cardHolder: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState(BANKS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const body = { bookingId: Number(bookingId), method };
    if (method === 'CARD') Object.assign(body, card);
    if (method === 'UPI') body.upiId = upiId;
    if (method === 'NET_BANKING') body.bankName = bankName;
    try {
      const p = await api('/payments', { method: 'POST', body });
      if (p.status === 'SUCCESS') navigate(`/receipt/${p.id}?new=1`, { replace: true });
      else setError(`Payment failed: ${p.failureReason}. You can try again.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="container section"><Spinner /></div>;
  if (loadError) return <div className="container section"><Alert>{loadError.message}</Alert></div>;
  if (b.status !== 'PENDING_PAYMENT') {
    return (
      <div className="container section narrow">
        <Alert kind="info">This booking is already {b.status.toLowerCase().replace('_', ' ')}.</Alert>
        <Link to="/bookings" className="btn btn-primary">Go to my bookings</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1>Complete your payment</h1>
      <div className="pay-layout">
        <form className="card" onSubmit={pay}>
          <div className="test-banner">
            <strong>Test mode</strong> — no real money is charged.
            Card <code>4111 1111 1111 1111</code> succeeds, <code>4000 0000 0000 0002</code> is declined
            (any future expiry, any CVV). UPI <code>failure@upi</code> is declined.
          </div>
          <div className="tabs">
            {[['CARD', '💳 Card'], ['UPI', '📱 UPI'], ['NET_BANKING', '🏦 Net banking']].map(([m, label]) => (
              <button type="button" key={m} className={method === m ? 'active' : ''} onClick={() => setMethod(m)}>{label}</button>
            ))}
          </div>
          {method === 'CARD' && (
            <>
              <label>Card number<input required inputMode="numeric" autoComplete="cc-number" placeholder="4111 1111 1111 1111"
                                       value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: formatCard(e.target.value) })} /></label>
              <label>Name on card<input required autoComplete="cc-name" value={card.cardHolder}
                                        onChange={(e) => setCard({ ...card, cardHolder: e.target.value })} /></label>
              <div className="form-row">
                <label>Expiry (MM/YY)<input required placeholder="12/30" autoComplete="cc-exp" value={card.expiry}
                                            onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} /></label>
                <label>CVV<input required type="password" inputMode="numeric" maxLength="4" autoComplete="cc-csc" value={card.cvv}
                                 onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} /></label>
              </div>
            </>
          )}
          {method === 'UPI' && (
            <label>UPI ID<input required placeholder="yourname@okaxis" value={upiId} onChange={(e) => setUpiId(e.target.value)} /></label>
          )}
          {method === 'NET_BANKING' && (
            <label>Bank<select value={bankName} onChange={(e) => setBankName(e.target.value)}>
              {BANKS.map((x) => <option key={x}>{x}</option>)}
            </select></label>
          )}
          <Alert>{error}</Alert>
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Processing…' : `Pay ${money(b.totalAmount)}`}</button>
        </form>

        <aside className="card summary">
          <h3>Booking summary</h3>
          <div className="vehicle-name">{b.vehicleName}</div>
          <div className="muted small">{b.registrationNumber} · {b.pickupCity}</div>
          <dl>
            <dt>Pickup</dt><dd>{date(b.startDate)}</dd>
            <dt>Return</dt><dd>{date(b.endDate)}</dd>
            <dt>{money(b.pricePerDay)} × {b.days} days</dt><dd>{money(b.subtotal)}</dd>
            {b.discount > 0 && <><dt>Discount</dt><dd className="discount">−{money(b.discount)}</dd></>}
            <dt className="total">Total</dt><dd className="total">{money(b.totalAmount)}</dd>
          </dl>
        </aside>
      </div>
    </div>
  );
}
