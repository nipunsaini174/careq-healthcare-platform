import { Router } from 'express';
import { patientController } from '../controllers/patient.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// These routes require authentication
router.use(authMiddleware);

// Use /profile as the endpoint for the current logged-in user
router.get('/profile', patientController.getProfile);
router.patch('/profile', patientController.updateProfile);

// Appointment endpoints for the currently logged-in patient.
// These are the source of truth that drive the home-page user-state
// (first-time / returning-empty / active).
router.get('/appointments', patientController.getMyAppointments);
router.post('/appointments', patientController.bookAppointment);
router.patch('/appointments/:id/cancel', patientController.cancelMyAppointment);

// Admin / Receptionist Routes
router.get('/', patientController.getAllPatients);
router.post('/', patientController.registerPatient);
router.delete('/:id', patientController.deletePatient);

export default router;
