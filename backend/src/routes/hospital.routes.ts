import { Router } from 'express';
import { hospitalController } from '../controllers/hospital.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

/**
 * Public hospital router — patient app uses this to populate the
 * "choose a hospital" view. No auth: hospital metadata is non-sensitive
 * and we want unauthenticated browsing of available providers.
 */
export const hospitalPublicRouter = Router();
hospitalPublicRouter.get('/', hospitalController.listPublic);

/**
 * Admin hospital router — mounted under /api/admin/hospital. Every
 * route here requires a real JWT and the `admin` role; the controller
 * additionally re-reads the user's hospital_id from the DB so an admin
 * can only ever read/write their own hospital row.
 */
export const hospitalAdminRouter = Router();
hospitalAdminRouter.use(authMiddleware, requireRole('admin'));

hospitalAdminRouter.get('/', hospitalController.getMyHospital);
hospitalAdminRouter.put('/', hospitalController.updateMyHospital);

hospitalAdminRouter.get('/departments', hospitalController.listMyDepartments);
hospitalAdminRouter.post('/departments', hospitalController.addDepartment);
hospitalAdminRouter.delete('/departments/:id', hospitalController.deleteDepartment);

/**
 * Staff hospital router — mounted under /api/hospital. Read-only views
 * that every authenticated staff role (admin, receptionist, doctor)
 * needs to do its job, e.g. the receptionist Add Doctor form needs
 * the department list but the receptionist is not an admin.
 *
 * Writes stay on the admin router. The controller re-reads
 * hospital_id from the DB on each call so staff can only see their
 * own hospital's data.
 */
export const hospitalStaffRouter = Router();
hospitalStaffRouter.use(authMiddleware, requireRole('admin', 'receptionist', 'doctor'));

hospitalStaffRouter.get('/departments', hospitalController.listMyHospitalDepartments);

export default hospitalAdminRouter;
