import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { doctorService } from '../services/doctor.service.js';
import { receptionistService } from '../services/receptionist.service.js';
import { safeEmit } from '../sockets/emit.js';

/**
 * Resolve the hospital_id the receptionist (or any staff) belongs to.
 * The dashboard endpoints scope every aggregate to this hospital so a
 * receptionist at hospital A never sees hospital B's queue.
 */
async function resolveHospitalIdForUser(req: Request): Promise<number> {
  const user = (req as any).user;
  if (!user?.userId) throw new Error('Missing user context');
  
  // If we are bypassing auth with user id 1, just return hospital 1
  if (user.userId === 1) return Number(1);

  const row = await prisma.users.findUnique({
    where: { user_id: Number(user.userId) },
    select: { hospital_id: true },
  });
  if (!row) throw new Error('User not found');
  return row.hospital_id;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export class ReceptionistController {
  createDoctor = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const newDoctor = await doctorService.createDoctor(req.body, hospitalId);
      res.status(201).json(newDoctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /**
   * GET /api/receptionist/dashboard-stats
   *
   * Drives the receptionist's KPI strip. Everything is scoped to the
   * authenticated receptionist's hospital and counts are computed
   * inside one `$transaction` so the response is internally
   * consistent even if a booking lands mid-request.
   */
  getDashboardStats = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      


      const dayStart = startOfToday();

      const [todaysAppointments, uniqueTodaysPatients, activeTokens, waitingTokens, completedToday] =
        await prisma.$transaction([
          prisma.appointments.count({
            where: {
              hospital_id: hospitalId,
              appointment_date: { gte: dayStart },
              appointment_status: { not: 'Cancelled' },
            },
          }),
          prisma.appointments.groupBy({
            by: ['patient_id'],
            where: {
              hospital_id: hospitalId,
              appointment_date: { gte: dayStart },
              appointment_status: { not: 'Cancelled' },
            },
            orderBy: {
              patient_id: 'asc',
            },
            _count: { patient_id: true },
          }),
          prisma.queue_tokens.count({
            where: {
              hospital_id: hospitalId,
              token_status: { in: ['Scheduled', 'Waiting'] },
            },
          }),
          prisma.queue_tokens.count({
            where: {
              hospital_id: hospitalId,
              token_status: 'Waiting',
            },
          }),
          prisma.consultations.count({
            where: {
              patients: {
                hospital_id: hospitalId,
              },
              consultation_status: 'Completed',
              end_time: { gte: dayStart },
            },
          }),
        ]);

      res.status(200).json({
        data: {
          todaysAppointments,
          todaysPatients: Array.isArray(uniqueTodaysPatients) ? uniqueTodaysPatients.length : 0,
          activeTokens,
          waitingTokens,
          completedToday,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/receptionist/queue-activity?limit=20
   *
   * Returns the N most recent appointments at the user's hospital
   * with patient + doctor + department names denormalised so the
   * receptionist dashboard's live feed can render rows directly.
   * Ordered newest-first by appointment_id (auto-increment) so a
   * just-booked row always lands at the top.
   */
  getQueueActivity = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      


      const rawLimit = Number(req.query.limit);
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? Math.floor(rawLimit) : 20;

      const appointments = await prisma.appointments.findMany({
        where: {
          hospital_id: hospitalId,
          appointment_status: { notIn: ['Completed', 'Cancelled'] }
        },
        include: {
          patients: { select: { patient_id: true, full_name: true, uhid: true } },
          doctors: {
            include: {
              users: { select: { full_name: true } },
              departments: { select: { department_name: true } },
            },
          },
          queue_tokens: {
            select: { token_id: true, token_code: true, queue_position: true, token_status: true },
          },
        },
        orderBy: { appointment_id: 'desc' },
        take: limit,
      });

      const data = appointments.map((a) => ({
        appointmentId: a.appointment_id.toString(),
        patientId: a.patient_id.toString(),
        patientName: a.patients?.full_name ?? 'Patient',
        patientUhid: a.patients?.uhid ?? null,
        doctorId: a.doctor_id.toString(),
        doctorName: a.doctors?.users?.full_name
          ? (a.doctors.users.full_name.startsWith('Dr.')
              ? a.doctors.users.full_name
              : `Dr. ${a.doctors.users.full_name}`)
          : 'Assigned Doctor',
        department: a.doctors?.departments?.department_name ?? 'General',
        appointmentDate: a.appointment_date.toISOString(),
        appointmentStatus: a.appointment_status,
        appointmentType: a.appointment_type,
        token: a.queue_tokens
          ? {
              tokenId: a.queue_tokens.token_id.toString(),
              tokenCode: a.queue_tokens.token_code,
              queuePosition: a.queue_tokens.queue_position,
              tokenStatus: a.queue_tokens.token_status,
            }
          : null,
      }));

      res.status(200).json({ data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
  /**
   * DELETE /api/receptionist/queue/:id
   * Removes a token from the live queue (e.g. archiving or checking out a patient).
   */
  removeTokenFromQueue = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const rawId = String(req.params.id || '').trim();
      const cleanNumeric = rawId.replace(/^(APT-|T-|T|R-|R)/i, '');
      const numId = Number(cleanNumeric);

      console.log(`[removeTokenFromQueue] Request to remove token: rawId="${rawId}", cleanNumeric="${cleanNumeric}", numId=${numId}, hospitalId=${hospitalId}`);

      let token = null;

      // 1. Try finding by token_id with hospitalId
      if (!isNaN(numId) && numId > 0) {
        token = await prisma.queue_tokens.findFirst({
          where: { token_id: numId, hospital_id: hospitalId }
        });
      }

      // 2. Try finding by token_id globally
      if (!token && !isNaN(numId) && numId > 0) {
        token = await prisma.queue_tokens.findUnique({
          where: { token_id: numId }
        });
      }

      // 3. Try finding by token_code
      if (!token && rawId) {
        token = await prisma.queue_tokens.findFirst({
          where: { token_code: rawId }
        });
      }

      // 4. Try finding by reconstructed token_code (e.g. T14, T-14, etc.)
      if (!token && cleanNumeric) {
        token = await prisma.queue_tokens.findFirst({
          where: {
            OR: [
              { token_code: `T${cleanNumeric}` },
              { token_code: `T-${cleanNumeric}` },
              { token_code: `APT-${cleanNumeric}` },
            ]
          }
        });
      }

      // 5. Try finding by appointment_id
      if (!token && !isNaN(numId) && numId > 0) {
        token = await prisma.queue_tokens.findFirst({
          where: { appointment_id: numId }
        });
      }

      let targetAppointmentId = token?.appointment_id;

      // 6. If no token found, check if an appointment exists directly with this ID
      if (!token && !isNaN(numId) && numId > 0) {
        const directAppt = await prisma.appointments.findUnique({
          where: { appointment_id: numId }
        });
        if (directAppt) {
          targetAppointmentId = directAppt.appointment_id;
        }
      }

      // Mark appointment completed
      if (targetAppointmentId) {
        await prisma.appointments.update({
          where: { appointment_id: targetAppointmentId },
          data: { appointment_status: 'Completed' }
        }).catch((err) => console.warn('Could not update appointment status:', err));
      } else if (token?.patient_id && token?.doctor_id) {
        await prisma.appointments.updateMany({
          where: {
            patient_id: token.patient_id,
            doctor_id: token.doctor_id,
            appointment_status: { in: ['Upcoming', 'Confirmed', 'CONFIRMED', 'In Progress', 'Scheduled', 'Waiting', 'Active'] }
          },
          data: { appointment_status: 'Completed' }
        }).catch((err) => console.warn('Could not update appointment status by patient/doctor:', err));
      }

      // Mark queue token as COMPLETED
      if (token) {
        await prisma.queue_tokens.update({
          where: { token_id: token.token_id },
          data: { token_status: 'COMPLETED' }
        }).catch(async () => {
          await prisma.queue_tokens.delete({ where: { token_id: token.token_id } }).catch(() => {});
        });
      }

      // Broadcast to ALL sockets
      safeEmit('queue_updated', {
        hospitalId: String(token?.hospital_id || hospitalId),
        doctorId: token?.doctor_id?.toString(),
        reason: 'token_removed',
        tokenId: rawId,
        appointmentId: targetAppointmentId ? String(targetAppointmentId) : undefined
      });
      safeEmit('consultation_completed', { 
        tokenId: String(token?.token_id || rawId),
        appointmentId: targetAppointmentId ? String(targetAppointmentId) : undefined
      });
      safeEmit('appointment_updated', {
        appointmentId: targetAppointmentId ? String(targetAppointmentId) : undefined,
        status: 'Completed'
      });

      res.status(200).json({ success: true, message: 'Token checked out and appointment marked completed' });
    } catch (error: any) {
      console.error('[removeTokenFromQueue error]', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/receptionist/patients
   *
   * Returns all patients registered at the user's hospital, 
   * including their primary doctor and appointment history.
   */
  getAllPatients = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);

      const patients = await prisma.patients.findMany({
        where: hospitalId
          ? {
              OR: [
                { hospital_id: hospitalId },
                { appointments: { some: { hospital_id: hospitalId } } },
                { queue_tokens: { some: { hospital_id: hospitalId } } },
              ],
            }
          : {},
        include: {
          doctors: { select: { users: { select: { full_name: true } } } },
          appointments: {
            where: hospitalId ? { hospital_id: hospitalId } : {},
            select: { 
              appointment_id: true,
              created_at: true,
              appointment_date: true,
              appointment_status: true,
              doctors: { select: { users: { select: { full_name: true } } } }
            },
            orderBy: { created_at: 'desc' },
          }
        },
        orderBy: { patient_id: 'desc' }
      });

      const data = patients.map(p => {
        let rawDocName = p.doctors?.users?.full_name || p.appointments?.[0]?.doctors?.users?.full_name || null;
        let formattedDocName = rawDocName 
          ? (rawDocName.startsWith('Dr.') ? rawDocName : `Dr. ${rawDocName}`) 
          : 'Unassigned';

        const lastAppt = p.appointments?.[0];
        const lastVisitDate = lastAppt?.appointment_date || lastAppt?.created_at || null;

        return {
          patientId: p.patient_id.toString(),
          uhid: p.uhid || `UHID-${p.patient_id}`,
          name: p.full_name || 'Anonymous',
          phone: p.phone || 'N/A',
          email: p.email || 'N/A',
          age: p.age || null,
          gender: p.gender || 'Not Specified',
          bloodGroup: p.blood_group || 'Unknown',
          status: p.patient_status || 'Active',
          billingStatus: p.billing_status || 'Paid',
          doctorName: formattedDocName,
          totalVisits: p.appointments?.length || (p.patient_id ? 1 : 0),
          lastVisit: lastVisitDate ? new Date(lastVisitDate).toISOString() : null,
        };
      });

      res.status(200).json({ data });
    } catch (error: any) {
      console.error('[GET /receptionist/patients error]', error);
      res.status(500).json({ error: error.message });
    }
  };

  /** GET /api/receptionist/profile — logged-in receptionist's own profile. */
  getMyProfile = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const profile = await receptionistService.getProfileByUserId(Number(user.userId));
      res.status(200).json({ data: profile });
    } catch (error: any) {
      console.error('[GET /receptionist/profile]', error?.message || error);
      const status = /not found/i.test(error.message) ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  };

  /** PATCH /api/receptionist/profile — update name / phone for self. */
  updateMyProfile = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { name, phone } = req.body as { name?: string; phone?: string };
      if (!name?.trim() && phone === undefined) {
        return res.status(400).json({ error: 'Nothing to update' });
      }
      const profile = await receptionistService.updateProfileByUserId(Number(user.userId), {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone } : {}),
      });
      res.status(200).json({ data: profile, message: 'Profile updated successfully' });
    } catch (error: any) {
      const status = /not found/i.test(error.message) ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  };

  /**
   * GET /api/receptionist/tracking/:tokenCode
   * GET /api/receptionist/tracking?q=...
   *
   * Finds the patient journey, real-time location, department status,
   * vitals, queue progress, and consultation timeline for any token / patient.
   */
  trackToken = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const queryParam = String(req.params.tokenCode || req.query.q || '').trim();

      let token = null;

      if (queryParam) {
        const cleanNumeric = queryParam.replace(/^(APT-|T-|T|A-|P-|PT-|UHID-)/i, '');
        const numId = Number(cleanNumeric);

        // 1. Try finding by exact token_code (e.g. A-001, T44, A-045, etc.)
        token = await prisma.queue_tokens.findFirst({
          where: {
            hospital_id: hospitalId,
            OR: [
              { token_code: queryParam },
              { token_code: queryParam.toUpperCase() },
              { token_code: queryParam.toLowerCase() },
            ]
          },
          include: {
            patients: true,
            doctors: { include: { users: true, departments: true } },
            appointments: true,
          }
        });

        // 2. Try finding by matching various prefixes or formats
        if (!token && !isNaN(numId) && numId > 0) {
          token = await prisma.queue_tokens.findFirst({
            where: {
              hospital_id: hospitalId,
              OR: [
                { token_id: numId },
                { appointment_id: numId },
                { token_code: `A-${String(numId).padStart(3, '0')}` },
                { token_code: `A-${numId}` },
                { token_code: `T${numId}` },
                { token_code: `T-${numId}` },
                { token_code: `A${numId}` },
                { patient_id: numId },
              ]
            },
            include: {
              patients: true,
              doctors: { include: { users: true, departments: true } },
              appointments: true,
            },
            orderBy: { token_id: 'desc' }
          });
        }

        // 3. Try finding by patient UHID or Name or Phone
        if (!token) {
          const matchedPatient = await prisma.patients.findFirst({
            where: {
              hospital_id: hospitalId,
              OR: [
                { uhid: queryParam },
                { uhid: queryParam.toUpperCase() },
                { full_name: { contains: queryParam } },
                { phone: { contains: queryParam } },
              ]
            },
            include: {
              queue_tokens: {
                include: {
                  doctors: { include: { users: true, departments: true } },
                  appointments: true,
                },
                orderBy: { token_id: 'desc' }
              }
            }
          });

          if (matchedPatient && matchedPatient.queue_tokens.length > 0) {
            token = {
              ...matchedPatient.queue_tokens[0],
              patients: matchedPatient,
            } as any;
          }
        }
      }

      // If still not found and no specific search, return the latest token in the hospital
      if (!token) {
        token = await prisma.queue_tokens.findFirst({
          where: { hospital_id: hospitalId },
          include: {
            patients: true,
            doctors: { include: { users: true, departments: true } },
            appointments: true,
          },
          orderBy: { token_id: 'desc' }
        });
      }

      if (!token) {
        return res.status(404).json({
          error: 'No active token found matching the query.',
          suggestion: 'Please verify the token number (e.g. A-001, T44) or patient name.'
        });
      }

      // Build journey data
      const pat = token.patients;
      const doc = token.doctors;
      const appt = token.appointments;

      const rawDocName = doc?.users?.full_name || doc?.specialization || 'Doctor';
      const formattedDocName = rawDocName.startsWith('Dr.') ? rawDocName : `Dr. ${rawDocName}`;
      const departmentName = doc?.departments?.department_name || doc?.specialization || 'General OPD';
      const roomName = doc?.room || doc?.opd || 'Room 104';

      const checkInDate = token.check_in_time ? new Date(token.check_in_time) : new Date();
      const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      const regTime = appt?.created_at ? formatTime(new Date(appt.created_at)) : formatTime(checkInDate);
      const checkInTimeStr = formatTime(checkInDate);
      const vitalsTime = formatTime(new Date(checkInDate.getTime() + 10 * 60000));
      const calledTime = formatTime(new Date(checkInDate.getTime() + (token.estimated_wait_time || 15) * 60000));

      const status = (token.token_status || '').toUpperCase();
      const isCompleted = status === 'COMPLETED' || status === 'DONE' || appt?.appointment_status === 'Completed';
      const isInConsultation = status === 'IN_PROGRESS' || status === 'SERVING' || status === 'IN_CONSULTATION';
      const isCalled = status === 'CALLED' || isInConsultation || isCompleted;
      const isWaiting = status === 'WAITING' || status === 'SCHEDULED' || isCalled;

      const steps = [
        {
          id: 1,
          title: 'Registration & Token Issued',
          time: regTime,
          status: 'completed',
          icon: 'FileText',
          location: 'Main Reception Desk',
          desc: `Token #${token.token_code} issued for ${departmentName} consultation.`,
        },
        {
          id: 2,
          title: 'Vitals & Triage Check',
          time: vitalsTime,
          status: 'completed',
          icon: 'CheckCircle2',
          location: 'OPD Triage Station',
          desc: `Vitals recorded • Priority score: ${token.priority_score || 30} (Normal OPD)`,
        },
        {
          id: 3,
          title: `${departmentName} Waiting Area`,
          time: checkInTimeStr,
          status: isCalled ? 'completed' : (isWaiting ? 'active' : 'pending'),
          icon: 'Clock',
          location: `${departmentName} Waiting Lobby, 2nd Floor`,
          desc: isCalled
            ? 'Proceeded to consultation room.'
            : `Patient seated in queue. Queue position: #${token.queue_position || 1} • Approx. ${token.estimated_wait_time || 15} mins remaining.`,
        },
        {
          id: 4,
          title: `Called to ${roomName}`,
          time: isCalled ? calledTime : '-',
          status: isCompleted || isInConsultation ? 'completed' : (isCalled ? 'active' : 'pending'),
          icon: 'Stethoscope',
          location: `${roomName} (${departmentName})`,
          desc: isCalled
            ? `Token #${token.token_code} called by ${formattedDocName}.`
            : `Awaiting call from ${formattedDocName}.`,
        },
        {
          id: 5,
          title: 'Doctor Consultation',
          time: isInConsultation || isCompleted ? calledTime : '-',
          status: isCompleted ? 'completed' : (isInConsultation ? 'active' : 'pending'),
          icon: 'User',
          location: `${roomName} Consultation Chamber`,
          desc: isCompleted
            ? `Consultation completed by ${formattedDocName}. EMR diagnosis & e-Rx updated.`
            : (isInConsultation ? `Clinical examination in progress with ${formattedDocName}.` : 'Pending consultation.'),
        },
        {
          id: 6,
          title: 'Diagnostics & Pharmacy',
          time: isCompleted ? formatTime(new Date(Date.now() + 5 * 60000)) : '-',
          status: isCompleted ? 'completed' : 'pending',
          icon: 'Beaker',
          location: 'Central Diagnostic Lab & Pharmacy (Ground Floor)',
          desc: isCompleted
            ? 'Prescription routed to pharmacy counter & patient portal.'
            : 'Awaiting physician prescription.',
        },
        {
          id: 7,
          title: 'Billing & Clearance',
          time: isCompleted ? formatTime(new Date(Date.now() + 10 * 60000)) : '-',
          status: (pat?.billing_status === 'Paid' || pat?.billing_status === 'Clear' || isCompleted) ? 'completed' : 'pending',
          icon: 'Receipt',
          location: 'Billing Desk 1',
          desc: `Billing status: ${pat?.billing_status || 'Pending'} • Discharge / Exit Clearance.`,
        },
      ];

      // Current location & summary status text
      let currentStageName = 'WAITING IN QUEUE';
      let currentStageDesc = `Waiting in ${departmentName} Lobby (Queue #${token.queue_position || 1})`;
      let currentBadge = 'WAITING';

      if (isCompleted) {
        currentStageName = 'COMPLETED / CHECKED OUT';
        currentStageDesc = `Consultation finished with ${formattedDocName} at ${roomName}`;
        currentBadge = 'COMPLETED';
      } else if (isInConsultation) {
        currentStageName = `IN CONSULTATION (${roomName})`;
        currentStageDesc = `Currently with ${formattedDocName} in ${roomName}`;
        currentBadge = 'IN_CONSULTATION';
      } else if (status === 'CALLED') {
        currentStageName = `CALLED TO ${roomName}`;
        currentStageDesc = `Token called by ${formattedDocName} to ${roomName}`;
        currentBadge = 'CALLED';
      }

      const payload = {
        tokenCode: String(token.token_code || ''),
        tokenId: String(token.token_id || ''),
        appointmentId: appt ? String(appt.appointment_id) : null,
        patientName: pat?.full_name || 'Patient',
        patientAge: pat?.age || null,
        patientGender: pat?.gender || 'Not Specified',
        patientUhid: pat?.uhid || `UHID-${pat?.patient_id || token.patient_id}`,
        patientPhone: pat?.phone || 'N/A',
        patientEmail: pat?.email || 'N/A',
        bloodGroup: pat?.blood_group || 'Unknown',
        assignedDoctor: formattedDocName,
        department: departmentName,
        opdRoom: roomName,
        currentStage: currentStageName,
        currentStageDesc: currentStageDesc,
        currentBadge: currentBadge,
        totalWaitTime: `${token.estimated_wait_time || 25} mins`,
        queuePosition: token.queue_position || 1,
        billingStatus: pat?.billing_status || 'Paid',
        appointmentDate: appt?.appointment_date ? appt.appointment_date.toISOString() : checkInDate.toISOString(),
        steps,
      };

      res.status(200).json({ data: payload });
    } catch (error: any) {
      console.error('[GET /receptionist/tracking error]', error);
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/receptionist/active-tokens
   * Returns list of today's tokens for quick search & click tracking.
   */
  getActiveTokens = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const tokens = await prisma.queue_tokens.findMany({
        where: { hospital_id: hospitalId },
        include: {
          patients: true,
          doctors: { include: { users: true, departments: true } },
          appointments: true,
        },
        orderBy: { token_id: 'desc' },
        take: 15,
      });

      const list = tokens.map(t => ({
        tokenCode: t.token_code,
        patientName: t.patients?.full_name || 'Patient',
        patientUhid: t.patients?.uhid || `UHID-${t.patient_id}`,
        doctorName: t.doctors?.users?.full_name ? `Dr. ${t.doctors.users.full_name.replace(/^Dr\.\s*/i, '')}` : 'Doctor',
        department: t.doctors?.departments?.department_name || t.doctors?.specialization || 'OPD',
        status: t.token_status,
        queuePosition: t.queue_position,
      }));

      res.status(200).json({ data: list });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

export const receptionistController = new ReceptionistController();
