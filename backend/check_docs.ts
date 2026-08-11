import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctors.findMany({
    include: { users: true }
  });
  console.log(JSON.stringify(doctors.map(d => ({
    doctor_id: d.doctor_id.toString(),
    name: d.users?.full_name
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
