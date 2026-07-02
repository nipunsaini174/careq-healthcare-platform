import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';

const router = Router();

// Endpoint to broadcast global notifications
router.post('/broadcast', notificationController.sendGlobalBroadcast);

export default router;
