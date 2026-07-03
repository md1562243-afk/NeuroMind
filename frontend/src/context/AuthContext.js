// src/context/AuthContext.js
// Global authentication state management using React Context

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const AuthContext = createContext(null);

// AuthProvider component wraps the whole app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);          // Current logged-in user
  const [token, setToken] = useState(null);         // JWT token
  const [loading, setLoading] = useState(true);     // Check if auth is loading

  // On app load, restore user from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('neuromind_token');
    const savedUser = localStorage.getItem('neuromind_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // If JSON parse fails, clear storage
        localStorage.removeItem('neuromind_token');
        localStorage.removeItem('neuromind_user');
      }
    }
    setLoading(false);
  }, []);

  // Login: save token and user to state and localStorage
  const login = (tokenData, userData) => {
    setToken(tokenData);
    setUser(userData);
    localStorage.setItem('neuromind_token', tokenData);
    localStorage.setItem('neuromind_user', JSON.stringify(userData));
  };

  // Logout: clear everything
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('neuromind_token');
    localStorage.removeItem('neuromind_user');
  };

  // Update user info (after profile edit)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('neuromind_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
