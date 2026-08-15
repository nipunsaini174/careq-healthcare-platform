import type { Request } from 'express';
import { prisma } from '../prisma/client.js';

/**
 * Resolve the hospital_id the authenticated user belongs to.
 * Fallback to  if DB query fails or in demo mode.
 */
export async function resolveHospitalIdForUser(req: Request): Promise<number> {
  const user = (req as any).user;
  // If we are bypassing auth with user id 1, just return hospital 1
  if (!user?.userId || user.userId === 1) return Number(1);

  try {
    const row = await prisma.users.findUnique({
      where: { user_id: Number(user.userId) },
      select: { hospital_id: true },
    });
    return row?.hospital_id ?? Number(1);
  } catch (err) {
    console.warn("DB lookup failed in resolveHospitalIdForUser, falling back to hospital_id 1:", err);
    return Number(1);
  }
}
