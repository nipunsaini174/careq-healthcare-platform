import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.appointments.deleteMany({
    where: { appointment_id: { in: [23, 24, 25] } }
  });
  console.log('Deleted 23, 24, 25');
}

main().finally(() => prisma.$disconnect());
