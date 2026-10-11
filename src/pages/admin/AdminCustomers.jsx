import { useState } from 'react';
import { Alert, PageHeader, Spinner, StatusBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { date } from '../../lib/format';

export default function AdminCustomers() {
  const { data, error, loading, reload } = useApi('/users');
  const [q, setQ] = useState('');
  const [actionError, setActionError] = useState('');

  const toggle = async (u) => {
    try {
      await api(`/users/${u.id}/active`, { method: 'PATCH', params: { value: !u.active } });
      reload();
    } catch (e) { setActionError(e.message); }
  };
  const list = data?.filter((u) => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container section">
      <PageHeader title="Customers" subtitle={data ? `${data.filter((u) => u.role === 'CUSTOMER').length} registered customers` : ''}
                  actions={<input className="search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />} />
      <Alert>{error?.message || actionError}</Alert>
      {loading && <Spinner />}
      {list && (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Licence</th><th>Joined</th><th>Role</th><th /></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className={u.active ? '' : 'dim'}>
                  <td><strong>{u.name}</strong><div className="muted small">{u.address}</div></td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.drivingLicenseNo || '—'}</td>
                  <td>{date(u.createdAt)}</td>
                  <td><StatusBadge status={u.role} /></td>
                  <td className="actions">
                    {u.role === 'CUSTOMER' && (
                      <button className={`btn btn-sm ${u.active ? 'btn-danger-ghost' : 'btn-ghost'}`} onClick={() => toggle(u)}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
