import api from './api';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';

export const authService = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.data?.token) {
      setCookie('healthflow-access-token', response.data.data.token, { maxAge: 60 * 60 * 24, path: '/' });
      setCookie('user', JSON.stringify(response.data.data.user), { maxAge: 60 * 60 * 24, path: '/' });
      if (typeof window !== "undefined") {
        localStorage.setItem("healthflow-access-token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
      }
    }
    return response.data;
  },

  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.data?.token) {
      setCookie('healthflow-access-token', response.data.data.token, { maxAge: 60 * 60 * 24, path: '/' });
      setCookie('user', JSON.stringify(response.data.data.user), { maxAge: 60 * 60 * 24, path: '/' });
      if (typeof window !== "undefined") {
        localStorage.setItem("healthflow-access-token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
      }
    }
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    if (typeof window !== 'undefined') {
      deleteCookie('healthflow-access-token', { path: '/' });
      deleteCookie('user', { path: '/' });
      localStorage.removeItem("healthflow-access-token");
      localStorage.removeItem("healthflow-refresh-token");
      localStorage.removeItem("user");
    }
  },

  // Helper to get current user from localStorage
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = getCookie('user') as string | undefined;
      if (userStr) return JSON.parse(userStr);
    }
    return null;
  }
};
