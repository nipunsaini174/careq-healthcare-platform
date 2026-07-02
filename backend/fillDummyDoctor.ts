import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.doctors.findFirst();
  if (doctor) {
    await prisma.doctors.update({
      where: { doctor_id: doctor.doctor_id },
      data: {
        focus: 'Interventional Cardiology & Electrophysiology',
        credentials: 'MD, FACC - Harvard Medical School',
        room: 'Room 402',
        bio: 'Dedicated cardiologist with 15+ years of experience specializing in cardiovascular diagnostics, cardiac catheterization, and preventative heart care.',
        awards: 'American Heart Association Distinguished Fellow (2025)\nClinical Excellence Laureate (2024)\nMemorial Health Lifetime Achievement Award (2022)'
      }
    });
    console.log('Dummy data filled successfully!');
  } else {
    console.log('No doctor found to update.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
