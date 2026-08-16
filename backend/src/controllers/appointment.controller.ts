import type { Request, Response } from 'express';
import { appointmentService } from '../services/appointment.service.js';
import { resolveHospitalIdForUser } from '../utils/tenant.js';

export class AppointmentController {
  getNextSlot = async (req: Request, res: Response) => {
    try {
      const doctorId = req.query.doctorId ? Number(req.query.doctorId as string) : Number(1);
      const dateStr = req.query.date as string | undefined;
      const slot = await appointmentService.calculateNextAvailableSlot(doctorId, dateStr);
      res.status(200).json(slot);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  createAppointment = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const appt = await appointmentService.createAppointment({
        ...req.body,
        hospital_id: req.body.hospital_id || String(hospitalId),
      });
      res.status(201).json(appt);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  getAppointments = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const list = await appointmentService.getAppointments(hospitalId);
      res.status(200).json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  cancelAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await appointmentService.cancelAppointment(id as string);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  checkInAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await appointmentService.checkInAppointment(id as string);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };
}

export const appointmentController = new AppointmentController();
