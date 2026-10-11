import { createContext, useContext, useEffect, useState } from 'react';
import { api, session } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(session.user());

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('cargorent:logout', onLogout);
    return () => window.removeEventListener('cargorent:logout', onLogout);
  }, []);

  const handleAuth = (res) => {
    session.save(res.token, res.user);
    setUser(res.user);
    return res.user;
  };

  const value = {
    user,
    isAdmin: user?.role === 'ADMIN',
    login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(handleAuth),
    register: (form) => api('/auth/register', { method: 'POST', body: form }).then(handleAuth),
    logout: () => { session.clear(); setUser(null); },
    updateUser: (u) => { session.save(session.token(), u); setUser(u); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
