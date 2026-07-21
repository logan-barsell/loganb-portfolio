import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSession, login as loginRequest, logout as logoutRequest, setUnauthorizedHandler } from '../api/adminClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getSession();
        if (!cancelled) {
          setUser(data.authenticated ? { email: data.email } : null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    setUser({ email: data.email });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      clearSession,
    }),
    [user, loading, login, logout, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
