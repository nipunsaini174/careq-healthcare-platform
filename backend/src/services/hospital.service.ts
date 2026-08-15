import { prisma } from '../prisma/client.js';

export interface HospitalProfileUpdate {
  hospital_name?: string;
  registration_no?: string;
  branch_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  working_hours?: string;
}

const MAX_STRING_LEN = 255;
const MAX_ADDRESS_LEN = 2000;

/**
 * Validates user-supplied profile fields. Throws on any rule violation so
 * the controller can surface a 400 with the exact issue. Centralised here
 * so admin + receptionist updates share one source of truth.
 */
function validateProfile(input: HospitalProfileUpdate) {
  const checks: Array<[string, string | undefined, number, boolean]> = [
    ['hospital_name', input.hospital_name, MAX_STRING_LEN, true],
    ['registration_no', input.registration_no, MAX_STRING_LEN, true],
    ['branch_name', input.branch_name, MAX_STRING_LEN, false],
    ['address', input.address, MAX_ADDRESS_LEN, true],
    ['phone', input.phone, 32, true],
    ['email', input.email, MAX_STRING_LEN, true],
    ['working_hours', input.working_hours, MAX_STRING_LEN, false],
  ];

  for (const [field, value, maxLen, required] of checks) {
    if (value === undefined) continue; // partial update is fine
    if (typeof value !== 'string') {
      throw new Error(`${field} must be a string`);
    }
    const trimmed = value.trim();
    if (required && trimmed.length === 0) {
      throw new Error(`${field} cannot be empty`);
    }
    if (trimmed.length > maxLen) {
      throw new Error(`${field} exceeds maximum length of ${maxLen} characters`);
    }
  }

  if (input.email !== undefined && input.email.trim().length > 0) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim());
    if (!emailOk) throw new Error('email is not a valid email address');
  }
}

export class HospitalService {
  /**
   * Returns the hospital row + nested departments. Used by the admin
   * settings page and by anything that needs a snapshot of one hospital.
   */
  async getHospitalById(hospitalId: number) {
    const hospital = await prisma.hospitals.findUnique({
      where: { hospital_id: hospitalId },
      include: {
        departments: {
          select: {
            department_id: true,
            department_name: true,
            location: true,
            daily_capacity: true,
          },
          orderBy: { department_id: 'asc' },
        },
      },
    });
    if (!hospital) throw new Error('Hospital not found');
    return hospital;
  }

  /**
   * Partial update of a hospital's profile fields. Only the fields the
   * caller supplies are touched — undefined keys are ignored so this is
   * safe for a PATCH-style payload from the settings form.
   */
  async updateHospital(hospitalId: number, patch: HospitalProfileUpdate) {
    validateProfile(patch);

    const data: HospitalProfileUpdate = {};
    if (patch.hospital_name !== undefined) data.hospital_name = patch.hospital_name.trim();
    if (patch.registration_no !== undefined) data.registration_no = patch.registration_no.trim();
    if (patch.branch_name !== undefined) data.branch_name = patch.branch_name.trim();
    if (patch.address !== undefined) data.address = patch.address.trim();
    if (patch.phone !== undefined) data.phone = patch.phone.trim();
    if (patch.email !== undefined) data.email = patch.email.trim();
    if (patch.working_hours !== undefined) data.working_hours = patch.working_hours.trim();

    if (Object.keys(data).length === 0) {
      throw new Error('No updatable fields provided');
    }

    const updated = await prisma.hospitals.update({
      where: { hospital_id: hospitalId },
      data,
    });
    return updated;
  }

  /**
   * Lists every hospital plus the names of its departments. Patient app
   * uses this for the "Book Appointment → choose a hospital" view, so we
   * trim the payload to just what that screen needs.
   */
  async listPublicHospitals() {
    const rows = await prisma.hospitals.findMany({
      orderBy: { hospital_id: 'asc' },
      include: {
        departments: {
          select: { department_name: true },
          orderBy: { department_id: 'asc' },
        },
      },
    });

    return rows.map((h) => ({
      id: h.hospital_id.toString(),
      name: h.hospital_name,
      branchName: h.branch_name,
      address: h.address,
      phone: h.phone,
      email: h.email,
      workingHours: h.working_hours,
      departments: h.departments.map((d) => d.department_name),
    }));
  }

  async listDepartments(hospitalId: number) {
    return prisma.departments.findMany({
      where: { hospital_id: hospitalId },
      orderBy: { department_id: 'asc' },
      select: {
        department_id: true,
        department_name: true,
        location: true,
        daily_capacity: true,
      },
    });
  }

  async addDepartment(hospitalId: number, payload: { name: string; location?: string; dailyCapacity?: number }) {
    const name = (payload.name ?? '').trim();
    if (!name) throw new Error('Department name is required');
    if (name.length > MAX_STRING_LEN) throw new Error(`Department name exceeds ${MAX_STRING_LEN} characters`);

    // Prevent duplicate department names within a single hospital — keeps
    // the patient-app specialty filter clean and avoids surprise dupes
    // when an admin double-clicks "Add".
    const existing = await prisma.departments.findFirst({
      where: {
        hospital_id: hospitalId,
        department_name: { equals: name },
      },
    });
    if (existing) throw new Error(`Department "${name}" already exists for this hospital`);

    return prisma.departments.create({
      data: {
        hospital_id: hospitalId,
        department_name: name,
        location: (payload.location ?? '').trim() || 'Main Block',
        daily_capacity: payload.dailyCapacity && payload.dailyCapacity > 0 ? payload.dailyCapacity : 50,
      },
      select: {
        department_id: true,
        department_name: true,
        location: true,
        daily_capacity: true,
      },
    });
  }

  /**
   * Deletes a department but only if it belongs to the supplied hospital.
   * This is the hospital-scoped guard that stops admin A from deleting
   * hospital B's departments by guessing IDs.
   */
  async deleteDepartment(hospitalId: number, departmentId: number) {
    const dept = await prisma.departments.findUnique({
      where: { department_id: departmentId },
    });
    if (!dept) throw new Error('Department not found');
    if (dept.hospital_id !== hospitalId) {
      throw new Error('Department does not belong to your hospital');
    }

    // Reject if any doctors are still assigned to this department — we
    // don't want to orphan FK rows. Admin must reassign doctors first.
    const docCount = await prisma.doctors.count({ where: { department_id: departmentId } });
    if (docCount > 0) {
      throw new Error(`Cannot delete: ${docCount} doctor(s) still assigned to this department`);
    }

    await prisma.departments.delete({ where: { department_id: departmentId } });
    return { success: true };
  }
}

export const hospitalService = new HospitalService();
