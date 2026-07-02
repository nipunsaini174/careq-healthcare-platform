import axiosInstance from "./axios";
import type { ApiResponse, Doctor, Appointment } from "@/types";

export interface DoctorAvailability {
  doctorId: string;
  date: string;
  slots: Array<{ time: string; available: boolean }>;
}

/** Returned by GET /api/doctors/specialties — drives the patient-app specialty chip row. */
export interface ApiSpecialty {
  name: string;
  count: number;
}

/**
 * Doctor record served by GET /api/doctors. Mirrors the DoctorDto the
 * backend emits over websockets, so the Book Appointment screen can
 * treat REST responses and live broadcasts the same way.
 */
export interface ApiBookingDoctor {
  id: string;
  name: string;
  dept: string;
  hospitalId: string;
  departmentId: string;
  specialization: string;
  focus: string;
  qualification: string;
  experience: number;
  phone: string;
  email: string;
  opd: string;
  schedule: string;
  bio: string;
  status: string;
  rating: number;
}

export const doctorApi = {
  /**
   * Old enveloped getter — kept for type compatibility with existing
   * imports but unused in the booking flow. Prefer
   * `getBookingDoctors()` for the patient app's Book page.
   */
  getDoctors: async (params?: {
    department?: string;
    specialty?: string;
    hospitalType?: "government" | "private";
    search?: string;
  }) => {
    const { data } = await axiosInstance.get<ApiResponse<Doctor[]>>("/doctors", { params });
    return data.data;
  },

  /**
   * Fetches the patient-facing doctor directory. The backend currently
   * returns a raw array (no envelope), but we accept either shape so
   * future envelope migrations don't break this caller. Returns an
   * empty list on failure so the UI can render an empty-state instead
   * of crashing.
   */
  getBookingDoctors: async (): Promise<ApiBookingDoctor[]> => {
    try {
      const { data } = await axiosInstance.get("/doctors");
      const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      return raw as ApiBookingDoctor[];
    } catch {
      return [];
    }
  },

  // Returns distinct specialties with doctor counts. Empty list when the
  // backend has no doctors yet — UI should fall back to a derived list.
  getSpecialties: async (): Promise<ApiSpecialty[]> => {
    try {
      const { data } = await axiosInstance.get<ApiResponse<ApiSpecialty[]>>("/doctors/specialties");
      return data.data ?? [];
    } catch {
      return [];
    }
  },

  getDoctorById: async (doctorId: string) => {
    const { data } = await axiosInstance.get<ApiResponse<Doctor>>(`/doctors/${doctorId}`);
    return data.data;
  },

  getDoctorAvailability: async (doctorId: string, date: string) => {
    const { data } = await axiosInstance.get<ApiResponse<DoctorAvailability>>(
      `/doctors/${doctorId}/availability`,
      { params: { date } }
    );
    return data.data;
  },

  bookAppointment: async (payload: {
    doctorId: string;
    date: string;
    time: string;
    notes?: string;
  }) => {
    const { data } = await axiosInstance.post<ApiResponse<Appointment>>(
      "/appointments",
      payload
    );
    return data.data;
  },
};
