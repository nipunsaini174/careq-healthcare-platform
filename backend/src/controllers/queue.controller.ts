import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { queueService } from '../services/queue.service.js';
import { resolveHospitalIdForUser } from '../utils/tenant.js';

export class QueueController {
  getDoctorQueue = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      let doctorId = req.query.doctorId ? Number(req.query.doctorId as string) : undefined;
      if (!doctorId && (req as any).user) {
        const user = (req as any).user;
        const doc = await prisma.doctors.findFirst({
          where: {
            OR: [
              { user_id: Number(user.userId) },
              { doctor_id: Number(user.userId) },
            ]
          }
        });
        if (doc) doctorId = doc.doctor_id;
      }
      const data = await queueService.getQueueForDoctor(hospitalId, doctorId);
      res.status(200).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  generateToken = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const token = await queueService.generateToken({
        ...req.body,
        hospital_id: req.body.hospital_id || String(hospitalId),
      });
      res.status(201).json(token);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  callNext = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const doctorId = Number(req.body.doctorId || 1);
      const result = await queueService.callNextPatient(hospitalId, doctorId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  completeConsultation = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await queueService.completeConsultation(id as string);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  skipPatient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await queueService.skipPatient(id as string);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  markEmergency = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await queueService.markEmergency(id as string);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await queueService.updateTokenStatus(id as string, status);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  async getQueuesLoad(req: Request, res: Response) {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);

      const opdWait = await prisma.queue_tokens.count({
        where: { hospital_id: hospitalId, token_status: 'WAITING', token_type: 'OPD' }
      }).catch(() => 0);

      const labWait = await prisma.queue_tokens.count({
        where: { hospital_id: hospitalId, token_status: 'WAITING', token_type: 'Lab' }
      }).catch(() => 0);

      const billingWait = await prisma.queue_tokens.count({
        where: { hospital_id: hospitalId, token_status: 'WAITING', token_type: 'Billing' }
      }).catch(() => 0);

      const pharmacyWait = await prisma.queue_tokens.count({
        where: { hospital_id: hospitalId, token_status: 'WAITING', token_type: 'Pharmacy' }
      }).catch(() => 0);

      const queues = [
        {
          id: "q-opd-01",
          label: "OPD General",
          waiting: opdWait,
          max: 50,
          color: "#3AB58F",
          status: "Active",
        },
        {
          id: "q-lab-01",
          label: "Laboratory",
          waiting: labWait,
          max: 30,
          color: "#6366F1",
          status: "Active",
        },
        {
          id: "q-bil-01",
          label: "Billing / Cashier",
          waiting: billingWait,
          max: 15,
          color: "#F97316",
          status: "Active",
        },
        {
          id: "q-pha-01",
          label: "Pharmacy",
          waiting: pharmacyWait,
          max: 40,
          color: "#8B5CF6",
          status: "Active",
        },
      ];

      res.status(200).json(queues);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const queueController = new QueueController();
