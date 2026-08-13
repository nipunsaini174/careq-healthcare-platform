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
      const data = await retentionService.getPatientRiskDetail(BigInt(journeyId));
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async triggerAssessment(req: Request, res: Response) {
    try {
      const { journeyId } = req.params;
      const assessment = await retentionService.triggerAssessment(BigInt(journeyId));
      res.status(200).json({ success: true, data: assessment });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createIntervention(req: Request, res: Response) {
    try {
      const { journeyId, type, priority, assignedTo, notes } = req.body;
      const intervention = await retentionService.createIntervention({
        journeyId: BigInt(journeyId),
        type,
        priority: priority || 'HIGH',
        assignedTo: assignedTo ? BigInt(assignedTo) : undefined,
        notes,
      });
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
        BigInt(interventionId),
        outcome,
        outcomeNotes,
        rescheduledDate
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
