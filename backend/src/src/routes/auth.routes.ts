import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/admin-dev-token', authController.adminDevToken);

export default router;
