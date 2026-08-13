import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { resolveHospitalIdForUser } from '../utils/tenant.js';

type AppointmentRange = 'today' | '7d' | '30d';

const ALLOWED_RANGES: ReadonlySet<AppointmentRange> = new Set(['today', '7d', '30d']);

function resolveRangeStart(range: AppointmentRange): Date {
  const start = new Date();
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === '7d') {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }
  return start;
}

export class ReportController {
  async getDashboardKpis(req: Request, res: Response) {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const rawRange = typeof req.query.range === 'string' ? req.query.range : 'today';
      const range: AppointmentRange = ALLOWED_RANGES.has(rawRange as AppointmentRange)
        ? (rawRange as AppointmentRange)
        : 'today';
      const rangeStart = resolveRangeStart(range);

      try {
        const [
          appointmentsTotal,
          admitted,
          waiting,
          consultation,
          labQueue,
          completed,
          noShow,
          uniquePatients,
        ] = await prisma.$transaction([
          prisma.appointments.count({
            where: { hospital_id: hospitalId, appointment_date: { gte: rangeStart }, appointment_status: { notIn: ['CANCELLED', 'cancelled'] } }
          }),
          prisma.patients.count({
            where: { hospital_id: hospitalId, patient_status: { in: ['Admitted', 'ADMITTED'] } }
          }),
          prisma.queue_tokens.count({
            where: { hospital_id: hospitalId, token_status: { in: ['WAITING', 'Waiting', 'waiting'] } }
          }),
          prisma.queue_tokens.count({
            where: { hospital_id: hospitalId, token_status: { in: ['IN_PROGRESS', 'In Progress', 'SERVING', 'Serving'] } }
          }),
          prisma.queue_tokens.count({
            where: { hospital_id: hospitalId, token_type: { in: ['LAB', 'Lab', 'lab'] }, token_status: { in: ['WAITING', 'Waiting'] } }
          }),
          prisma.queue_tokens.count({
            where: { hospital_id: hospitalId, token_status: { in: ['COMPLETED', 'Completed', 'completed'] } }
          }),
          prisma.queue_tokens.count({
            where: { hospital_id: hospitalId, token_status: { in: ['NO_SHOW', 'No Show', 'SKIPPED', 'Skipped'] } }
          }),
          prisma.appointments.groupBy({
            by: ['patient_id'],
            where: { hospital_id: hospitalId, appointment_date: { gte: rangeStart } },
            _count: { patient_id: true },
          }),
        ]);

        res.status(200).json({
          appointmentsTotal,
          totalPatients: Array.isArray(uniquePatients) ? uniquePatients.length : 0,
          admitted,
          waiting,
          consultation,
          labQueue,
          completed,
          noShow,
          range
        });
      } catch (dbError) {
        console.warn("DB KPI query warning, returning zero-baseline stats:", dbError);
        res.status(200).json({
          appointmentsTotal: 0,
          totalPatients: 0,
          admitted: 0,
          waiting: 0,
          consultation: 0,
          labQueue: 0,
          completed: 0,
          noShow: 0,
          range
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const reportController = new ReportController();
