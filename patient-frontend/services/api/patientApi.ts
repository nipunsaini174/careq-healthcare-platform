import axiosInstance from "./axios";
import type { ApiResponse, Patient } from "@/types";

/** Shape returned by GET /patients/appointments — mirrors the legacy localStorage record. */
export interface ApiAppointment {
  id: string; // "APT-123"
  appointment_id: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string; // "Jun 15, 2026"
  time: string; // "10:30 AM"
  isoDate: string;
  status: "Upcoming" | "Completed" | "Cancelled" | string;
  bookingType: "self" | "other";
  patientName: string;
  relationship: string;
  personId: string;
}

export const patientApi = {
  getPatient: async (patientId: string) => {
    const { data } = await axiosInstance.get<ApiResponse<Patient>>(`/patients/${patientId}`);
    return data.data;
  },

  getProfile: async () => {
    const { data } = await axiosInstance.get<ApiResponse<Patient>>('/patients/profile');
    return data.data;
  },

  updateProfile: async (payload: Partial<Patient>) => {
    const { data } = await axiosInstance.patch<ApiResponse<Patient>>('/patients/profile', payload);
    return data.data;
  },

  // Source of truth for the home-page user-state machine.
  // Returns [] for brand-new users (drives `first-time` view).
  getAppointments: async (): Promise<ApiAppointment[]> => {
    const { data } = await axiosInstance.get<ApiResponse<ApiAppointment[]>>('/patients/appointments');
    return data.data ?? [];
  },

  bookAppointment: async (payload: any) => {
    const { data } = await axiosInstance.post('/patients/appointments', payload);
    return data.data;
  },

  cancelAppointment: async (appointmentId: string) => {
    const { data } = await axiosInstance.patch(`/patients/appointments/${appointmentId}/cancel`);
    return data.data;
  },

  updatePatient: async (patientId: string, payload: Partial<Patient>) => {
    const { data } = await axiosInstance.patch<ApiResponse<Patient>>(
      `/patients/${patientId}`,
      payload
    );
    return data.data;
  },

  getPatientHistory: async (patientId: string) => {
    const { data } = await axiosInstance.get<ApiResponse<Patient[]>>(
      `/patients/${patientId}/history`
    );
    return data.data;
  },

  getHospitals: async () => {
    const { data } = await axiosInstance.get('/hospitals');
    return data.data || [];
  },

  getDoctors: async () => {
    const { data } = await axiosInstance.get('/doctors');
    return data.data || [];
  },
};
