import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const PortalNavContext = createContext(null);

/**
 * Lets the project portal register a logout handler so TopNav can swap
 * "Start a Project" for "Log Out" while the client is authenticated.
 */
export function PortalNavProvider({ children }) {
  const [session, setSession] = useState(null);

  const register = useCallback((handlers) => {
    setSession(handlers);
  }, []);

  const unregister = useCallback(() => {
    setSession(null);
  }, []);

  const setLoggingOut = useCallback((loggingOut) => {
    setSession((prev) => (prev ? { ...prev, loggingOut: Boolean(loggingOut) } : prev));
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.logout),
      loggingOut: Boolean(session?.loggingOut),
      logout: session?.logout || null,
      setLoggingOut,
      register,
      unregister,
    }),
    [session, register, unregister, setLoggingOut]
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
