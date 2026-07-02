import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { safeEmit } from '../sockets/emit.js';

/**
 * Build the rich socket payload sent on appointment_created/updated.
 * Centralised so every dashboard receives the same shape: the
 * admin KPI cards, the receptionist KPI strip, and the live activity
 * feed all read off this object.
 */
function buildAppointmentEventPayload(opts: {
  appointment: { appointment_id: bigint; doctor_id: bigint; patient_id: bigint; hospital_id: bigint; appointment_date: Date; appointment_status: string; appointment_type: string };
  patient: { patient_id: bigint; full_name: string };
  doctor: { doctor_id: bigint; full_name: string; department: string } | null;
  token?: { token_id: bigint; token_code: string; queue_position: number; token_status: string } | null;
}) {
  return {
    appointmentId: opts.appointment.appointment_id.toString(),
    patientId: opts.patient.patient_id.toString(),
    doctorId: opts.appointment.doctor_id.toString(),
    hospitalId: opts.appointment.hospital_id.toString(),
    appointmentDate: opts.appointment.appointment_date.toISOString(),
    appointmentStatus: opts.appointment.appointment_status,
    appointmentType: opts.appointment.appointment_type,
    patientName: opts.patient.full_name,
    doctorName: opts.doctor?.full_name ?? 'Assigned Doctor',
    department: opts.doctor?.department ?? 'General',
    tokenId: opts.token?.token_id.toString() ?? null,
    tokenCode: opts.token?.token_code ?? null,
    queuePosition: opts.token?.queue_position ?? null,
    tokenStatus: opts.token?.token_status ?? null,
    createdAt: new Date().toISOString(),
  };
}

export class PatientController {
  
  // ==========================
  // PATIENT APP ROUTES
  // ==========================
  
  // Get patient profile for the logged in user
  async getProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user; // from authMiddleware
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let patient = await prisma.patients.findFirst({
        where: { user_id: BigInt(user.userId) }
      });

      if (!patient) {
        // Auto-heal: Create a patient record if it doesn't exist for this user
        const userData = await prisma.users.findUnique({ where: { user_id: BigInt(user.userId) } });
        if (!userData) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        patient = await prisma.patients.create({
          data: {
            user_id: userData.user_id,
            hospital_id: userData.hospital_id,
            uhid: `UHID-${Date.now().toString().slice(-6)}`,
            full_name: userData.full_name,
            age: 0,
            gender: 'Not Specified',
            blood_group: 'Unknown',
            billing_status: 'Unpaid',
            patient_status: 'Active',
            email: userData.email,
          }
        });
      }

      res.status(200).json({ data: patient });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update patient profile
  async updateProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, phone, email, dob, abhaId } = req.body;

      let patient = await prisma.patients.findFirst({
        where: { user_id: BigInt(user.userId) }
      });

      if (!patient) {
        // Auto-heal: Create a patient record if it doesn't exist for this user
        const userData = await prisma.users.findUnique({ where: { user_id: BigInt(user.userId) } });
        if (!userData) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        patient = await prisma.patients.create({
          data: {
            user_id: userData.user_id,
            hospital_id: userData.hospital_id,
            uhid: `UHID-${Date.now().toString().slice(-6)}`,
            full_name: userData.full_name,
            age: 0,
            gender: 'Not Specified',
            blood_group: 'Unknown',
            billing_status: 'Unpaid',
            patient_status: 'Active',
            email: userData.email,
          }
        });
      }

      const updatedPatient = await prisma.patients.update({
        where: { patient_id: patient.patient_id },
        data: {
          full_name: name !== undefined ? name : patient.full_name,
          phone: phone !== undefined ? phone : patient.phone,
          email: email !== undefined ? email : patient.email,
          dob: dob !== undefined ? dob : patient.dob,
          abha_id: abhaId !== undefined ? abhaId : patient.abha_id,
        }
      });

      // Also update the full_name in users table to keep it in sync
      if (name !== undefined) {
        await prisma.users.update({
          where: { user_id: BigInt(user.userId) },
          data: { full_name: name }
        });
      }

      res.status(200).json({ data: updatedPatient, message: 'Profile updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // List all appointments belonging to the logged-in user (joined with doctor + department)
  // Shape mirrors what the patient app already consumes (formerly stored in localStorage).
  async getMyAppointments(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const patient = await prisma.patients.findFirst({
        where: { user_id: BigInt(user.userId) }
      });

      if (!patient) {
        // No patient row yet → no appointments. Treat as empty (first-time user).
        return res.status(200).json({ data: [] });
      }

      // Find all patient rows associated with this account (by email)
      const familyPatients = await prisma.patients.findMany({
        where: { email: patient.email }
      });
      const familyPatientIds = familyPatients.map(p => p.patient_id);

      const appointments = await prisma.appointments.findMany({
        where: { patient_id: { in: familyPatientIds } },
        include: {
          doctors: {
            include: {
              departments: true,
              users: true,
            }
          },
          patients: true
        },
        orderBy: { appointment_date: 'desc' }
      });

      const formatted = appointments.map((a: any) => {
        let patientName = a.patients?.full_name || patient.full_name;
        let bookingType: 'self' | 'other' = a.patient_id === patient.patient_id ? 'self' : 'other';
        let relationship = bookingType === 'self' ? 'Self' : 'Other';
        let personId = bookingType === 'self' ? 'self' : '';

        // Backwards compatibility for old records stored as "other: Name"
        if (typeof a.appointment_type === 'string' && a.appointment_type.startsWith('other:')) {
          bookingType = 'other';
          patientName = a.appointment_type.replace(/^other:\s*/, '').trim() || patientName;
          relationship = 'Other';
          personId = '';
        }

        const doctorName = a.doctors?.users?.full_name
          ? (a.doctors.users.full_name.startsWith('Dr.')
              ? a.doctors.users.full_name
              : `Dr. ${a.doctors.users.full_name}`)
          : 'Dr. Assigned';

        return {
          id: `APT-${a.appointment_id.toString()}`,
          appointment_id: a.appointment_id.toString(),
          doctorId: a.doctor_id.toString(),
          doctorName,
          department: a.doctors?.departments?.department_name || 'General',
          date: a.appointment_date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          time: a.appointment_date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          isoDate: a.appointment_date.toISOString(),
          status: a.appointment_status,
          bookingType,
          patientName,
          relationship,
          personId,
        };
      });

      res.status(200).json({ data: formatted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Cancel an appointment that belongs to the logged-in user.
  async cancelMyAppointment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const rawId = req.params.id as string;
      // Accept both "APT-123" and "123"
      const idDigits = rawId.replace(/^APT-/i, '');
      if (!/^\d+$/.test(idDigits)) {
        return res.status(400).json({ error: 'Invalid appointment id' });
      }

      const patient = await prisma.patients.findFirst({
        where: { user_id: BigInt(user.userId) }
      });
      if (!patient) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }

      const appt = await prisma.appointments.findFirst({
        where: { appointment_id: BigInt(idDigits), patient_id: patient.patient_id },
        include: {
          doctors: { include: { users: true, departments: true } },
        },
      });
      if (!appt) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Cancel both the appointment and its paired token in one
      // round-trip — keeps the dashboards consistent (an active
      // token for a cancelled appointment would be a UX bug).
      const [updated] = await prisma.$transaction([
        prisma.appointments.update({
          where: { appointment_id: appt.appointment_id },
          data: { appointment_status: 'Cancelled' },
        }),
        prisma.queue_tokens.updateMany({
          where: { appointment_id: appt.appointment_id },
          data: { token_status: 'Cancelled' },
        }),
      ]);

      const payload = buildAppointmentEventPayload({
        appointment: updated,
        patient: { patient_id: patient.patient_id, full_name: patient.full_name },
        doctor: appt.doctors
          ? {
              doctor_id: appt.doctors.doctor_id,
              full_name: appt.doctors.users?.full_name ?? 'Doctor',
              department: appt.doctors.departments?.department_name ?? 'General',
            }
          : null,
      });
      safeEmit('appointment_updated', payload);
      safeEmit('queue_updated', {
        hospitalId: payload.hospitalId,
        reason: 'token_cancelled',
        appointmentId: payload.appointmentId,
      });

      res.status(200).json({ data: { id: `APT-${updated.appointment_id.toString()}`, status: updated.appointment_status } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Book a new appointment.
  //
  // Creates an `appointments` row AND a paired `queue_tokens` row so
  // the receptionist's Active Tokens count, the admin's Total
  // Appointments KPI, and the live queue activity feed all get a
  // single source of truth to render from. Emits two socket events
  // so every connected dashboard refreshes in real time without
  // polling.
  async bookAppointment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { doctorId, bookingType, patientName } = req.body as {
        doctorId?: string | number;
        bookingType?: 'self' | 'other';
        patientName?: string;
      };

      const patient = await prisma.patients.findFirst({
        where: { user_id: BigInt(user.userId) }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }

      let targetPatient = patient;
      if (bookingType === 'other' && patientName) {
        // Strip any appended relationship tag like " (uncle)" for the hospital view
        const cleanName = patientName.replace(/\s*\([^)]*\)$/, '').trim();
        let dependent = await prisma.patients.findFirst({
          where: { email: patient.email, full_name: cleanName, user_id: null }
        });
        
        if (!dependent) {
          dependent = await prisma.patients.create({
            data: {
              hospital_id: patient.hospital_id,
              uhid: `UHID-${Date.now().toString().slice(-6)}`,
              full_name: cleanName,
              age: 0,
              gender: 'Not Specified',
              blood_group: 'Unknown',
              billing_status: 'Unpaid',
              patient_status: 'Active',
              email: patient.email,
              phone: patient.phone,
            }
          });
        }
        targetPatient = dependent;
      }

      // Default to tomorrow 10:30 AM. Once the booking UI lets the
      // user pick a slot, the body should carry an ISO date and this
      // becomes the fallback.
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 1);
      appointmentDate.setHours(10, 30, 0, 0);

      const apptType = bookingType === 'other' ? `other: ${patientName ?? 'Guest'}` : 'self';

      // Resolve the doctor. The booking UI passes a string id like
      // "5" or "DOC-5"; pull out the digits and verify the doctor
      // actually exists so we don't create a token with an orphan FK.
      let parsedDoctorId: bigint | null = null;
      if (doctorId !== undefined && doctorId !== null) {
        const numMatch = String(doctorId).match(/\d+/);
        if (numMatch) parsedDoctorId = BigInt(numMatch[0]);
      }
      const doctor = parsedDoctorId
        ? await prisma.doctors.findUnique({
            where: { doctor_id: parsedDoctorId },
            include: { users: true, departments: true },
          })
        : null;
      if (!doctor) {
        return res.status(400).json({ error: 'Selected doctor is not available' });
      }

      // Queue position = waiting/scheduled tokens already in front of
      // this patient with the same doctor. Cheap count; runs inside
      // the transaction so two bookings landing at once still get
      // monotonically increasing positions (worst case: brief
      // contention, never a duplicate position).
      const existingActive = await prisma.queue_tokens.count({
        where: {
          doctor_id: doctor.doctor_id,
          token_status: { in: ['Scheduled', 'Waiting'] },
        },
      });
      const queuePosition = existingActive + 1;

      const [newAppointment, newToken] = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointments.create({
          data: {
            patient_id: targetPatient.patient_id,
            doctor_id: doctor.doctor_id,
            hospital_id: targetPatient.hospital_id,
            appointment_date: appointmentDate,
            appointment_type: apptType,
            appointment_status: 'Upcoming',
          },
        });

        const tok = await tx.queue_tokens.create({
          data: {
            patient_id: targetPatient.patient_id,
            doctor_id: doctor.doctor_id,
            hospital_id: targetPatient.hospital_id,
            appointment_id: appt.appointment_id,
            token_code: `T${appt.appointment_id.toString()}`,
            token_type: 'OPD',
            queue_position: queuePosition,
            priority_score: 0,
            token_status: 'Scheduled',
            check_in_time: appointmentDate,
            estimated_wait_time: queuePosition * 10,
          },
        });

        return [appt, tok];
      });

      const eventPayload = buildAppointmentEventPayload({
        appointment: newAppointment,
        patient: { patient_id: targetPatient.patient_id, full_name: targetPatient.full_name },
        doctor: {
          doctor_id: doctor.doctor_id,
          full_name: doctor.users?.full_name ?? 'Doctor',
          department: doctor.departments?.department_name ?? 'General',
        },
        token: newToken,
      });

      // Broadcast: every dashboard listening for these events will
      // refresh. `safeEmit` swallows transport errors so a failed
      // emit never breaks the booking response to the patient.
      safeEmit('appointment_created', eventPayload);
      safeEmit('queue_updated', {
        hospitalId: eventPayload.hospitalId,
        reason: 'token_created',
        tokenId: eventPayload.tokenId,
      });

      res.status(201).json({
        data: { ...newAppointment, token: newToken },
        message: 'Appointment booked successfully'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================
  // ADMIN / RECEPTIONIST ROUTES
  // ==========================

  async getAllPatients(req: Request, res: Response) {
    try {
      const patientsList = await prisma.patients.findMany({
        include: {
          doctors: {
            include: {
              departments: true,
              users: true,
            }
          }
        },
        orderBy: { patient_id: 'desc' }
      });

      const formattedPatients = patientsList.map(p => ({
        id: p.uhid,
        name: p.full_name,
        age: p.age.toString(),
        gender: p.gender,
        blood: p.blood_group,
        dept: p.doctors?.departments?.department_name || 'General',
        doctor: p.doctors?.users?.full_name || 'Not Assigned',
        status: p.patient_status,
        condition: 'Stable', // Field not in DB, mocked for UI
        phone: p.phone || 'N/A',
        email: p.email || 'N/A',
        address: 'Not Provided',
        admitted: new Date().toISOString(), // Patients table lacks created_at
      }));

      res.status(200).json(formattedPatients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async registerPatient(req: Request, res: Response) {
    try {
      const { name, age, gender, blood, phone, email, dept, doctor, address, condition, status } = req.body;

      // Ensure hospital exists
      const hospital = await prisma.hospitals.findFirst();
      if (!hospital) {
        return res.status(400).json({ error: 'System lacks a hospital configuration.' });
      }

      // Find doctor by name or fallback to first doctor
      let doc = await prisma.doctors.findFirst({
        where: { users: { full_name: { contains: doctor, mode: 'insensitive' } } }
      });
      if (!doc) doc = await prisma.doctors.findFirst();
      if (!doc) {
        return res.status(400).json({ error: 'No doctors available in the system.' });
      }

      const newPatient = await prisma.patients.create({
        data: {
          hospital_id: hospital.hospital_id,
          primary_doctor_id: doc.doctor_id,
          uhid: `UHID-${Date.now().toString().slice(-6)}`,
          full_name: name,
          age: parseInt(age) || 0,
          gender: gender || 'Other',
          blood_group: blood || 'Unknown',
          billing_status: 'Unpaid',
          patient_status: status || 'OPD',
          phone: phone || null,
          email: email || null,
        }
      });

      res.status(201).json({ success: true, data: newPatient });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deletePatient(req: Request, res: Response) {
    try {
      // Find patient by UHID or ID
      const id = req.params.id as string;
      
      const patient = await prisma.patients.findFirst({
        where: {
          OR: [
            { uhid: id },
            { patient_id: !isNaN(Number(id)) ? BigInt(id) : -1n }
          ]
        }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      await prisma.patients.delete({
        where: { patient_id: patient.patient_id }
      });

      res.status(200).json({ success: true, message: 'Patient deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const patientController = new PatientController();
