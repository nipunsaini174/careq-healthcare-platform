import { type Request, type Response, type NextFunction } from 'express';
import { resolveHospitalIdForUser } from '../utils/tenant.js';

export const tenantScope = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = await resolveHospitalIdForUser(req);
    (req as any).hospitalId = hospitalId;
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Tenant resolution failed: ' + error.message });
  }
};
