import type { Request } from 'express';
import { prisma } from '../prisma/client.js';

/**
 * Resolve the hospital_id the authenticated user (admin, receptionist, or patient) belongs to.
 * Scopes data aggregates to this hospital to enforce multi-tenancy.
 */
export async function resolveHospitalIdForUser(req: Request): Promise<bigint> {
  const user = (req as any).user;
  if (!user?.userId) throw new Error('Missing user context');
  
  const row = await prisma.users.findUnique({
    where: { user_id: BigInt(user.userId) },
    select: { hospital_id: true },
  });
  
  if (!row) throw new Error('User not found');
  
  return row.hospital_id;
}
