import { Router } from 'express';
import { queueController } from '../controllers/queue.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', authMiddleware, requireRole('admin', 'receptionist'), queueController.getQueuesLoad);

export default router;
