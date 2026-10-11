import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Spinner, StatusBadge } from '../components/ui';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { date, dateTime, money, title } from '../lib/format';

export default function Receipt() {
  const { paymentId } = useParams();
  const [params] = useSearchParams();
  const { isAdmin } = useAuth();
  const { data: r, error, loading } = useApi(`/payments/${paymentId}/receipt`);

  if (loading) return <div className="container section"><Spinner /></div>;
  if (error) return <div className="container section"><Alert>{error.message}</Alert></div>;

  return (
    <div className="container section narrow">
      {params.get('new') && <Alert kind="success">Payment successful! Your booking is confirmed and waiting for approval.</Alert>}
      <div className="card receipt" id="receipt">
        <div className="receipt-head">
          <div>
            <div className="brand"><img src="/favicon.svg" alt="" width="28" height="28" /><span className="brand-text">CarGo<span>Rent</span></span></div>
            <div className="muted small">{r.companyName}<br />{r.companyAddress}<br />{r.companyEmail}</div>
          </div>
          <div className="right">
            <h2>Payment receipt</h2>
            <div className="small">No. <strong>{r.receiptNumber}</strong></div>
            <div className="small">{dateTime(r.paidAt)}</div>
            <StatusBadge status={r.status} />
          </div>
        </div>
        <div className="receipt-grid">
          <div><span>Billed to</span><strong>{r.customerName}</strong><div className="small">{r.customerEmail}</div></div>
          <div><span>Booking</span><strong>#{r.bookingId}</strong></div>
          <div><span>Payment method</span><strong>{title(r.method)}</strong><div className="small">{r.instrument}</div></div>
          <div><span>Transaction ID</span><strong className="mono">{r.transactionId}</strong></div>
        </div>
        <table className="table">
          <thead><tr><th>Description</th><th className="num">Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>{r.vehicleName} ({r.registrationNumber})<div className="muted small">{date(r.startDate)} → {date(r.endDate)} · {r.days} days × {money(r.pricePerDay)}</div></td>
              <td className="num">{money(r.subtotal)}</td>
            </tr>
            {r.discount > 0 && <tr><td>Long rental discount</td><td className="num">−{money(r.discount)}</td></tr>}
          </tbody>
          <tfoot><tr><th>Amount paid</th><th className="num">{money(r.amountPaid)}</th></tr></tfoot>
        </table>
        <p className="muted small center">Processed in {r.gatewayMode} mode. This is a computer-generated receipt.</p>
      </div>
      <div className="receipt-actions no-print">
        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print / Save PDF</button>
        <Link className="btn btn-ghost" to={isAdmin ? '/admin/payments' : '/bookings'}>Back</Link>
      </div>
    </div>
  );
}
