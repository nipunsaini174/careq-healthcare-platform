import api from './api';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';

export const authService = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.data?.token) {
      setCookie('healthflow-admin-token', response.data.data.token, { maxAge: 60 * 60 * 24, path: '/' });
      setCookie('admin_user', JSON.stringify(response.data.data.user), { maxAge: 60 * 60 * 24, path: '/' });
    }
    return response.data;
  },

  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.data?.token) {
      setCookie('healthflow-admin-token', response.data.data.token, { maxAge: 60 * 60 * 24, path: '/' });
      setCookie('admin_user', JSON.stringify(response.data.data.user), { maxAge: 60 * 60 * 24, path: '/' });
    }
    return response.data;
  },

  logout: async () => {
    // Call backend logout just in case (though it's currently stateless)
    await api.post('/auth/logout');
    // Clear local storage
    if (typeof window !== 'undefined') {
      deleteCookie('healthflow-admin-token', { path: '/' });
      deleteCookie('admin_user', { path: '/' });
    }
  },

  // Helper to get current user from localStorage
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = getCookie('admin_user') as string | undefined;
      if (userStr) return JSON.parse(userStr);
    }
    return null;
  }
};
