import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding Apex Hospital...');
  
  // Find the hospital named "Apex Hospital" (case-insensitive if possible, or just "Apex Hospital")
  const hospital = await prisma.hospitals.findFirst({
    where: {
      hospital_name: {
        contains: 'Apex',
        mode: 'insensitive',
      }
    }
  });

  if (!hospital) {
    console.log('No hospital found matching "Apex Hospital".');
    return;
  }

  const hospitalId = hospital.hospital_id;
  console.log(`Found hospital: ${hospital.hospital_name} (ID: ${hospitalId})`);

  // We need to delete in the correct order to avoid foreign key constraint violations.
  // Generally, delete child records first.

  console.log('Deleting follow_up_consultations...');
  await prisma.follow_up_consultations.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting billing_invoices...');
  await prisma.billing_invoices.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting lab_reports...');
  await prisma.lab_reports.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting queue_tokens...');
  await prisma.queue_tokens.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting consultations...');
  // consultations don't have hospital_id directly? Let's check schema.
  // Wait, consultations relation has patient_id, doctor_id, token_id.
  // We can delete all consultations for doctors in this hospital.
  const doctors = await prisma.doctors.findMany({ where: { hospital_id: hospitalId }, select: { doctor_id: true } });
  const doctorIds = doctors.map(d => d.doctor_id);
  
  if (doctorIds.length > 0) {
    await prisma.consultations.deleteMany({ where: { doctor_id: { in: doctorIds } } });
  }

  console.log('Deleting appointments...');
  await prisma.appointments.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting walk_in_patients...');
  await prisma.walk_in_patients.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting notifications...');
  await prisma.notifications.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting patient_profiles...');
  await prisma.patient_profiles.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting patients...');
  await prisma.patients.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting doctors...');
  await prisma.doctors.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting departments...');
  await prisma.departments.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting admins...');
  await prisma.admins.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting receptionists...');
  await prisma.receptionists.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting users...');
  await prisma.users.deleteMany({ where: { hospital_id: hospitalId } });

  console.log('Deleting hospital...');
  await prisma.hospitals.delete({ where: { hospital_id: hospitalId } });

  console.log(`Successfully deleted ${hospital.hospital_name} and all associated data!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
