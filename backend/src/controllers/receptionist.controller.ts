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
async function resolveHospitalIdForUser(req: Request): Promise<bigint> {
  const user = (req as any).user;
  if (!user?.userId) throw new Error('Missing user context');
  const row = await prisma.users.findUnique({
    where: { user_id: BigInt(user.userId) },
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
        where: { hospital_id: hospitalId },
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
   * Removes a token from the live queue (e.g. archiving a cancelled appointment).
   */
  removeTokenFromQueue = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const tokenId = BigInt(req.params.id as string);

      const token = await prisma.queue_tokens.findUnique({
        where: { token_id: tokenId }
      });

      if (!token || token.hospital_id !== hospitalId) {
        return res.status(404).json({ error: 'Token not found' });
      }

      await prisma.queue_tokens.delete({
        where: { token_id: tokenId }
      });

      safeEmit('queue_updated', {
        hospitalId: hospitalId.toString(),
        reason: 'token_removed'
      });

      res.status(200).json({ success: true });
    } catch (error: any) {
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
        where: { hospital_id: hospitalId },
        include: {
          doctors: { select: { users: { select: { full_name: true } } } },
          appointments: {
            select: { 
              created_at: true,
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

        return {
          patientId: p.patient_id.toString(),
          uhid: p.uhid,
          name: p.full_name,
          phone: p.phone || 'N/A',
          email: p.email || 'N/A',
          status: p.patient_status || 'Active',
          billingStatus: p.billing_status || 'Pending',
          doctorName: formattedDocName,
          totalVisits: p.appointments?.length || 0,
          lastVisit: p.appointments?.[0]?.created_at ? p.appointments[0].created_at.toISOString() : null,
        };
      });

      res.status(200).json({ data });
    } catch (error: any) {
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
      const profile = await receptionistService.getProfileByUserId(BigInt(user.userId));
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
      const profile = await receptionistService.updateProfileByUserId(BigInt(user.userId), {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone } : {}),
      });
      res.status(200).json({ data: profile, message: 'Profile updated successfully' });
    } catch (error: any) {
      const status = /not found/i.test(error.message) ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  };
}

export const receptionistController = new ReceptionistController();
