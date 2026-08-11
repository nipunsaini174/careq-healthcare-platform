import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  // 30s: covers cold-start delays from Prisma + Supabase round-trips
  // on first hit after a long idle period. Fast-failing at 10s caused
  // false-positive timeouts on the first login of a session.
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

import { getCookie } from 'cookies-next';

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Retrieve the JWT token from cookies or localStorage
    if (typeof window !== 'undefined') {
      const token = getCookie('healthflow-access-token') || localStorage.getItem('healthflow-access-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("healthflow-access-token");
        localStorage.removeItem("healthflow-refresh-token");
        localStorage.removeItem("user");
        const { deleteCookie } = require("cookies-next");
        deleteCookie("healthflow-access-token", { path: "/" });
        deleteCookie("user", { path: "/" });
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
