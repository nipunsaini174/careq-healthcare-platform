import axiosInstance from "./axios";
import type { ApiResponse, Patient } from "@/types";

export interface ApiAppointment {
  id: string; // "APT-123"
  appointment_id: string;
  appointment_date?: string;
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
  queuePosition?: number;
  estimatedWaitTime?: number;
  tokenCode?: string;
  chief_complaint?: string;
  symptoms?: string;
  symptoms_duration?: string;
  severity?: string;
  is_first_visit?: boolean;
  days_since_last_visit?: number;
  current_medications?: string;
  medical_history?: string;
  allergies?: string;
  intake_notes?: string;
  token?: {
    tokenId?: string;
    tokenCode?: string;
    queuePosition?: number;
    estimatedWaitTime?: number;
  };
  liveQueueTokens?: string[];
}

export const ACTIVE_APPOINTMENT_STATUSES = [
  "Upcoming",
  "Confirmed",
  "CONFIRMED",
  "Scheduled",
  "In Progress",
  "IN_PROGRESS",
  "Waiting",
  "Active"
];

export function isUpcomingStatus(status?: string): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  if (['completed', 'cancelled', 'canceled', 'done', 'checkedout', 'checked_out', 'skipped', 'absent'].includes(s)) {
    return false;
  }
  return ACTIVE_APPOINTMENT_STATUSES.some(
    (active) => active.toLowerCase() === s
  );
}

/** Map API patient record → profile form state. */
export function mapPatientToProfileForm(patient: Patient) {
  const dobRaw = patient.dob;
  const dob =
    typeof dobRaw === "string"
      ? dobRaw.includes("T")
        ? dobRaw.split("T")[0]
        : dobRaw
      : "";
  return {
    name: patient.full_name || "",
    phone: patient.phone || "",
    email: patient.email || "",
    abhaId: patient.abha_id || "",
    dob,
  };
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
