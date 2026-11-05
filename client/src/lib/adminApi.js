import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from '../context/AuthContext.jsx';

/** api() wrapper for admin pages: a 401 sends the user back to the sign-in screen. */
export function useAdminRequest() {
  const { sessionExpired } = useAuth();
  return useCallback(async (path, opts) => {
    try {
      return await api(`/admin${path}`, opts);
    } catch (err) {
      if (err.status === 401) sessionExpired();
      throw err;
    }
  }, [sessionExpired]);
}

export function useAdminData(path) {
  const request = useAdminRequest();
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    request(path)
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }));
    return () => { cancelled = true; };
  }, [path, nonce, request]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}
