import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Loading } from '../components/ui/Feedback.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  // True after a deliberate sign-out, so the next person is not sent back to the previous user's page.
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(d.user);
    setSignedOut(false);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } finally { setSignedOut(true); setUser(null); }
  }, []);

  /** Call when any admin request returns 401 so the UI returns to the sign-in page. */
  const sessionExpired = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, checking, signedOut, login, logout, sessionExpired, isAdmin: user?.role === 'admin' }), [user, checking, signedOut, login, logout, sessionExpired]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function RequireAuth({ children, role }) {
  const { user, checking, signedOut } = useAuth();
  const location = useLocation();
  if (checking) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to="/admin/login" replace state={signedOut ? undefined : { from: location.pathname }} />;
  if (role && user.role !== role) {
    return (
      <div className="state-block" role="alert">
        <h2>Access restricted</h2>
        <p>Your account ({user.role}) does not have permission to view this page.</p>
      </div>
    );
  }
  return children;
}
