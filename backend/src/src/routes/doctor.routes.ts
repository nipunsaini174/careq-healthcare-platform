import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/profile', authMiddleware, doctorController.getProfile);
router.put('/profile', authMiddleware, doctorController.updateProfile);

// Public discovery endpoints used by the patient app.
router.get('/specialties', doctorController.getSpecialties);
router.get('/', doctorController.getAllDoctors);

router.put('/:id', doctorController.updateDoctorStatus);
router.delete('/:id', doctorController.deleteDoctor);

export default router;
