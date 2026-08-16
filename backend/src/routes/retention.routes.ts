import { Router } from 'express';
import { retentionController } from '../controllers/retention.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// Allow receptionist, doctor, admin roles for retention endpoints
router.use(authMiddleware, requireRole('receptionist', 'doctor', 'admin'));

router.get('/dashboard', retentionController.getDashboard);
router.get('/analytics', retentionController.getAnalytics);
router.get('/followup-intelligence', retentionController.getFollowupIntelligence);
router.post('/predict-followup', retentionController.predictFollowup);
router.post('/action-followup', retentionController.actionFollowup);
router.get('/patients/:journeyId', retentionController.getPatientDetail);
router.post('/assess/:journeyId', retentionController.triggerAssessment);
router.post('/interventions', retentionController.createIntervention);
router.patch('/interventions/:interventionId/outcome', retentionController.recordOutcome);

export default router;
