import type { Request } from 'express';
import { prisma } from '../prisma/client.js';

/**
 * Resolve the hospital_id the authenticated user belongs to.
 * Fallback to 1n if DB query fails or in demo mode.
 */
export async function resolveHospitalIdForUser(req: Request): Promise<bigint> {
  const user = (req as any).user;
  if (!user?.userId) return BigInt(1);

  try {
    const row = await prisma.users.findUnique({
      where: { user_id: BigInt(user.userId) },
      select: { hospital_id: true },
    });
    return row?.hospital_id ?? BigInt(1);
  } catch (err) {
    console.warn("DB lookup failed in resolveHospitalIdForUser, falling back to hospital_id 1:", err);
    return BigInt(1);
  }
}
