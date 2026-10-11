import { Link } from 'react-router-dom';
import { Alert, PageHeader, Spinner, StatusBadge } from '../../components/ui';
import { useApi } from '../../lib/useApi';
import { dateTime, money, title } from '../../lib/format';

export default function AdminPayments() {
  const { data, error, loading } = useApi('/payments');
  const ok = data?.filter((p) => p.status === 'SUCCESS') || [];
  return (
    <div className="container section">
      <PageHeader title="Payments" subtitle={data ? `${ok.length} successful · ${money(ok.reduce((s, p) => s + Number(p.amount), 0))} collected` : ''} />
      <Alert>{error?.message}</Alert>
      {loading && <Spinner />}
      {data && (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Receipt</th><th>Booking</th><th>Customer</th><th>Method</th><th className="num">Amount</th><th>Status</th></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td className="nowrap">{dateTime(p.paidAt)}</td>
                  <td>{p.receiptNumber ? <Link to={`/receipt/${p.id}`}>{p.receiptNumber}</Link> : <span className="muted">—</span>}
                    <div className="muted small mono">{p.transactionId}</div></td>
                  <td>#{p.bookingId}<div className="muted small">{p.vehicleName}</div></td>
                  <td>{p.customerName}</td>
                  <td>{title(p.method)}<div className="muted small">{p.instrument}</div></td>
                  <td className="num">{money(p.amount)}</td>
                  <td><StatusBadge status={p.status} />{p.failureReason && <div className="muted small">{p.failureReason}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
