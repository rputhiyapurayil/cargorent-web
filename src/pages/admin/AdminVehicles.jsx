import { useState } from 'react';
import VehicleImage from '../../components/VehicleImage';
import { Alert, Modal, PageHeader, Spinner } from '../../components/ui';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { money, title } from '../../lib/format';

const EMPTY = { registrationNumber: '', type: 'HATCHBACK', brand: '', model: '', year: 2024, seats: 5, fuelType: 'Petrol',
  transmission: 'Manual', pricePerDay: '', status: 'AVAILABLE', imageUrl: '', city: 'Kochi', description: '' };
const CITIES = ['Kochi', 'Kozhikode', 'Thiruvananthapuram', 'Thrissur', 'Kannur'];

export default function AdminVehicles() {
  const { data, error, loading, reload } = useApi('/vehicles', { params: { includeAll: true, sort: 'name' } });
  const meta = useApi('/vehicles/meta');
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState('');

  const setStatus = async (v, value) => {
    setActionError('');
    try {
      await api(`/vehicles/${v.id}/status`, { method: 'PATCH', params: { value } });
      reload();
    } catch (e) { setActionError(e.message); }
  };
  const retire = async (v) => {
    if (!window.confirm(`Remove ${v.brand} ${v.model} (${v.registrationNumber}) from the fleet?`)) return;
    try { await api(`/vehicles/${v.id}`, { method: 'DELETE' }); reload(); } catch (e) { setActionError(e.message); }
  };

  return (
    <div className="container section">
      <PageHeader title="Vehicles" subtitle={data ? `${data.length} vehicles in the fleet` : ''}
                  actions={<button className="btn btn-primary" onClick={() => setEditing(EMPTY)}>+ Add vehicle</button>} />
      <Alert>{error?.message || actionError}</Alert>
      {loading && !data && <Spinner />}
      {data && (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Vehicle</th><th>Reg. no</th><th>Type</th><th>City</th><th className="num">Price/day</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.map((v) => (
                <tr key={v.id} className={v.status === 'RETIRED' ? 'dim' : ''}>
                  <td><div className="cell-vehicle"><VehicleImage vehicle={v} className="thumb" />
                    <div><strong>{v.brand} {v.model}</strong><div className="muted small">{v.year} · {v.seats} seats · {v.fuelType}</div></div></div></td>
                  <td className="mono">{v.registrationNumber}</td>
                  <td>{title(v.type)}</td>
                  <td>{v.city}</td>
                  <td className="num">{money(v.pricePerDay)}</td>
                  <td>
                    <select className="status-select" value={v.status} onChange={(e) => setStatus(v, e.target.value)} aria-label="Status">
                      {['AVAILABLE', 'MAINTENANCE', 'RETIRED'].map((s) => <option key={s} value={s}>{title(s)}</option>)}
                    </select>
                  </td>
                  <td className="actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditing(v)}>Edit</button>
                    {v.status !== 'RETIRED' && <button className="btn btn-sm btn-danger-ghost" onClick={() => retire(v)}>Remove</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <VehicleForm initial={editing} types={meta.data?.types || []} onClose={() => setEditing(null)}
                               onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function VehicleForm({ initial, types, onClose, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial, imageUrl: initial.imageUrl || '', description: initial.description || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const f = (k) => ({ value: form[k] ?? '', onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const body = { ...form, year: Number(form.year), seats: Number(form.seats), pricePerDay: Number(form.pricePerDay) };
    try {
      await api(initial.id ? `/vehicles/${initial.id}` : '/vehicles', { method: initial.id ? 'PUT' : 'POST', body });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial.id ? `Edit ${initial.brand} ${initial.model}` : 'Add vehicle'} onClose={onClose} wide>
      <form onSubmit={submit} className="stack-form">
        <Alert>{error}</Alert>
        <div className="form-row">
          <label>Brand<input required {...f('brand')} /></label>
          <label>Model<input required {...f('model')} /></label>
          <label>Registration no.<input required placeholder="KL07AB1234" {...f('registrationNumber')} /></label>
        </div>
        <div className="form-row">
          <label>Type<select {...f('type')}>{types.map((t) => <option key={t} value={t}>{title(t)}</option>)}</select></label>
          <label>Year<input type="number" min="1990" max="2100" {...f('year')} /></label>
          <label>Seats<input type="number" min="1" max="60" {...f('seats')} /></label>
        </div>
        <div className="form-row">
          <label>Fuel<select {...f('fuelType')}>{['Petrol', 'Diesel', 'Electric', 'CNG'].map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>Transmission<select {...f('transmission')}>{['Manual', 'Automatic'].map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>Price per day (₹)<input type="number" required min="1" step="1" {...f('pricePerDay')} /></label>
        </div>
        <div className="form-row">
          <label>City<select {...f('city')}>{CITIES.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>Status<select {...f('status')}>{['AVAILABLE', 'MAINTENANCE', 'RETIRED'].map((s) => <option key={s} value={s}>{title(s)}</option>)}</select></label>
        </div>
        <label>Image URL<input type="url" placeholder="https://…" {...f('imageUrl')} /></label>
        <label>Description<textarea rows="3" maxLength="1000" {...f('description')} /></label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save vehicle'}</button>
        </div>
      </form>
    </Modal>
  );
}
