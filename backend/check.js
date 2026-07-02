import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const patients = await prisma.patients.findMany();
  console.log(patients);
}

check();
