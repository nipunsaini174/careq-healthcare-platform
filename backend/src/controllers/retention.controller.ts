import type { Request, Response } from 'express';
import { retentionService } from '../services/retention.service.js';
import { resolveHospitalIdForUser } from '../utils/tenant.js';

export class RetentionController {
  async getDashboard(req: Request, res: Response) {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const data = await retentionService.getDashboardSummary(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPatientDetail(req: Request, res: Response) {
    try {
      const { journeyId } = req.params;
      const data = await retentionService.getPatientRiskDetail(Number(journeyId as string));
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async triggerAssessment(req: Request, res: Response) {
    try {
      const { journeyId } = req.params;
      const assessment = await retentionService.triggerAssessment(Number(journeyId as string));
      res.status(200).json({ success: true, data: assessment });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createIntervention(req: Request, res: Response) {
    try {
      const { journeyId, type, priority, assignedTo, notes } = req.body;
      const interventionData: any = {
        journeyId: Number(journeyId),
        type: type as string,
        priority: priority ? (priority as string) : 'HIGH',
      };
      if (assignedTo) interventionData.assignedTo = Number(assignedTo);
      if (notes) interventionData.notes = notes as string;
      
      const intervention = await retentionService.createIntervention(interventionData);
      res.status(201).json({ success: true, data: intervention });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async recordOutcome(req: Request, res: Response) {
    try {
      const { interventionId } = req.params;
      const { outcome, outcomeNotes, rescheduledDate } = req.body;
      const result = await retentionService.recordOutcome(
        Number(interventionId as string),
        outcome as string,
        outcomeNotes as string,
        rescheduledDate as string
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const data = await retentionService.getAnalytics(hospitalId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const retentionController = new RetentionController();
