import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMe, login as apiLogin, signup as apiSignup } from '../api/authApi';
import { getStoredToken, setStoredToken } from '../api/apiClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = getStoredToken();
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        setStoredToken(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }
    window.addEventListener('markpulse:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('markpulse:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, user: loggedInUser } = await apiLogin(credentials);
    setStoredToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const signup = useCallback(async (details) => {
    const { token, user: newUser } = await apiSignup(details);
    setStoredToken(token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), initializing, login, signup, logout }),
    [user, initializing, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
