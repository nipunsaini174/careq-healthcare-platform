import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/receptionists', adminController.getAllReceptionists);
router.post('/receptionists', adminController.createReceptionist);
router.put('/receptionists/:id/status', adminController.updateReceptionistStatus);
router.put('/receptionists/:id', adminController.updateReceptionist);
router.delete('/receptionists/:id', adminController.deleteReceptionist);

export default router;
