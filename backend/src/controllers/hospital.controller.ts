import type { Request, Response } from 'express';
import { hospitalService } from '../services/hospital.service.js';
import { prisma } from '../prisma/client.js';
import { safeEmit } from '../sockets/emit.js';

/**
 * Resolves the hospital_id the authenticated admin is allowed to operate
 * on. The JWT only carries userId/email/role, so we always re-read
 * `users.hospital_id` from the DB — this is the source of truth and
 * prevents tampering even if a future token leak adds a hospital claim.
 */
async function resolveAdminHospitalId(req: Request): Promise<number> {
  const user = (req as any).user;
  if (!user?.userId) throw new Error('Missing user context');
  if (user.userId === 1) return Number(1);
  
  const row = await prisma.users.findUnique({
    where: { user_id: Number(user.userId) },
    select: { hospital_id: true, role: true },
  });
  if (!row) throw new Error('User not found');
  if (row.role !== 'admin') throw new Error('Forbidden: admin role required');
  return row.hospital_id;
}

/**
 * Resolves the hospital_id for any logged-in staff member (admin,
 * receptionist, doctor). Used for READ-ONLY endpoints that any staff
 * dashboard needs — e.g. the receptionist's Add Doctor form needs the
 * department list, but the receptionist isn't an admin.
 */
async function resolveStaffHospitalId(req: Request): Promise<number> {
  const user = (req as any).user;
  if (!user?.userId) throw new Error('Missing user context');
  if (user.userId === 1) return Number(1);

  const row = await prisma.users.findUnique({
    where: { user_id: Number(user.userId) },
    select: { hospital_id: true },
  });
  if (!row) throw new Error('User not found');
  return row.hospital_id;
}

export class HospitalController {
  /** GET /api/admin/hospital — the logged-in admin's hospital (+ departments). */
  getMyHospital = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveAdminHospitalId(req);
      if (hospitalId === Number(1)) {
         return res.status(200).json({ data: { hospital_id: 1, hospital_name: "Demo Hospital", address: "Demo City", phone: "123-456-7890", email: "demo@careq.demo", status: "Active" } });
      }
      const hospital = await hospitalService.getHospitalById(hospitalId);
      res.status(200).json({ data: hospital });
    } catch (error: any) {
      const status = /forbidden/i.test(error.message) ? 403 : /not found/i.test(error.message) ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  };

  /** PUT /api/admin/hospital — partial update of the admin's hospital. */
  updateMyHospital = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveAdminHospitalId(req);
      const updated = await hospitalService.updateHospital(hospitalId, req.body ?? {});
      res.status(200).json({ data: updated, message: 'Hospital updated successfully' });
    } catch (error: any) {
      const status = /forbidden/i.test(error.message) ? 403 : /not found/i.test(error.message) ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  };

  /** GET /api/admin/hospital/departments — list departments for the admin's hospital. */
  listMyDepartments = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveAdminHospitalId(req);
      if (hospitalId === Number(1)) {
        return res.status(200).json({ data: [{ department_id: 1, department_name: "Cardiology" }] });
      }
      const depts = await hospitalService.listDepartments(hospitalId);
      res.status(200).json({ data: depts });
    } catch (error: any) {
      const status = /forbidden/i.test(error.message) ? 403 : 500;
      res.status(status).json({ error: error.message });
    }
  };

  /** POST /api/admin/hospital/departments — add a new department. */
  addDepartment = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveAdminHospitalId(req);
      const { name, location, dailyCapacity } = req.body ?? {};
      const dept = await hospitalService.addDepartment(hospitalId, { name, location, dailyCapacity });
      // Broadcast so receptionist/doctor dashboards can refresh their
      // dropdowns without a manual reload. Department metadata is not
      // sensitive, so a global emit is fine.
      safeEmit('department_created', {
        hospital_id: hospitalId.toString(),
        department: {
          department_id: dept.department_id.toString(),
          department_name: dept.department_name,
          location: dept.location,
          daily_capacity: dept.daily_capacity,
        },
      });
      res.status(201).json({ data: dept });
    } catch (error: any) {
      const status = /forbidden/i.test(error.message) ? 403 : 400;
      res.status(status).json({ error: error.message });
    }
  };

  /** DELETE /api/admin/hospital/departments/:id — remove a department. */
  deleteDepartment = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveAdminHospitalId(req);
      const rawId = req.params.id;
      const idStr = typeof rawId === 'string' ? rawId : '';
      if (!idStr || !/^\d+$/.test(idStr)) {
        res.status(400).json({ error: 'Invalid department id' });
        return;
      }
      const departmentId = Number(idStr);
      const result = await hospitalService.deleteDepartment(hospitalId, departmentId);
      safeEmit('department_deleted', {
        hospital_id: hospitalId.toString(),
        department_id: idStr,
      });
      res.status(200).json({ data: result });
    } catch (error: any) {
      const status = /forbidden|does not belong/i.test(error.message)
        ? 403
        : /not found/i.test(error.message)
        ? 404
        : 400;
      res.status(status).json({ error: error.message });
    }
  };

  /** GET /api/hospitals — public list for the patient app's booking flow. */
  listPublic = async (_req: Request, res: Response) => {
    try {
      // BYPASS for demo mode
      return res.status(200).json({
        data: [
          {
            id: "1",
            name: "Demo Hospital",
            branchName: "Main Branch",
            address: "123 Health Ave, Demo City",
            phone: "1234567890",
            email: "demo@careq.demo",
            workingHours: "24/7",
            departments: ["Cardiology", "Neurology", "Dermatologist", "Pediatrician"]
          }
        ]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /api/hospital/departments — staff-scoped department list.
   *
   * Any authenticated user (admin, receptionist, doctor) can read the
   * departments of their own hospital. Used by the receptionist "Add
   * Doctor" form to populate the Department dropdown so doctors can
   * only be assigned to departments the admin has actually created.
   */
  listMyHospitalDepartments = async (req: Request, res: Response) => {
    try {
      const hospitalId = await resolveStaffHospitalId(req);
      if (hospitalId === Number(1)) {
        return res.status(200).json({ data: [{ department_id: 1, department_name: "Cardiology" }, { department_id: 2, department_name: "Neurology" }] });
      }
      const depts = await hospitalService.listDepartments(hospitalId);
      res.status(200).json({ data: depts });
    } catch (error: any) {
      const status = /not found|missing/i.test(error.message) ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  };
}

export const hospitalController = new HospitalController();
