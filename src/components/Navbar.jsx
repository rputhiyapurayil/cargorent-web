import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

function NotificationBell() {
  const [count, setCount] = useState(0);
  const location = useLocation();
  useEffect(() => {
    let alive = true;
    const load = () => api('/notifications/my/unread-count').then((r) => alive && setCount(r.count)).catch(() => {});
    load();
    const t = setInterval(load, 20000);
    return () => { alive = false; clearInterval(t); };
  }, [location.pathname]);
  return (
    <Link to="/notifications" className="bell" aria-label={`Notifications (${count} unread)`}>
      🔔{count > 0 && <span className="bell-count">{count > 9 ? '9+' : count}</span>}
    </Link>
  );
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const customerLinks = [
    ['/', 'Browse'],
    ['/bookings', 'My bookings'],
  ];
  const adminLinks = [
    ['/admin', 'Dashboard'],
    ['/admin/bookings', 'Bookings'],
    ['/admin/vehicles', 'Vehicles'],
    ['/admin/tracking', 'Tracking'],
    ['/admin/customers', 'Customers'],
    ['/admin/payments', 'Payments'],
    ['/admin/reports', 'Reports'],
  ];
  const links = !user ? [['/', 'Browse']] : isAdmin ? adminLinks : customerLinks;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to={isAdmin ? '/admin' : '/'} className="brand">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span className="brand-text">CarGo<span>Rent</span></span>
          {isAdmin && <span className="badge badge-indigo brand-tag">Admin</span>}
        </Link>
        <button className="icon-btn nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/' || to === '/admin'}>{label}</NavLink>
          ))}
          <div className="nav-right">
            {user ? (
              <>
                {!isAdmin && <NotificationBell />}
                <Link to="/profile" className="avatar" title={user.email}>{user.name?.[0]?.toUpperCase()}</Link>
                <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
