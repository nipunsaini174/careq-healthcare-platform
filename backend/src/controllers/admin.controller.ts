import type { Request, Response } from 'express';
import { receptionistService } from '../services/receptionist.service.js';
import { resolveHospitalIdForUser } from '../utils/tenant.js';

export class AdminController {
  getAllReceptionists = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const receptionists = await receptionistService.getAllReceptionists(hospitalId);
      res.status(200).json(receptionists);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createReceptionist = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const newReceptionist = await receptionistService.createReceptionist(hospitalId, req.body);
      res.status(201).json(newReceptionist);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateReceptionist = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const id = req.params.id as string;
      const updatedReceptionist = await receptionistService.updateReceptionist(hospitalId, id, req.body);
      res.status(200).json(updatedReceptionist);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateReceptionistStatus = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const id = req.params.id as string;
      const { status } = req.body;
      const updatedReceptionist = await receptionistService.updateReceptionistStatus(hospitalId, id, status);
      res.status(200).json(updatedReceptionist);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deleteReceptionist = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const id = req.params.id as string;
      await receptionistService.deleteReceptionist(hospitalId, id);
      res.status(200).json({ success: true, message: 'Receptionist deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

export const adminController = new AdminController();
