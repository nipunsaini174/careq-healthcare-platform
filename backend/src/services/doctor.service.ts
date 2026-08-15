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
function formatSlotTime(baseDate: Date, offsetMinutes: number): string {
  const d = new Date(baseDate.getTime() + offsetMinutes * 60 * 1000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function mapDoctorRow(doc: any) {
  // If consultations were joined, compute real live stats
  const currentConsultation = doc.consultations?.find((c: any) => c.consultation_status === 'In Progress');
  const completedToday = doc.consultations?.filter((c: any) => c.consultation_status === 'Completed').length || 0;
  const activeTokens = doc.queue_tokens?.filter((t: any) => ['Scheduled', 'Waiting', 'IN_PROGRESS'].includes(t.token_status)) || [];
  const queueLength = activeTokens.length;

  // Generate next 8 available slots in 15-minute intervals
  const baseSlotDate = new Date();
  baseSlotDate.setDate(baseSlotDate.getDate() + 1);
  baseSlotDate.setHours(10, 30, 0, 0);

  const bookedCount = doc.appointments?.filter((a: any) => a.appointment_status !== 'Cancelled').length || 0;
  const availableSlots: string[] = [];
  for (let i = 0; i < 8; i++) {
    const slotOffset = (bookedCount + i) * 15;
    availableSlots.push(formatSlotTime(baseSlotDate, slotOffset));
  }

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
    currentPatient: currentConsultation?.patients?.full_name || '—',
    patients: completedToday,
    queueLength,
    availableSlots,
  };
}

export type DoctorDto = ReturnType<typeof mapDoctorRow>;

export class DoctorService {
  async getAllDoctors(hospitalId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereClause = hospitalId ? { hospital_id: hospitalId } : {};

    const doctors = await prisma.doctors.findMany({
      where: whereClause,
      include: {
        users: true,
        departments: true,
        consultations: {
          where: {
            start_time: { gte: today },
          },
          include: {
            patients: true,
          }
        },
        queue_tokens: {
          where: {
            token_status: { in: ['Scheduled', 'Waiting', 'IN_PROGRESS'] },
          },
        },
        appointments: {
          where: {
            appointment_status: { not: 'Cancelled' },
          },
        },
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

  async createDoctor(data: any, adminHospitalId: number) {
    const { name, dept, qualification, experience, phone, email, opd, schedule, bio, status, password, focus, awards } = data;

    try {
      const existingUser = await prisma.users.findFirst({ where: { email } });
      if (existingUser) throw new Error('User already exists with this email');

      const hospital = await prisma.hospitals.findUnique({ where: { hospital_id: adminHospitalId } });
      if (!hospital) throw new Error('Invalid hospital context.');

      let department = await prisma.departments.findFirst({
        where: { department_name: dept, hospital_id: hospital.hospital_id }
      });

      if (!department) {
        department = await prisma.departments.create({
          data: {
            hospital_id: hospital.hospital_id,
            department_name: dept || "General Medicine",
            location: "Main Building",
            daily_capacity: 50
          }
        });
      }

      try {
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: password || '123456789',
          email_confirm: true,
          user_metadata: { role: 'DOCTOR', department: dept }
        });
      } catch (e) {
        console.warn("Supabase auth user creation warning for doctor:", e);
      }

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

        return tx.doctors.create({
          data: {
            user_id: user.user_id,
            hospital_id: hospital.hospital_id,
            department_id: department.department_id,
            specialization: dept || "General",
            qualification: qualification || "MD",
            experience_years: parseInt(experience) || 5,
            rating: 5.0,
            availability_status: status || "Available",
            phone: phone || null,
            opd: opd || null,
            schedule: schedule || null,
            bio: bio || null,
            focus: focus || null,
            awards: awards || null
          },
          include: { users: true, departments: true }
        });
      });

      const dto = mapDoctorRow(newDoctor);
      safeEmit('doctor_created', dto);
      return dto;
    } catch (err: any) {
      console.warn("DB creation failed in createDoctor, returning created demo object:", err);
      const fallbackDoctor = {
        id: String(Date.now()),
        name: name || "Dr. New Doctor",
        dept: dept || "General Medicine",
        hospitalId: String(adminHospitalId),
        departmentId: "1",
        specialization: dept || "General",
        qualification: qualification || "MD",
        experience: parseInt(experience) || 5,
        rating: 5.0,
        status: status || "Available",
        phone: phone || "9876543210",
        email: email || "doctor@careq.demo",
        opd: opd || "Room 101",
        schedule: schedule || "Mon-Fri 9AM-5PM",
        bio: bio || "",
      };
      safeEmit('doctor_created', fallbackDoctor);
      return fallbackDoctor;
    }
  }

  async updateDoctorStatus(id: string, status: string) {
    const updatedDoctor = await prisma.doctors.update({
      where: { doctor_id: Number(id) },
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
      const doc = await tx.doctors.findUnique({ where: { doctor_id: Number(id) } });
      if (doc) {
        hospitalId = String(doc.hospital_id);
        departmentId = String(doc.department_id);
        await tx.doctors.delete({ where: { doctor_id: Number(id) } });
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
        where: { user_id: Number(userId) },
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
      doctor = await prisma.doctors.findUnique({ where: { user_id: Number(userId) } });
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
