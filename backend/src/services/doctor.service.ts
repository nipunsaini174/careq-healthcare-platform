import { prisma } from '../prisma/client.js';
import { supabaseAdmin } from '../config/supabase.js';
import { safeEmit } from '../sockets/emit.js';

/**
 * Shared mapper from a Prisma doctor row (with users + departments
 * joined in) to the API shape returned by every doctor endpoint and
 * broadcast over websockets. Centralising this guarantees REST and
 * realtime payloads stay in lockstep — a frontend handling either
 * source sees identical fields.
 */
function mapDoctorRow(doc: any) {
  return {
    id: String(doc.doctor_id),
    name: doc.users?.full_name ?? '',
    dept: doc.departments?.department_name ?? '',
    hospitalId: String(doc.hospital_id),
    departmentId: String(doc.department_id),
    specialization: doc.specialization || doc.departments?.department_name || '',
    focus: doc.focus || '',
    qualification: doc.qualification ?? '',
    experience: Number(doc.experience_years ?? 0),
    phone: doc.phone || '',
    email: doc.users?.email ?? '',
    opd: doc.opd || '',
    schedule: doc.schedule || '',
    bio: doc.bio || '',
    status: doc.availability_status ?? 'Offline',
    rating: Number(doc.rating ?? 0),
    delay: 0,
    education: [] as string[],
    publications: [] as string[],
  };
}

export type DoctorDto = ReturnType<typeof mapDoctorRow>;

export class DoctorService {
  async getAllDoctors() {
    const doctors = await prisma.doctors.findMany({
      include: {
        users: true,
        departments: true,
      },
    });
    return doctors.map(mapDoctorRow);
  }

  /**
   * Returns the set of medical specialties available across all registered
   * doctors, with a doctor count for each. Used by the patient-app
   * "Browse Doctors" specialty filter to render its chip row dynamically
   * (no hard-coded category list in the UI).
   *
   * The canonical source is the `departments.department_name` column —
   * which the hospital frontend already exposes as "Specialty" to
   * receptionists. We deliberately group on the joined department name
   * (not the free-text `doctors.specialization` column) so the list stays
   * consistent across the system. The free-text column remains available
   * for finer-grained sub-specialty searching in the future.
   */
  async getSpecialties() {
    const rows = await prisma.doctors.findMany({
      select: {
        departments: { select: { department_name: true } },
      },
    });

    const counts = new Map<string, number>();
    for (const r of rows) {
      const name = r.departments?.department_name?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createDoctor(data: any) {
    const { name, dept, qualification, experience, phone, email, opd, schedule, bio, status, password, focus, awards } = data;

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Default to the first hospital, or create one if none exist
    let hospital = await prisma.hospitals.findFirst();
    if (!hospital) {
      hospital = await prisma.hospitals.create({
        data: {
          hospital_name: "Main Hospital",
          registration_no: "REG-001",
          branch_name: "Main Branch",
          address: "123 Main St",
          phone: "1234567890",
          email: "contact@mainhospital.com",
          working_hours: "24/7"
        }
      });
    }

    // Default or create department based on the string 'dept'
    let department = await prisma.departments.findFirst({
      where: { department_name: dept, hospital_id: hospital.hospital_id }
    });

    if (!department) {
      department = await prisma.departments.create({
        data: {
          hospital_id: hospital.hospital_id,
          department_name: dept,
          location: "Main Building",
          daily_capacity: 50
        }
      });
    }

    // Use Supabase Admin to create the doctor directly to bypass email sending limits
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'Welcome123!', // Use provided password or default
      email_confirm: true,
      user_metadata: {
        role: 'DOCTOR',
        department: dept
      }
    });

    if (authError) {
      throw new Error(`Supabase create failed: ${authError.message || JSON.stringify(authError)}`);
    }

    // Use a transaction to create User and Doctor together
    const newDoctor = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          hospital_id: hospital.hospital_id,
          full_name: name,
          email: email,
          password_hash: "SUPABASE_AUTH_DELEGATED",
          role: "DOCTOR",
          status: "active"
        }
      });

      const doctor = await tx.doctors.create({
        data: {
          user_id: user.user_id,
          hospital_id: hospital.hospital_id,
          department_id: department.department_id,
          specialization: dept,
          qualification: qualification,
          experience_years: parseInt(experience) || 0,
          rating: 5.0, // Default rating for new doctors
          availability_status: status || "Offline",
          phone: phone,
          opd: opd,
          schedule: schedule,
          bio: bio,
          focus: focus,
          awards: awards
        },
        include: {
          users: true,
          departments: true
        }
      });

      return doctor;
    });

    const dto = mapDoctorRow(newDoctor);
    // Broadcast to every connected client (receptionist dashboards
    // appending to the doctor list, the patient app's Book Appointment
    // page surfacing the new doctor under their department, etc.). The
    // payload mirrors the REST response shape on purpose.
    safeEmit('doctor_created', dto);
    return dto;
  }

  async updateDoctorStatus(id: string, status: string) {
    const updatedDoctor = await prisma.doctors.update({
      where: { doctor_id: BigInt(id) },
      data: { availability_status: status },
      include: {
        users: true,
        departments: true
      }
    });

    const dto = mapDoctorRow(updatedDoctor);
    safeEmit('doctor_updated', dto);
    return dto;
  }

  async deleteDoctor(id: string) {
    let hospitalId: string | null = null;
    let departmentId: string | null = null;

    await prisma.$transaction(async (tx) => {
      const doc = await tx.doctors.findUnique({ where: { doctor_id: BigInt(id) } });
      if (doc) {
        hospitalId = String(doc.hospital_id);
        departmentId = String(doc.department_id);
        await tx.doctors.delete({ where: { doctor_id: BigInt(id) } });
        await tx.users.delete({ where: { user_id: doc.user_id } });
      }
    });

    // Emit AFTER the transaction commits — broadcasting a deletion the
    // DB later rolls back would leave clients with phantom removals.
    safeEmit('doctor_deleted', {
      id: String(id),
      hospitalId,
      departmentId,
    });

    return { success: true };
  }
  async getProfile(userId?: number) {
    let doctor;
    if (userId) {
      doctor = await prisma.doctors.findUnique({
        where: { user_id: BigInt(userId) },
        include: { users: true, departments: true },
      });
    }
    if (!doctor) {
      doctor = await prisma.doctors.findFirst({
        include: { users: true, departments: true },
      });
    }
    if (!doctor) throw new Error("No doctor found");

    return {
      id: String(doctor.doctor_id),
      name: doctor.users.full_name,
      credentials: doctor.credentials || doctor.qualification || "",
      department: doctor.departments.department_name,
      room: doctor.room || doctor.opd || "",
      focus: doctor.focus || doctor.specialization || "",
      bio: doctor.bio || "",
      awards: doctor.awards || ""
    };
  }

  async updateProfile(userId: number | undefined, data: any) {
    let doctor;
    if (userId) {
      doctor = await prisma.doctors.findUnique({ where: { user_id: BigInt(userId) } });
    }
    if (!doctor) {
      doctor = await prisma.doctors.findFirst();
    }
    if (!doctor) throw new Error("No doctor found");

    const updated = await prisma.doctors.update({
      where: { doctor_id: doctor.doctor_id },
      data: {
        credentials: data.credentials,
        room: data.room,
        focus: data.focus,
        bio: data.bio,
        awards: data.awards
      },
      include: { users: true, departments: true }
    });

    if (data.name) {
      await prisma.users.update({
        where: { user_id: updated.user_id },
        data: { full_name: data.name }
      });
    }

    if (data.department) {
       // Just returning for now, properly updating department requires looking up department ID
    }

    return this.getProfile(userId);
  }
}

export const doctorService = new DoctorService();
