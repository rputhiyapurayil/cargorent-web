import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from || (user.role === 'ADMIN' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="muted">Log in to book and manage your rentals.</p>
        <Alert>{error}</Alert>
        <label>Email<input type="email" required autoComplete="email" value={form.email}
                           onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required autoComplete="current-password" value={form.password}
                              onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="center small">New here? <Link to="/register" state={location.state}>Create an account</Link></p>
      </form>
    </div>
  );
}
