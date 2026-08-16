import type { Request, Response } from 'express';
import { aiService } from '../services/ai.service.js';
import { resolveHospitalIdForUser } from '../utils/tenant.js';

export class AiController {
  /**
   * Main conversational chat endpoint
   * POST /api/ai/chat
   */
  chat = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user || { userId: 1, role: 'patient' };
      const hospitalId = await resolveHospitalIdForUser(req);

      let messages = req.body.messages;
      if (!messages && req.body.message) {
        messages = [{ role: 'user', content: req.body.message }];
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Please provide messages array or message string' });
      }

      const result = await aiService.processChat(
        {
          userId: Number(user.userId || user.id || 1),
          role: user.role || 'patient',
          hospitalId: Number(hospitalId || 1),
          email: user.email,
        },
        messages
      );

      return res.status(200).json({
        data: result,
        success: true,
      });
    } catch (err: any) {
      console.error('[AiController.chat]', err);
      return res.status(500).json({ error: err.message || 'Internal server error in AI Assistant' });
    }
  };

  /**
   * Direct patient records summary for AI widget
   * GET /api/ai/my-records
   */
  getMyRecords = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user || { userId: 1, role: 'patient' };
      const hospitalId = await resolveHospitalIdForUser(req);

      const records = await aiService.getPatientRecords(
        Number(user.userId || user.id || 1),
        Number(hospitalId || 1)
      );

      return res.status(200).json({ data: records, success: true });
    } catch (err: any) {
      console.error('[AiController.getMyRecords]', err);
      return res.status(500).json({ error: err.message });
    }
  };

  /**
   * Search records (Staff use)
   * GET /api/ai/search-records?q=...
   */
  searchRecords = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const query = (req.query.q as string) || '';

      if (!query.trim()) {
        return res.status(400).json({ error: 'Search query parameter "q" is required.' });
      }

      const records = await aiService.searchPatientRecords(Number(hospitalId || 1), query);
      return res.status(200).json({ data: records, success: true });
    } catch (err: any) {
      console.error('[AiController.searchRecords]', err);
      return res.status(500).json({ error: err.message });
    }
  };

  /**
   * Get doctors & departments for AI recommendations
   * GET /api/ai/doctors
   */
  getDoctors = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const result = await aiService.listDoctorsAndDepartments(Number(hospitalId || 1));
      return res.status(200).json({ data: result, success: true });
    } catch (err: any) {
      console.error('[AiController.getDoctors]', err);
      return res.status(500).json({ error: err.message });
    }
  };

  /**
   * Live hospital queue overview for staff
   * GET /api/ai/queue-summary
   */
  getQueueSummary = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const summary = await aiService.getHospitalQueueSummary(Number(hospitalId || 1));
      return res.status(200).json({ data: summary, success: true });
    } catch (err: any) {
      console.error('[AiController.getQueueSummary]', err);
      return res.status(500).json({ error: err.message });
    }
  };

  /**
   * Lab reports review overview for staff
   * GET /api/ai/lab-overview
   */
  getLabOverview = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const overview = await aiService.getLabReportsOverview(Number(hospitalId || 1));
      return res.status(200).json({ data: overview, success: true });
    } catch (err: any) {
      console.error('[AiController.getLabOverview]', err);
      return res.status(500).json({ error: err.message });
    }
  };

  /**
   * Retention and churn risk summary
   * GET /api/ai/retention-summary
   */
  getRetentionSummary = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveHospitalIdForUser(req);
      const analytics = await aiService.getRetentionAnalytics(Number(hospitalId || 1));
      return res.status(200).json({ data: analytics, success: true });
    } catch (err: any) {
      console.error('[AiController.getRetentionSummary]', err);
      return res.status(500).json({ error: err.message });
    }
  };
}

export const aiController = new AiController();
