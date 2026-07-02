import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userIdsToDelete = [22n, 23n, 25n, 26n, 27n, 28n, 29n, 30n];

  console.log('Starting deletion of specific users:', userIdsToDelete);

  for (const userId of userIdsToDelete) {
    try {
      // Get patient IDs for this user
      const patients = await prisma.patients.findMany({ where: { user_id: userId }, select: { patient_id: true } });
      const patientIds = patients.map(p => p.patient_id);
      
      if (patientIds.length > 0) {
        // Delete child records of patients
        await prisma.appointments.deleteMany({ where: { patient_id: { in: patientIds } } });
      }

      // Delete child records first to avoid foreign key constraints
      await prisma.doctors.deleteMany({ where: { user_id: userId } });
      await prisma.patients.deleteMany({ where: { user_id: userId } });
      await prisma.receptionists.deleteMany({ where: { user_id: userId } });
      await prisma.admins.deleteMany({ where: { user_id: userId } });
      await prisma.notifications.deleteMany({ where: { user_id: userId } });
      
      // Delete the user
      await prisma.users.delete({ where: { user_id: userId } });
      
      console.log(`Successfully deleted user ${userId}`);
    } catch (err: any) {
      console.error(`Failed to delete user ${userId}:`, err.message);
    }
  }

  console.log('Deletion complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
