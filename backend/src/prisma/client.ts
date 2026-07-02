import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Add a global hook to serialize BigInts to strings when using JSON.stringify
// This prevents errors when Express attempts to send Prisma responses as JSON.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
