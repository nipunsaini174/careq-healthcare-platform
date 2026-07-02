import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { doctorService } from '../services/doctor.service.js';

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
      const newDoctor = await doctorService.createDoctor(req.body);
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
}

export const receptionistController = new ReceptionistController();
