import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', address: '', drivingLicenseNo: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const field = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setBusy(true); setError('');
    try {
      const { confirm, ...body } = form; // eslint-disable-line no-unused-vars
      await register(body);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Create your account</h1>
        <p className="muted">It takes less than a minute.</p>
        <Alert>{error}</Alert>
        <label>Full name<input required maxLength="100" autoComplete="name" {...field('name')} /></label>
        <div className="form-row">
          <label>Email<input type="email" required autoComplete="email" {...field('email')} /></label>
          <label>Phone<input type="tel" required pattern="[0-9+\- ]{7,20}" autoComplete="tel" {...field('phone')} /></label>
        </div>
        <div className="form-row">
          <label>Password<input type="password" required minLength="6" autoComplete="new-password" {...field('password')} /></label>
          <label>Confirm password<input type="password" required minLength="6" autoComplete="new-password" {...field('confirm')} /></label>
        </div>
        <label>Address <span className="muted">(optional)</span><input maxLength="255" {...field('address')} /></label>
        <label>Driving licence no. <span className="muted">(optional)</span><input maxLength="30" {...field('drivingLicenseNo')} /></label>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
        <p className="center small">Already have an account? <Link to="/login" state={location.state}>Log in</Link></p>
      </form>
    </div>
  );
}
