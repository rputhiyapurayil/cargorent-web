import { useEffect, useState } from 'react';
import { Alert, PageHeader } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', address: '', drivingLicenseNo: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({});

  useEffect(() => {
    api('/users/me').then((u) => setForm({ name: u.name, phone: u.phone || '', address: u.address || '', drivingLicenseNo: u.drivingLicenseNo || '' }));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      updateUser(await api('/users/me', { method: 'PUT', body: form }));
      setMsg({ profile: ['success', 'Profile updated'] });
    } catch (err) {
      setMsg({ profile: ['error', err.message] });
    }
  };
  const changePassword = async (e) => {
    e.preventDefault();
    try {
      await api('/users/me/password', { method: 'PUT', body: pw });
      setPw({ currentPassword: '', newPassword: '' });
      setMsg({ password: ['success', 'Password changed'] });
    } catch (err) {
      setMsg({ password: ['error', err.message] });
    }
  };
  const field = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="container section narrow">
      <PageHeader title="My profile" subtitle={`${user.email} · ${user.role.toLowerCase()}`} />
      <form className="card stack-form" onSubmit={save}>
        <h3>Personal details</h3>
        {msg.profile && <Alert kind={msg.profile[0]}>{msg.profile[1]}</Alert>}
        <label>Full name<input required {...field('name')} /></label>
        <div className="form-row">
          <label>Phone<input required pattern="[0-9+\- ]{7,20}" {...field('phone')} /></label>
          <label>Driving licence no.<input {...field('drivingLicenseNo')} /></label>
        </div>
        <label>Address<input {...field('address')} /></label>
        <button className="btn btn-primary">Save changes</button>
      </form>
      <form className="card stack-form" onSubmit={changePassword}>
        <h3>Change password</h3>
        {msg.password && <Alert kind={msg.password[0]}>{msg.password[1]}</Alert>}
        <div className="form-row">
          <label>Current password<input type="password" required autoComplete="current-password" value={pw.currentPassword}
                                        onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
          <label>New password<input type="password" required minLength="6" autoComplete="new-password" value={pw.newPassword}
                                    onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
        </div>
        <button className="btn btn-ghost">Update password</button>
      </form>
    </div>
  );
}
