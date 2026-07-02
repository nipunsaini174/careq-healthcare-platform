import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const appt = await prisma.appointments.findUnique({
    where: { appointment_id: 6 },
    include: { patients: true }
  });
  console.dir(appt, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
