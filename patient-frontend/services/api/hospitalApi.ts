import axiosInstance from "./axios";

/**
 * Shape returned by GET /api/hospitals. The backend already maps the
 * Prisma row to camelCase strings, so the patient app can consume it
 * as-is. `id` is a stringified BigInt.
 */
export interface ApiHospital {
  id: string;
  name: string;
  branchName: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  departments: string[];
}

export const hospitalApi = {
  /**
   * Lists every hospital plus its department names. Used by the
   * Book Appointment → "choose a hospital" view to populate the cards.
   * Returns an empty array on failure so the UI degrades gracefully.
   */
  getAll: async (): Promise<ApiHospital[]> => {
    try {
      const { data } = await axiosInstance.get<{ data: ApiHospital[] }>("/hospitals");
      return data.data ?? [];
    } catch {
      return [];
    }
  },
};
