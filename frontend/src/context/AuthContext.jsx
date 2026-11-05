import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'aegis_jwt_token';
const USER_KEY = 'aegis_user_profile';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  });

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync token & user to localStorage
  const saveAuthSession = (jwtToken, userProfile) => {
    setToken(jwtToken);
    setUser(userProfile);
    setAuthError(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, jwtToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userProfile));
    }
  };

  const clearAuthSession = () => {
    setToken(null);
    setUser(null);
    setAuthError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  const login = async (username, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await authService.login(username, password);
      const userProfile = {
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        email: data.email,
        department: data.department
      };
      saveAuthSession(data.token, userProfile);
      return userProfile;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (formData) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await authService.signup(formData);
      const userProfile = {
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        email: data.email,
        department: data.department
      };
      saveAuthSession(data.token, userProfile);
      return userProfile;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    clearAuthSession();
  };

  const switchRole = (newRole) => {
    const roleUpper = String(newRole).toUpperCase();
    const updatedProfile = {
      ...(user || {}),
      role: roleUpper,
      username: roleUpper === 'NURSE' ? 'nurse.priya' : 'dr.sharma',
      fullName: roleUpper === 'NURSE' ? 'Nurse Priya Patel, RN' : 'Dr. Rajesh Sharma, MD',
      department: 'Medical Intensive Care Unit (MICU Ward 3B)'
    };
    setUser(updatedProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
    }
  };

  const isAuthenticated = !!token && !!user;
  const isDoctor = user?.role === 'DOCTOR' || (!user?.role && true);
  const isNurse = user?.role === 'NURSE';

  const value = {
    token,
    user,
    isAuthenticated,
    isDoctor,
    isNurse,
    authLoading,
    authError,
    login,
    signup,
    logout,
    switchRole,
    clearError: () => setAuthError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

