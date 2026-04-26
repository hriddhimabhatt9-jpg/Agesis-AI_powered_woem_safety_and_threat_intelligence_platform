import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const { data } = await authAPI.getMe();
          setUser(data.user);
          localStorage.setItem('aegesis_user', JSON.stringify(data.user));
        } catch {
          // Try to restore from localStorage
          try {
            const stored = JSON.parse(localStorage.getItem('aegesis_user'));
            if (stored) { setUser(stored); }
            else { logout(); }
          } catch { logout(); }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('aegesis_token', data.token);
    localStorage.setItem('aegesis_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('aegesis_token', data.token);
    localStorage.setItem('aegesis_user', JSON.stringify(data.user));
    // Mark as new user needing onboarding
    localStorage.setItem('aegesis_needs_onboarding', 'true');
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const googleLogin = useCallback(async (googleData) => {
    const { data } = await authAPI.googleAuth(googleData);
    localStorage.setItem('aegesis_token', data.token);
    localStorage.setItem('aegesis_user', JSON.stringify(data.user));
    if (data.isNew) localStorage.setItem('aegesis_needs_onboarding', 'true');
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('aegesis_token');
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
