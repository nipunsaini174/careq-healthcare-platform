import api from "./api";

export interface HospitalDepartment {
  department_id: string;
  department_name: string;
  location: string;
  daily_capacity: number;
}

export interface HospitalProfile {
  hospital_id: string;
  hospital_name: string;
  registration_no: string;
  branch_name: string;
  address: string;
  phone: string;
  email: string;
  working_hours: string;
  departments: HospitalDepartment[];
}

export interface HospitalProfilePatch {
  hospital_name?: string;
  registration_no?: string;
  branch_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  working_hours?: string;
}

/**
 * Maps the backend's `data` envelope to a frontend-friendly shape.
 * BigInts come back from the backend as strings (see the JSON serialization
 * polyfill in server.ts), so no extra coercion needed.
 */
function normalizeHospital(raw: any): HospitalProfile {
  return {
    hospital_id: String(raw.hospital_id),
    hospital_name: raw.hospital_name ?? "",
    registration_no: raw.registration_no ?? "",
    branch_name: raw.branch_name ?? "",
    address: raw.address ?? "",
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    working_hours: raw.working_hours ?? "",
    departments: Array.isArray(raw.departments)
      ? raw.departments.map((d: any) => ({
          department_id: String(d.department_id),
          department_name: d.department_name,
          location: d.location,
          daily_capacity: Number(d.daily_capacity ?? 0),
        }))
      : [],
  };
}

export const hospitalApi = {
  async getMyHospital(): Promise<HospitalProfile> {
    const { data } = await api.get("/admin/hospital");
    return normalizeHospital(data.data);
  },

  async updateMyHospital(patch: HospitalProfilePatch): Promise<HospitalProfile> {
    const { data } = await api.put("/admin/hospital", patch);
    // The PUT response returns only the updated hospitals row (no nested
    // departments), so we re-normalize with an empty department list and
    // let the caller decide whether to refetch.
    return normalizeHospital({ ...data.data, departments: [] });
  },

  async listDepartments(): Promise<HospitalDepartment[]> {
    const { data } = await api.get("/admin/hospital/departments");
    return (data.data ?? []).map((d: any) => ({
      department_id: String(d.department_id),
      department_name: d.department_name,
      location: d.location,
      daily_capacity: Number(d.daily_capacity ?? 0),
    }));
  },

  /**
   * Same payload as `listDepartments` but uses the staff-scoped route
   * that accepts any authenticated role (admin, receptionist, doctor).
   * Use this from pages that aren't admin-exclusive — e.g. the
   * receptionist Add Doctor form — so a non-admin user doesn't get a
   * 403 just for needing the dropdown list.
   */
  async listDepartmentsForStaff(): Promise<HospitalDepartment[]> {
    const { data } = await api.get("/hospital/departments");
    return (data.data ?? []).map((d: any) => ({
      department_id: String(d.department_id),
      department_name: d.department_name,
      location: d.location,
      daily_capacity: Number(d.daily_capacity ?? 0),
    }));
  },

  async addDepartment(payload: {
    name: string;
    location?: string;
    dailyCapacity?: number;
  }): Promise<HospitalDepartment> {
    const { data } = await api.post("/admin/hospital/departments", payload);
    const d = data.data;
    return {
      department_id: String(d.department_id),
      department_name: d.department_name,
      location: d.location,
      daily_capacity: Number(d.daily_capacity ?? 0),
    };
  },

  async deleteDepartment(departmentId: string): Promise<void> {
    await api.delete(`/admin/hospital/departments/${departmentId}`);
  },
};
