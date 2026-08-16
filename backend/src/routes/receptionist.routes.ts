import { Router } from 'express';
import { receptionistController } from '../controllers/receptionist.controller.js';
import { doctorController } from '../controllers/doctor.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

// Doctor management — requires authenticated receptionist or admin so we
// can resolve hospital_id from the JWT (createDoctor throws "Missing user
// context" without this).
const doctorMgmt = Router();
doctorMgmt.use(authMiddleware, requireRole('receptionist', 'admin'));
doctorMgmt.get('/', doctorController.getAllDoctors);
doctorMgmt.post('/', receptionistController.createDoctor);
doctorMgmt.put('/:id', doctorController.updateDoctorStatus);
doctorMgmt.delete('/:id', doctorController.deleteDoctor);
router.use('/doctors', doctorMgmt);

// Dashboard endpoints — scoped to the authenticated user's hospital.
// `requireRole` keeps these off-limits to patient tokens since the
// activity feed includes full patient names and would otherwise leak
// PII across roles.
router.get(
  '/patients',
  authMiddleware,
  requireRole('receptionist', 'admin'),
  receptionistController.getAllPatients,
);
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
router.delete(
  '/queue/:id',
  authMiddleware,
  requireRole('receptionist', 'admin'),
  receptionistController.removeTokenFromQueue,
);
router.get(
  '/profile',
  authMiddleware,
  requireRole('receptionist', 'admin'),
  receptionistController.getMyProfile,
);
router.get(
  '/tracking',
  authMiddleware,
  receptionistController.trackToken,
);
router.get(
  '/tracking/:tokenCode',
  authMiddleware,
  receptionistController.trackToken,
);
router.get(
  '/active-tokens',
  authMiddleware,
  receptionistController.getActiveTokens,
);
router.patch(
  '/profile',
  authMiddleware,
  requireRole('receptionist'),
  receptionistController.updateMyProfile,
);

export default router;
