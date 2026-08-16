import axios from 'axios';
import { getCookie } from 'cookies-next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const aiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000, // generous timeout for LLM responses
  headers: {
    'Content-Type': 'application/json',
  },
});

aiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token =
      getCookie('healthflow-access-token') ||
      localStorage.getItem('healthflow-access-token') ||
      'demo-patient-token-2026';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actionType?: 'APPOINTMENT_BOOKED' | 'APPOINTMENT_CANCELLED' | 'RECORDS_RETRIEVED' | 'DOCTORS_LISTED';
  actionData?: any;
  timestamp?: string;
}

export const aiApi = {
  async sendMessage(message: string, history: { role: 'user' | 'assistant'; content: string }[] = []) {
    try {
      const messages = [...history, { role: 'user', content: message }];
      const res = await aiClient.post('/ai/chat', { messages });
      return res.data?.data;
    } catch (error: any) {
      console.error('[aiApi.sendMessage]', error);
      // Fallback helpful offline message
      return {
        reply: `⚠️ I encountered a temporary connection issue reaching the AI service. Please ensure the backend server is running, or ask me again in a moment!`,
      };
    }
  },

  async getMyRecords() {
    try {
      const res = await aiClient.get('/ai/my-records');
      return res.data?.data;
    } catch (error) {
      console.error('[aiApi.getMyRecords]', error);
      return null;
    }
  },

  async getDoctors() {
    try {
      const res = await aiClient.get('/ai/doctors');
      return res.data?.data;
    } catch (error) {
      console.error('[aiApi.getDoctors]', error);
      return null;
    }
  },
};
