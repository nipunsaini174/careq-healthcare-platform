import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';

const router = Router();

// Endpoint for Dashboard KPIs
router.get('/dashboard-kpis', reportController.getDashboardKpis);

export default router;
