// src/utils/api.js
// Axios instance with base URL and JWT token handling

import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('neuromind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('neuromind_token');
      localStorage.removeItem('neuromind_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
