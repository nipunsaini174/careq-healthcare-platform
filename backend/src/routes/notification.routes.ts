import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Endpoint to broadcast global notifications
router.post('/broadcast', notificationController.sendGlobalBroadcast);

// User-specific notification routes
router.get('/', authMiddleware, notificationController.getUserNotifications);
router.put('/read-all', authMiddleware, notificationController.markAllRead);
router.put('/:id/read', authMiddleware, notificationController.markAsRead);

export default router;
