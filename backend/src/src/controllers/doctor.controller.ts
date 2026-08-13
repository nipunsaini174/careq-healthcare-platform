import type { Request, Response } from 'express';
import { doctorService } from '../services/doctor.service.js';

export class DoctorController {
  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const profile = await doctorService.getProfile(userId);
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const updatedProfile = await doctorService.updateProfile(userId, req.body);
      res.status(200).json(updatedProfile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getAllDoctors = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      let hospitalId: bigint | undefined;
      if (user) {
        const { resolveHospitalIdForUser } = await import('../utils/tenant.js');
        hospitalId = await resolveHospitalIdForUser(req);
      }
      const doctors = await doctorService.getAllDoctors(hospitalId);
      res.status(200).json(doctors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // GET /api/doctors/specialties — drives the patient-app specialty chip row.
  getSpecialties = async (req: Request, res: Response) => {
    try {
      const specialties = await doctorService.getSpecialties();
      res.status(200).json({ data: specialties });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createDoctor = async (req: Request, res: Response) => {
    try {
      const { resolveHospitalIdForUser } = await import('../utils/tenant.js');
      const hospitalId = await resolveHospitalIdForUser(req);
      const newDoctor = await doctorService.createDoctor(req.body, hospitalId);
      res.status(201).json(newDoctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateDoctorStatus = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const updatedDoctor = await doctorService.updateDoctorStatus(id, status);
      res.status(200).json(updatedDoctor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deleteDoctor = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      await doctorService.deleteDoctor(id);
      res.status(200).json({ success: true, message: 'Doctor deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

export const doctorController = new DoctorController();
