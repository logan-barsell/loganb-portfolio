import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  fetchClientSession,
  loginClient,
  logoutClient,
} from '../api/clientAuth';

const PortalNavContext = createContext(null);

/**
 * Shared client-account state for login, project selection, portal access,
 * and the site-wide logout action.
 */
export function PortalNavProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    authenticated: false,
    client: null,
    projects: [],
  });
  const [loggingOut, setLoggingOut] = useState(false);

  const applySession = useCallback((data) => {
    setState({
      loading: false,
      authenticated: Boolean(data?.authenticated ?? data?.client),
      client: data?.client || null,
      projects: data?.projects || [],
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchClientSession();
      applySession(data);
      return data;
    } catch {
      applySession(null);
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email, password) => {
      const data = await loginClient(email, password);
      applySession({ ...data, authenticated: true });
      return data;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutClient();
      applySession(null);
    } finally {
      setLoggingOut(false);
    }
  }, [applySession, loggingOut]);

  const value = useMemo(
    () => ({
      isAuthenticated: state.authenticated,
      loading: state.loading,
      client: state.client,
      projects: state.projects,
      loggingOut,
      login,
      logout,
      refresh,
    }),
    [state, loggingOut, login, logout, refresh]
  );

  return <PortalNavContext.Provider value={value}>{children}</PortalNavContext.Provider>;
}

export function usePortalNav() {
  const ctx = useContext(PortalNavContext);
  if (!ctx) {
    throw new Error('usePortalNav must be used within PortalNavProvider');
  }
  return ctx;
}
