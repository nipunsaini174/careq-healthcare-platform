import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    where: { hospital_id: 1n }
  });
  console.log(users);
}

main().finally(() => prisma.$disconnect());
