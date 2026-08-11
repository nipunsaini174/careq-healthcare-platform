import api from './api';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';

export const authService = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    const payload = response.data.data;
    if (payload?.token) {
      const raw = payload.user ?? {};
      const safeUser = {
        user_id: String(raw.user_id ?? raw.uid ?? ''),
        email: raw.email ?? '',
        full_name: raw.full_name ?? raw.displayName ?? '',
        role: raw.role ?? '',
        phone: raw.phone ?? null,
      };
      const roleStr = (safeUser.role || 'admin').toLowerCase();
      setCookie(`healthflow-${roleStr}-token`, payload.token, { maxAge: 60 * 60 * 24, path: '/' });
      setCookie(`${roleStr}_user`, JSON.stringify(safeUser), { maxAge: 60 * 60 * 24, path: '/' });
    }
    return response.data;
  },

  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    const payload = response.data.data;
    if (payload?.token) {
      const raw = payload.user ?? {};
      const safeUser = {
        user_id: String(raw.user_id ?? raw.uid ?? ''),
        email: raw.email ?? '',
        full_name: raw.full_name ?? raw.displayName ?? '',
        role: raw.role ?? '',
        phone: raw.phone ?? null,
      };
      const roleStr = (safeUser.role || 'admin').toLowerCase();
      setCookie(`healthflow-${roleStr}-token`, payload.token, { maxAge: 60 * 60 * 24, path: '/' });
      setCookie(`${roleStr}_user`, JSON.stringify(safeUser), { maxAge: 60 * 60 * 24, path: '/' });
    }
    return response.data;
  },

  logout: async () => {
    // Call backend logout just in case (though it's currently stateless)
    await api.post('/auth/logout');
    // Clear local storage
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      let role = 'admin';
      if (path.includes('/doctor')) role = 'doctor';
      if (path.includes('/receptionist')) role = 'receptionist';
      deleteCookie(`healthflow-${role}-token`, { path: '/' });
      deleteCookie(`${role}_user`, { path: '/' });
    }
  },

  // Helper to get current user from localStorage
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      let role = 'admin';
      if (path.includes('/doctor')) role = 'doctor';
      if (path.includes('/receptionist')) role = 'receptionist';
      const userStr = getCookie(`${role}_user`) as string | undefined;
      if (userStr) return JSON.parse(userStr);
    }
    return null;
  }
};
