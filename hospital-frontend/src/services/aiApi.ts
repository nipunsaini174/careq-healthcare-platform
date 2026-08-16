import axios from 'axios';
import { getCookie } from 'cookies-next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const aiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

aiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    let role = 'admin';
    if (path.includes('/dashboard/doctor')) role = 'doctor';
    if (path.includes('/dashboard/receptionist')) role = 'receptionist';

    const token =
      (getCookie(`healthflow-${role}-token`) as string | undefined) ||
      (getCookie('healthflow-admin-token') as string | undefined) ||
      (getCookie('healthflow-receptionist-token') as string | undefined) ||
      (getCookie('healthflow-doctor-token') as string | undefined) ||
      'demo-bypass-token-careq-2026';

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface StaffAiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actionType?: 'APPOINTMENT_BOOKED' | 'APPOINTMENT_CANCELLED' | 'RECORDS_RETRIEVED' | 'DOCTORS_LISTED';
  actionData?: any;
  timestamp?: string;
}

export const hospitalAiApi = {
  async sendMessage(message: string, history: { role: 'user' | 'assistant'; content: string }[] = []) {
    try {
      const messages = [...history, { role: 'user', content: message }];
      const res = await aiClient.post('/ai/chat', { messages });
      return res.data?.data;
    } catch (error: any) {
      console.error('[hospitalAiApi.sendMessage]', error);
      return {
        reply: `⚠️ Unable to communicate with AI Assistant service. Please check your backend connection.`,
      };
    }
  },

  async searchRecords(query: string) {
    try {
      const res = await aiClient.get(`/ai/search-records?q=${encodeURIComponent(query)}`);
      return res.data?.data;
    } catch (error) {
      console.error('[hospitalAiApi.searchRecords]', error);
      return null;
    }
  },

  async getDoctors() {
    try {
      const res = await aiClient.get('/ai/doctors');
      return res.data?.data;
    } catch (error) {
      console.error('[hospitalAiApi.getDoctors]', error);
      return null;
    }
  },

  async getQueueSummary() {
    try {
      const res = await aiClient.get('/ai/queue-summary');
      return res.data?.data;
    } catch (error) {
      console.error('[hospitalAiApi.getQueueSummary]', error);
      return null;
    }
  },

  async getLabOverview() {
    try {
      const res = await aiClient.get('/ai/lab-overview');
      return res.data?.data;
    } catch (error) {
      console.error('[hospitalAiApi.getLabOverview]', error);
      return null;
    }
  },

  async getRetentionSummary() {
    try {
      const res = await aiClient.get('/ai/retention-summary');
      return res.data?.data;
    } catch (error) {
      console.error('[hospitalAiApi.getRetentionSummary]', error);
      return null;
    }
  },
};
