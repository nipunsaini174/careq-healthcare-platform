import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';

type AppointmentRange = 'today' | '7d' | '30d';

const ALLOWED_RANGES: ReadonlySet<AppointmentRange> = new Set(['today', '7d', '30d']);

/**
 * Resolve the inclusive lower bound for an appointment-count window.
 * Uses server-local time; for a multi-region deployment we'd want to
 * accept a tz hint from the client, but for a single-tenant hospital
 * dashboard the server's clock is the source of truth.
 */
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
      const rawRange = typeof req.query.range === 'string' ? req.query.range : 'today';
      const range: AppointmentRange = ALLOWED_RANGES.has(rawRange as AppointmentRange)
        ? (rawRange as AppointmentRange)
        : 'today';
      const rangeStart = resolveRangeStart(range);

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
          where: { appointment_date: { gte: rangeStart } }
        }),
        prisma.patients.count({
          where: { patient_status: 'Admitted' }
        }),
        prisma.queue_tokens.count({
          where: { token_status: 'Waiting' }
        }),
        prisma.consultations.count({
          where: { consultation_status: 'In Progress' }
        }),
        prisma.lab_reports.count({
          where: { report_status: 'Pending' }
        }),
        prisma.consultations.count({
          where: { consultation_status: 'Completed' }
        }),
        prisma.queue_tokens.count({
          where: { token_status: 'No Show' }
        }),
        // Count of DISTINCT patient_id with an appointment in the
        // selected window — answers "how many real people booked
        // appointments". Prisma's `groupBy({ _count: ... })` returns
        // one row per patient; we read the length of that array.
        prisma.appointments.groupBy({
          by: ['patient_id'],
          where: { appointment_date: { gte: rangeStart } },
          orderBy: { patient_id: 'asc' },
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const reportController = new ReportController();
