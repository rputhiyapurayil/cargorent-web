# cargorent-web

React 18 + Vite frontend for CarGoRent, for both customers and admins. Part of **CarGoRent** – see
[cargorent-infra](../cargorent-infra/README.md) for the full system and demo accounts.

```bash
npm install
npm run dev        # http://localhost:5173, /api is proxied to the gateway on :8080
npm run build      # production build in dist/ (served by nginx in Docker)
```

**Customer screens:** browse & search (date availability, filters, recommendations) · vehicle details with live
quote · booking · test-mode payment · printable receipt · my bookings with status steps · live GPS tracking map ·
notifications · profile.

**Admin screens:** dashboard (KPIs, daily revenue, approvals, vehicles on rent) · rental management
(approve / pickup / return / cancel) · vehicle management (add / edit / status / remove) · fleet tracking map ·
customers · payments · reports with CSV export.

Maps use Leaflet with OpenStreetMap tiles (no API key needed).
