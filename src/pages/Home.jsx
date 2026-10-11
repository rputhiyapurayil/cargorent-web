import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard';
import { Alert, Empty, Spinner } from '../components/ui';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { addDays, date, isoDate, title } from '../lib/format';

const FILTER_KEYS = ['q', 'type', 'brand', 'city', 'fuelType', 'transmission', 'minSeats', 'maxPrice', 'from', 'to', 'sort'];

export default function Home() {
  const { user, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ''])), [params]);
  const hasDates = filters.from && filters.to;

  const meta = useApi('/vehicles/meta');
  const vehicles = useApi('/vehicles', { params: filters }, [params.toString()]);
  const recs = useApi(user && !isAdmin ? '/vehicles/recommendations' : null);

  const set = (patch) => {
    const next = { ...filters, ...patch };
    if (patch.from && (!next.to || next.to <= patch.from)) next.to = addDays(patch.from, 1);
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)), { replace: true });
  };
  const today = isoDate();
  const dateQuery = hasDates ? `?from=${filters.from}&to=${filters.to}` : '';

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Rent the right vehicle, <span>in minutes.</span></h1>
          <p>Cars, SUVs, bikes and vans across Kerala. Check availability, book online and track your ride live.</p>
          <form className="hero-search" onSubmit={(e) => e.preventDefault()}>
            <label>Pickup date
              <input type="date" min={today} value={filters.from} onChange={(e) => set({ from: e.target.value })} />
            </label>
            <label>Return date
              <input type="date" min={filters.from ? addDays(filters.from, 1) : addDays(today, 1)} value={filters.to}
                     onChange={(e) => set({ to: e.target.value })} />
            </label>
            <label>City
              <select value={filters.city} onChange={(e) => set({ city: e.target.value })}>
                <option value="">Any city</option>
                {meta.data?.cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Vehicle type
              <select value={filters.type} onChange={(e) => set({ type: e.target.value })}>
                <option value="">Any type</option>
                {meta.data?.types.map((t) => <option key={t} value={t}>{title(t)}</option>)}
              </select>
            </label>
          </form>
        </div>
      </section>

      <div className="container">
        {recs.data?.length > 0 && !hasDates && (
          <section className="section">
            <h2 className="section-title">Recommended for you</h2>
            <div className="grid grid-3">
              {recs.data.slice(0, 3).map((r) => <VehicleCard key={r.vehicle.id} vehicle={r.vehicle} reason={r.reason} />)}
            </div>
          </section>
        )}

        <section className="section browse">
          <aside className="filters card">
            <h3>Filters</h3>
            <label>Search
              <input placeholder="Brand, model…" value={filters.q} onChange={(e) => set({ q: e.target.value })} />
            </label>
            <label>Brand
              <select value={filters.brand} onChange={(e) => set({ brand: e.target.value })}>
                <option value="">Any</option>
                {meta.data?.brands.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
            <label>Fuel
              <select value={filters.fuelType} onChange={(e) => set({ fuelType: e.target.value })}>
                <option value="">Any</option>
                {meta.data?.fuelTypes.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <label>Transmission
              <select value={filters.transmission} onChange={(e) => set({ transmission: e.target.value })}>
                <option value="">Any</option>
                {meta.data?.transmissions.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Min seats
              <select value={filters.minSeats} onChange={(e) => set({ minSeats: e.target.value })}>
                <option value="">Any</option>
                {[2, 4, 5, 7, 12].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select>
            </label>
            <label>Max price / day {filters.maxPrice && <strong>₹{filters.maxPrice}</strong>}
              <input type="range" min="500" max="6000" step="250" value={filters.maxPrice || 6000}
                     onChange={(e) => set({ maxPrice: e.target.value === '6000' ? '' : e.target.value })} />
            </label>
            <button className="btn btn-ghost btn-block" onClick={() => setParams({}, { replace: true })}>Clear all</button>
          </aside>

          <div>
            <div className="browse-head">
              <div>
                <h2 className="section-title">{hasDates ? 'Available vehicles' : 'All vehicles'}</h2>
                <p className="muted small">
                  {hasDates ? `Free from ${date(filters.from)} to ${date(filters.to)}` : 'Pick dates above to see only vehicles free on those days'}
                  {vehicles.data && ` · ${vehicles.data.length} found`}
                </p>
              </div>
              <select value={filters.sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort">
                <option value="">Price: low to high</option>
                <option value="priceDesc">Price: high to low</option>
                <option value="name">Name</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            {vehicles.loading && <Spinner />}
            <Alert>{vehicles.error?.message}</Alert>
            {vehicles.data?.length === 0 && <Empty title="No vehicles match">Try different dates or fewer filters.</Empty>}
            <div className="grid grid-3">
              {vehicles.data?.map((v) => <VehicleCard key={v.id} vehicle={v} query={dateQuery} />)}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
