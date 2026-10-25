import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('schoolway_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('schoolway_token') || null;
  });

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('schoolway_user', JSON.stringify(userData));
    localStorage.setItem('schoolway_token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('schoolway_user');
    localStorage.removeItem('schoolway_token');
  };

  const loginWithCredentials = async (email, password) => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      login(data.user, data.token);
      return data.user;
    } catch (err) {
      console.error('[Auth] Login error:', err);
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      login(data.user, data.token);
      return data.user;
    } catch (err) {
      console.error('[Auth] Registration error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      role: user?.role || 'visitor', 
      login, 
      logout, 
      loginWithCredentials, 
      register 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
