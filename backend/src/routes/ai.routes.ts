import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { tenantScope } from '../middleware/tenant.middleware.js';

const router = Router();

// Require authentication and tenant context
router.use(authMiddleware);
router.use(tenantScope);

router.post('/chat', aiController.chat);
router.get('/my-records', aiController.getMyRecords);
router.get('/search-records', aiController.searchRecords);
router.get('/doctors', aiController.getDoctors);
router.get('/queue-summary', aiController.getQueueSummary);
router.get('/lab-overview', aiController.getLabOverview);
router.get('/retention-summary', aiController.getRetentionSummary);

export default router;
