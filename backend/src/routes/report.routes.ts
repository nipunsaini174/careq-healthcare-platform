import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

// Endpoint for Dashboard KPIs
router.get('/dashboard-kpis', reportController.getDashboardKpis);

export default router;
