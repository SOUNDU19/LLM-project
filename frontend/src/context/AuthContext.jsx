import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token and user are already saved in local storage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      const userPayload = {
        email: data.email,
        fullname: data.fullname,
        role: data.role,
      };
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(userPayload));
      
      setToken(data.access_token);
      setUser(userPayload);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errMsg = error.response?.data?.detail || 'Login failed. Please check credentials.';
      return { success: false, error: errMsg };
    }
  };

  const register = async (email, password, fullname, role) => {
    try {
      await authService.register(email, password, fullname, role);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errMsg = error.response?.data?.detail || 'Registration failed.';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'Admin',
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
