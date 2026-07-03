import axios from 'axios';
import { getCookie } from 'cookies-next';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request: attach JWT ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = getCookie('healthflow-admin-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: automatic retry on network errors / server blips ────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error.config;
    const isNetworkOrTimeout = !error.response || error.code === 'ECONNABORTED';
    const isServerError = error.response?.status >= 500;

    // Retry GET requests once after a short pause — handles transient
    // network drops and momentary server restarts without a visible error.
    if ((isNetworkOrTimeout || isServerError) && cfg.method === 'get' && !cfg._retried) {
      cfg._retried = true;
      await new Promise((r) => setTimeout(r, 800));
      return api(cfg);
    }

    return Promise.reject(error);
  }
);

export default api;

