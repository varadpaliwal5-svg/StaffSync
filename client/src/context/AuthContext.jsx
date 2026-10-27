import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('staffsync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('staffsync_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('staffsync_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('staffsync_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid:', err.message);
          localStorage.removeItem('staffsync_token');
          localStorage.removeItem('staffsync_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: jwtToken, user: userData } = res.data;
        localStorage.setItem('staffsync_token', jwtToken);
        localStorage.setItem('staffsync_user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('staffsync_token');
    localStorage.removeItem('staffsync_user');
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('staffsync_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('[AuthContext] Failed to refresh user:', err.message);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!token && !!user,
    isHR: user?.role === 'hr',
    isManager: user?.role === 'manager',
    isEmployee: user?.role === 'employee',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
