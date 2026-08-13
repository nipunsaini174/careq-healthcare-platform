import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/next-slot', appointmentController.getNextSlot);
router.get('/', appointmentController.getAppointments);
router.post('/', appointmentController.createAppointment);
router.put('/:id/cancel', appointmentController.cancelAppointment);

export default router;
