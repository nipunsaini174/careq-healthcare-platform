import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { safeEmit } from '../sockets/emit.js';
import { resolveHospitalIdForUser } from '../utils/tenant.js';

/**
 * Build the rich socket payload sent on appointment_created/updated.
 * Centralised so every dashboard receives the same shape: the
 * admin KPI cards, the receptionist KPI strip, and the live activity
 * feed all read off this object.
 */
function buildAppointmentEventPayload(opts: {
  appointment: { appointment_id: number; doctor_id: number; patient_id: number; hospital_id: number; appointment_date: Date; appointment_status: string; appointment_type: string };
  patient: { patient_id: number; full_name: string };
  doctor: { doctor_id: number; full_name: string; department: string } | null;
  token?: { token_id: number; token_code: string; queue_position: number; token_status: string } | null;
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
  
  async getProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user; // from authMiddleware
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let patient = await prisma.patients.findFirst({
        where: { user_id: Number(user.userId) }
      });

      if (!patient) {
        // Auto-heal: Create a patient record if it doesn't exist for this user
        const userData = await prisma.users.findUnique({ where: { user_id: Number(user.userId) } });
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
        safeEmit('patient_created', {
          id: patient.uhid,
          name: patient.full_name,
          age: patient.age.toString(),
          gender: patient.gender,
          blood: patient.blood_group,
          dept: 'General',
          doctor: 'Not Assigned',
          status: patient.patient_status,
          condition: 'Stable',
          phone: patient.phone || 'N/A',
          email: patient.email || 'N/A',
          address: 'Not Provided',
          admitted: new Date().toISOString(),
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

      const body = req.body ?? {};
      // Accept both camelCase and snake_case from clients
      const name = body.name ?? body.full_name;
      const phone = body.phone;
      const email = body.email;
      const dob = body.dob;
      const abhaId = body.abhaId ?? body.abha_id;

      let patient = await prisma.patients.findFirst({
        where: { user_id: Number(user.userId) }
      });

      if (!patient) {
        const userData = await prisma.users.findUnique({ where: { user_id: Number(user.userId) } });
        if (!userData) {
          return res.status(404).json({ error: 'User not found' });
        }

        patient = await prisma.patients.create({
          data: {
            user_id: userData.user_id,
            hospital_id: userData.hospital_id,
            uhid: `UHID-${Date.now().toString().slice(-6)}`,
            full_name: name?.trim() || userData.full_name,
            age: 0,
            gender: 'Not Specified',
            blood_group: 'Unknown',
            billing_status: 'Unpaid',
            patient_status: 'Active',
            email: email ?? userData.email,
            phone: phone ?? userData.phone ?? null,
            dob: dob ?? null,
            abha_id: abhaId ?? null,
          }
        });
      } else {
        patient = await prisma.patients.update({
          where: { patient_id: patient.patient_id },
          data: {
            ...(name !== undefined ? { full_name: String(name).trim() } : {}),
            ...(phone !== undefined ? { phone: phone || null } : {}),
            ...(email !== undefined ? { email: email || null } : {}),
            ...(dob !== undefined ? { dob: dob || null } : {}),
            ...(abhaId !== undefined ? { abha_id: abhaId || null } : {}),
          }
        });
      }

      // Keep linked users row in sync
      await prisma.users.update({
        where: { user_id: Number(user.userId) },
        data: {
          ...(name !== undefined ? { full_name: String(name).trim() } : {}),
          ...(email !== undefined ? { email: email || undefined } : {}),
          ...(phone !== undefined ? { phone: phone || null } : {}),
        },
      });

      res.status(200).json({ data: patient, message: 'Profile updated successfully' });
    } catch (error: any) {
      console.error('[PATCH /patients/profile]', error?.message || error);
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
        where: { user_id: Number(user.userId) }
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

      const apptIds = appointments.map((a: any) => a.appointment_id);
      const pairedTokens = await prisma.queue_tokens.findMany({
        where: { appointment_id: { in: apptIds } }
      });

      const activeTokens = await prisma.queue_tokens.findMany({
        where: { token_status: { in: ['Scheduled', 'Waiting', 'IN_PROGRESS'] } },
        orderBy: { queue_position: 'asc' },
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
          
        const docTokens = activeTokens.filter(t => t.doctor_id === a.doctor_id);
        const myToken = docTokens.find(t => t.appointment_id === a.appointment_id);
        const pairedTok = pairedTokens.find(t => t.appointment_id === a.appointment_id);
        const tokenCode = myToken?.token_code || pairedTok?.token_code || `T${a.appointment_id.toString()}`;

        // Include all active tokens for this doctor (now, same time, and later)
        let allTokenCodes = docTokens.map(t => t.token_code);
        if (tokenCode && !allTokenCodes.includes(tokenCode)) {
          allTokenCodes.push(tokenCode);
        }

        const myTokenIndex = allTokenCodes.indexOf(tokenCode);
        const queuePosition = myTokenIndex !== -1 ? myTokenIndex + 1 : (myToken?.queue_position || 1);
        const estimatedWaitTime = (queuePosition - 1) * 15;
        const liveQueueTokens = allTokenCodes;

        const normApptStatus = (a.appointment_status || '').trim().toLowerCase();
        const normTokStatus = (pairedTok?.token_status || '').trim().toLowerCase();
        const isCancelled = ['cancelled', 'canceled'].includes(normApptStatus) || ['cancelled', 'canceled'].includes(normTokStatus);
        const isCompleted = ['completed', 'checkedout', 'checked_out', 'done'].includes(normApptStatus) || 
          ['completed', 'checkedout', 'checked_out', 'done'].includes(normTokStatus);
        let effectiveStatus = a.appointment_status;
        if (isCancelled) effectiveStatus = 'Cancelled';
        else if (isCompleted) effectiveStatus = 'Completed';
        else if (['upcoming', 'confirmed', 'scheduled', 'waiting', 'in progress', 'in_progress', 'active'].includes(normApptStatus)) {
          effectiveStatus = 'Upcoming';
        }

        // Proactively sync appointment_status if token is completed
        if (isCompleted && a.appointment_status !== 'Completed') {
          prisma.appointments.update({
            where: { appointment_id: a.appointment_id },
            data: { appointment_status: 'Completed' }
          }).catch(() => {});
        }


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
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          appointment_date: a.appointment_date.toISOString(),
          isoDate: a.appointment_date.toISOString(),
          status: effectiveStatus,
          bookingType,
          patientName,
          relationship,
          personId,
          queuePosition,
          estimatedWaitTime,
          tokenCode,
          token: {
            tokenId: `T${a.appointment_id.toString()}`,
            tokenCode,
            queuePosition,
            queue_position: queuePosition,
            estimatedWaitTime,
            estimated_wait_time: estimatedWaitTime,
          },
          liveQueueTokens: liveQueueTokens.length > 0 ? liveQueueTokens : [tokenCode],
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
        where: { user_id: Number(user.userId) }
      });
      if (!patient) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }

      const appt = await prisma.appointments.findFirst({
        where: { appointment_id: Number(idDigits), patient_id: patient.patient_id },
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

      const eventPayload = buildAppointmentEventPayload({
        appointment: updated,
        patient: { patient_id: patient.patient_id, full_name: patient.full_name },
        doctor: {
          doctor_id: appt.doctor_id,
          full_name: appt.doctors?.users?.full_name ?? 'Doctor',
          department: appt.doctors?.departments?.department_name ?? 'General',
        },
      });
      safeEmit('appointment_updated', eventPayload);
      safeEmit('queue_updated', {
        hospitalId: eventPayload.hospitalId,
        reason: 'token_cancelled',
        appointmentId: eventPayload.appointmentId,
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
        where: { user_id: Number(user.userId) }
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
          safeEmit('patient_created', {
            id: dependent.uhid,
            name: dependent.full_name,
            age: dependent.age.toString(),
            gender: dependent.gender,
            blood: dependent.blood_group,
            dept: 'General',
            doctor: 'Not Assigned',
            status: dependent.patient_status,
            condition: 'Stable',
            phone: dependent.phone || 'N/A',
            email: dependent.email || 'N/A',
            address: 'Not Provided',
            admitted: new Date().toISOString(),
          });
        }
        targetPatient = dependent;
      }

      const apptType = bookingType === 'other' ? `other: ${patientName ?? 'Guest'}` : 'self';

      // Resolve the doctor. The booking UI passes a string id like
      // "5" or "DOC-5"; pull out the digits and verify the doctor
      // actually exists so we don't create a token with an orphan FK.
      let parsedDoctorId: number | null = null;
      if (doctorId !== undefined && doctorId !== null) {
        const numMatch = String(doctorId).match(/\d+/);
        if (numMatch) parsedDoctorId = Number(numMatch[0]);
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

      // Dynamic slot allocation:
      // Base start time: tomorrow at 10:30 AM
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      baseDate.setHours(10, 30, 0, 0);

      // Check how many appointments already exist for this doctor on that date
      const startOfDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1, 0, 0, 0);

      const existingAppointmentsCount = await prisma.appointments.count({
        where: {
          doctor_id: doctor.doctor_id,
          appointment_status: { not: 'Cancelled' },
          appointment_date: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });

      // Shift appointment slot by 15 minutes for each existing patient
      const slotOffsetMinutes = existingAppointmentsCount * 15;
      const appointmentDate = new Date(baseDate.getTime() + slotOffsetMinutes * 60 * 1000);

      // Queue position = waiting/scheduled tokens already in front of this patient
      const existingActive = await prisma.queue_tokens.count({
        where: {
          doctor_id: doctor.doctor_id,
          token_status: { in: ['Scheduled', 'Waiting', 'IN_PROGRESS'] },
        },
      });
      const queuePosition = existingActive + 1;
      const waitTime = existingActive * 15; // 0 mins for first patient, +15m for subsequent patients

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
            estimated_wait_time: waitTime,
          },
        });

        return [appt, tok];
      });

      const tokenCode = `T${newAppointment.appointment_id.toString()}`;
      const timeFormatted = appointmentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const dateFormatted = appointmentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
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

      const responseData = {
        id: `APT-${newAppointment.appointment_id.toString()}`,
        appointment_id: newAppointment.appointment_id.toString(),
        patient_id: targetPatient.patient_id.toString(),
        doctor_id: doctor.doctor_id.toString(),
        hospital_id: targetPatient.hospital_id.toString(),
        appointment_date: appointmentDate.toISOString(),
        appointment_status: newAppointment.appointment_status,
        appointment_type: newAppointment.appointment_type,
        date: dateFormatted,
        time: timeFormatted,
        isoDate: appointmentDate.toISOString(),
        queuePosition: queuePosition,
        estimatedWaitTime: waitTime,
        tokenCode: tokenCode,
        token: {
          tokenId: `T${newAppointment.appointment_id.toString()}`,
          token_id: newToken.token_id.toString(),
          token_code: tokenCode,
          tokenCode: tokenCode,
          queue_position: queuePosition,
          queuePosition: queuePosition,
          priority_score: newToken.priority_score,
          token_status: newToken.token_status,
          estimated_wait_time: waitTime,
          estimatedWaitTime: waitTime,
        },
      };

      res.status(201).json({
        data: responseData,
        message: 'Appointment booked successfully'
      });
    } catch (error: any) {
      console.error('[POST /patients/appointments]', error?.message || error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================
  // ADMIN / RECEPTIONIST ROUTES
  // ==========================

  async getAllPatients(req: Request, res: Response) {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const patientsList = await prisma.patients.findMany({
        where: { hospital_id: hospitalId },
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
      const hospitalId = await resolveHospitalIdForUser(req);
      const { name, age, gender, blood, phone, email, dept, doctor, address, condition, status } = req.body;

      // Find doctor by name or fallback to first doctor in the hospital
      let doc = doctor
        ? await prisma.doctors.findFirst({
            where: { hospital_id: hospitalId, users: { full_name: { contains: doctor } } },
            include: { users: true, departments: true }
          })
        : null;
      if (!doc) {
        doc = await prisma.doctors.findFirst({
          where: { hospital_id: hospitalId },
          include: { users: true, departments: true }
        });
      }
      if (!doc) {
        return res.status(400).json({ error: 'No doctors available in the system.' });
      }

      const newPatient = await prisma.patients.create({
        data: {
          hospital_id: hospitalId,
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
      safeEmit('patient_created', {
        id: newPatient.uhid,
        name: newPatient.full_name,
        age: newPatient.age.toString(),
        gender: newPatient.gender,
        blood: newPatient.blood_group,
        dept: doc?.departments?.department_name || 'General',
        doctor: doc?.users?.full_name || 'Not Assigned',
        status: newPatient.patient_status,
        condition: 'Stable',
        phone: newPatient.phone || 'N/A',
        email: newPatient.email || 'N/A',
        address: 'Not Provided',
        admitted: new Date().toISOString(),
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
            { patient_id: !isNaN(Number(id)) ? Number(id) : -1 }
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

  completePatientConsultation = async (req: Request, res: Response) => {
    try {
      const rawId = String(req.params.id || '').trim();
      const cleanNumeric = rawId.replace(/^(APT-|T-|T|PT-|P-)/i, '');
      const numId = Number(cleanNumeric);

      console.log(`[completePatientConsultation] rawId=${rawId}, cleanNumeric=${cleanNumeric}`);

      let token = null;
      let targetAppointmentId: number | null = null;

      // 1. Try finding by token_id
      if (!isNaN(numId) && numId > 0) {
        token = await prisma.queue_tokens.findUnique({
          where: { token_id: numId }
        });
      }

      // 2. Try finding by appointment_id in queue_tokens
      if (!token && !isNaN(numId) && numId > 0) {
        token = await prisma.queue_tokens.findFirst({
          where: { appointment_id: numId }
        });
      }

      // 3. Try finding by token_code
      if (!token && rawId) {
        token = await prisma.queue_tokens.findFirst({
          where: { token_code: rawId }
        });
      }

      if (token) {
        targetAppointmentId = token.appointment_id;
      }

      // 4. Try finding appointment directly
      if (!targetAppointmentId && !isNaN(numId) && numId > 0) {
        const appt = await prisma.appointments.findUnique({
          where: { appointment_id: numId }
        });
        if (appt) {
          targetAppointmentId = appt.appointment_id;
        }
      }

      // 5. Try finding active appointment for patient_id
      if (!targetAppointmentId && !isNaN(numId) && numId > 0) {
        const appt = await prisma.appointments.findFirst({
          where: {
            patient_id: numId,
            appointment_status: { in: ['Upcoming', 'Confirmed', 'CONFIRMED', 'Scheduled', 'In Progress', 'Waiting', 'Active'] }
          },
          orderBy: { appointment_id: 'desc' }
        });
        if (appt) {
          targetAppointmentId = appt.appointment_id;
        }
      }

      // Mark appointment completed
      if (targetAppointmentId) {
        await prisma.appointments.update({
          where: { appointment_id: targetAppointmentId },
          data: { appointment_status: 'Completed' }
        }).catch(() => {});
      } else if (!isNaN(numId) && numId > 0) {
        await prisma.appointments.updateMany({
          where: {
            patient_id: numId,
            appointment_status: { in: ['Upcoming', 'Confirmed', 'CONFIRMED', 'Scheduled', 'In Progress', 'Waiting', 'Active'] }
          },
          data: { appointment_status: 'Completed' }
        }).catch(() => {});
      }

      // Mark queue token completed
      if (token) {
        await prisma.queue_tokens.update({
          where: { token_id: token.token_id },
          data: { token_status: 'COMPLETED' }
        }).catch(() => {});
      } else if (targetAppointmentId) {
        await prisma.queue_tokens.updateMany({
          where: { appointment_id: targetAppointmentId },
          data: { token_status: 'COMPLETED' }
        }).catch(() => {});
      }

      safeEmit('consultation_completed', {
        tokenId: String(token?.token_id || rawId),
        appointmentId: targetAppointmentId ? String(targetAppointmentId) : undefined
      });
      safeEmit('appointment_updated', {
        appointmentId: targetAppointmentId ? String(targetAppointmentId) : undefined,
        status: 'Completed'
      });
      safeEmit('queue_updated', {
        hospitalId: String(token?.hospital_id || 1),
        doctorId: token?.doctor_id?.toString(),
        reason: 'consultation_completed'
      });

      res.status(200).json({ success: true, message: 'Consultation completed successfully' });
    } catch (error: any) {
      console.error('[completePatientConsultation error]', error);
      res.status(500).json({ error: error.message });
    }
  };
}

export const patientController = new PatientController();
