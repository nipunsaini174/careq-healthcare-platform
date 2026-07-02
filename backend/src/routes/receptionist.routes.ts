import { Router } from 'express';
import { receptionistController } from '../controllers/receptionist.controller.js';
import { doctorController } from '../controllers/doctor.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// Doctor Management from Receptionist perspective
router.get('/doctors', doctorController.getAllDoctors);
router.post('/doctors', receptionistController.createDoctor);
router.put('/doctors/:id', doctorController.updateDoctorStatus);
router.delete('/doctors/:id', doctorController.deleteDoctor);

// Dashboard endpoints — scoped to the authenticated user's hospital.
// `requireRole` keeps these off-limits to patient tokens since the
// activity feed includes full patient names and would otherwise leak
// PII across roles.
router.get(
  '/dashboard-stats',
  authMiddleware,
  requireRole('receptionist', 'admin'),
  receptionistController.getDashboardStats,
);
router.get(
  '/queue-activity',
  authMiddleware,
  requireRole('receptionist', 'admin'),
  receptionistController.getQueueActivity,
);

export default router;
