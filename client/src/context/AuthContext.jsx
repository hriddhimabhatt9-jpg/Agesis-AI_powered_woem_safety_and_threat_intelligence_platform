import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aegesis_token'));
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Schedule token refresh before it expires
  const scheduleRefresh = useCallback((tokenStr) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (!tokenStr) return;

    try {
      // Decode JWT to get expiry (without verification — just parsing the payload)
      const payload = JSON.parse(atob(tokenStr.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      // Refresh 2 minutes before expiry
      const refreshIn = Math.max((expiresAt - now) - 120000, 10000);

      refreshTimerRef.current = setTimeout(async () => {
        const refreshToken = localStorage.getItem('aegesis_refresh_token');
        if (!refreshToken) return;
        try {
          const { data } = await authAPI.refresh(refreshToken);
          localStorage.setItem('aegesis_token', data.token);
          localStorage.setItem('aegesis_refresh_token', data.refreshToken);
          setToken(data.token);
          scheduleRefresh(data.token);
        } catch {
          // Refresh failed — will be caught by 401 interceptor
        }
      }, refreshIn);
    } catch {
      // Token parsing failed — skip scheduling
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('aegesis_token');
      if (storedToken) {
        try {
          const { data } = await authAPI.getMe();
          setUser(data.user);
          localStorage.setItem('aegesis_user', JSON.stringify(data.user));
          scheduleRefresh(storedToken);
        } catch {
          // Try to restore from localStorage
          try {
            const stored = JSON.parse(localStorage.getItem('aegesis_user'));
            if (stored) {
              setUser(stored);
              scheduleRefresh(storedToken);
            } else {
              logout();
            }
          } catch { logout(); }
        }
      }
      setLoading(false);
    };
    initAuth();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('aegesis_token', data.token);
    if (data.refreshToken) localStorage.setItem('aegesis_refresh_token', data.refreshToken);
    localStorage.setItem('aegesis_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    scheduleRefresh(data.token);
    return data;
  }, [scheduleRefresh]);

  const register = useCallback(async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('aegesis_token', data.token);
    if (data.refreshToken) localStorage.setItem('aegesis_refresh_token', data.refreshToken);
    localStorage.setItem('aegesis_user', JSON.stringify(data.user));
    // Mark as new user needing onboarding
    localStorage.setItem('aegesis_needs_onboarding', 'true');
    setToken(data.token);
    setUser(data.user);
    scheduleRefresh(data.token);
    return data;
  }, [scheduleRefresh]);

  const googleLogin = useCallback(async (googleData) => {
    const { data } = await authAPI.googleAuth(googleData);
    localStorage.setItem('aegesis_token', data.token);
    if (data.refreshToken) localStorage.setItem('aegesis_refresh_token', data.refreshToken);
    localStorage.setItem('aegesis_user', JSON.stringify(data.user));
    if (data.isNew) localStorage.setItem('aegesis_needs_onboarding', 'true');
    setToken(data.token);
    setUser(data.user);
    scheduleRefresh(data.token);
    return data;
  }, [scheduleRefresh]);

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Try to revoke refresh token on server
    try { authAPI.logout().catch(() => {}); } catch {}
    localStorage.removeItem('aegesis_token');
    localStorage.removeItem('aegesis_refresh_token');
    localStorage.removeItem('aegesis_user');
    localStorage.removeItem('aegesis_needs_onboarding');
    localStorage.removeItem('aegesis_contacts');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('aegesis_user', JSON.stringify(updated));
      
      // Cache contacts specifically for offline SOS
      const contacts = [];
      if (updated.primaryEmergencyContact?.name) contacts.push(updated.primaryEmergencyContact);
      if (updated.additionalEmergencyContacts?.length) contacts.push(...updated.additionalEmergencyContacts);
      if (contacts.length) localStorage.setItem('aegesis_contacts', JSON.stringify(contacts));
      
      return updated;
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.removeItem('aegesis_needs_onboarding');
    setUser(prev => {
      const updated = { ...prev, profileCompleted: true };
      localStorage.setItem('aegesis_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const needsOnboarding = !!localStorage.getItem('aegesis_needs_onboarding') || (user && !user.profileCompleted && !user.primaryEmergencyContact?.name);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, googleLogin, logout, updateUser, completeOnboarding,
      isAuthenticated: !!token && !!user,
      needsOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
