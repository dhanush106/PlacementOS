import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken, getAccessToken } from '../utils/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // 1. Get new access token
          const res = await api.post('/auth/refresh', {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });
          const { accessToken } = res.data.data;
          setAccessToken(accessToken);
          
          // 2. Fetch user profile
          const profileRes = await api.get('/users/profile');
          setUser(profileRes.data.data);
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('refreshToken');
          setAccessToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to force logout events from Axios interceptor
    const handleForceLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth_logout_redirect', handleForceLogout);
    return () => window.removeEventListener('auth_logout_redirect', handleForceLogout);
  }, []);

  const registerUser = async (email, name, password, college, targetRole) => {
    const res = await api.post('/auth/register', {
      email,
      name,
      password,
      college,
      targetRole,
    });
    return res.data;
  };

  const verifyEmailOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-email', { email, otp });
    return res.data;
  };

  const loginUser = async (email, password, rememberMe) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    const { accessToken, refreshToken, userId, name: userName, email: userEmail, userRole, profileComplete } = res.data.data;
    
    setAccessToken(accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Fetch complete profile or set initial details
    try {
      const profileRes = await api.get('/users/profile');
      setUser(profileRes.data.data);
    } catch (err) {
      setUser({ userId, email: userEmail, name: userName, role: userRole, profileComplete });
    }
    
    return res.data;
  };

  const logoutUser = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('refreshToken');
      setAccessToken(null);
      setUser(null);
    }
  };

  const requestPasswordReset = async (email) => {
    const res = await api.post('/auth/password-reset', { email });
    return res.data;
  };

  const verifyPasswordResetOtp = async (email, otp) => {
    const res = await api.post('/auth/password-reset/verify', { email, otp });
    return res.data;
  };

  const completePasswordReset = async (resetToken, newPassword) => {
    const res = await api.post('/auth/password-reset/complete', { resetToken, newPassword });
    return res.data;
  };

  const updateUserProfile = (updatedProfile) => {
    setUser(updatedProfile);
  };

  const value = {
    user,
    loading,
    registerUser,
    verifyEmailOtp,
    loginUser,
    logoutUser,
    requestPasswordReset,
    verifyPasswordResetOtp,
    completePasswordReset,
    updateUserProfile,
    isAuthenticated: !!user,
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
