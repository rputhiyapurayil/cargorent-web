import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Protected from './components/Protected';
import Home from './pages/Home';
import VehicleDetail from './pages/VehicleDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBookings from './pages/MyBookings';
import Payment from './pages/Payment';
import Receipt from './pages/Receipt';
import Track from './pages/Track';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Dashboard from './pages/admin/Dashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminVehicles from './pages/admin/AdminVehicles';
import AdminTracking from './pages/admin/AdminTracking';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminPayments from './pages/admin/AdminPayments';
import Reports from './pages/admin/Reports';

const customer = (el) => <Protected role="CUSTOMER">{el}</Protected>;
const admin = (el) => <Protected role="ADMIN">{el}</Protected>;

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bookings" element={customer(<MyBookings />)} />
          <Route path="/pay/:bookingId" element={customer(<Payment />)} />
          <Route path="/track/:vehicleId" element={customer(<Track />)} />
          <Route path="/notifications" element={customer(<Notifications />)} />
          <Route path="/receipt/:paymentId" element={<Protected><Receipt /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/admin" element={admin(<Dashboard />)} />
          <Route path="/admin/bookings" element={admin(<AdminBookings />)} />
          <Route path="/admin/vehicles" element={admin(<AdminVehicles />)} />
          <Route path="/admin/tracking" element={admin(<AdminTracking />)} />
          <Route path="/admin/customers" element={admin(<AdminCustomers />)} />
          <Route path="/admin/payments" element={admin(<AdminPayments />)} />
          <Route path="/admin/reports" element={admin(<Reports />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer no-print">
        <div className="container">CarGoRent · Vehicle Rental Management System · Mini project AY 2026-27</div>
      </footer>
    </>
  );
}
