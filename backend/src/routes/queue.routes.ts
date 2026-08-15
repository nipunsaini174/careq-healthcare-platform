import { Router } from 'express';
import { queueController } from '../controllers/queue.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', queueController.getQueuesLoad);
router.get('/doctor', queueController.getDoctorQueue);
router.post('/token', queueController.generateToken);
router.post('/call-next', queueController.callNext);
router.put('/:id/complete', queueController.completeConsultation);
router.put('/:id/skip', queueController.skipPatient);
router.put('/:id/emergency', queueController.markEmergency);
router.put('/:id/status', queueController.updateStatus);

export default router;
