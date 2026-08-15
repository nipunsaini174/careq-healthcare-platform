import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SQLite database...');

  // Clear existing data
  await prisma.walk_in_patients.deleteMany({});
  await prisma.queue_tokens.deleteMany({});
  await prisma.appointments.deleteMany({});
  await prisma.patients.deleteMany({});
  await prisma.doctors.deleteMany({});
  await prisma.departments.deleteMany({});
  await prisma.users.deleteMany({});
  await prisma.hospitals.deleteMany({});

  // 1. Hospital
  const hospital = await prisma.hospitals.create({
    data: {
      hospital_id: 1,
      hospital_name: 'Sanjeevani Hospital',
      registration_no: 'REG-12345',
      branch_name: 'Main Branch',
      address: '123 Health Ave, Medical City',
      phone: '1-800-SANJEEVANI',
      email: 'contact@sanjeevani.com',
      working_hours: '24/7'
    }
  });

  // 2. Users (Admin, Receptionist, Doctor, Patient)
  const passwordHash = await bcrypt.hash('password123', 10);

  const receptionistUser = await prisma.users.create({
    data: {
      user_id: 1,
      hospital_id: hospital.hospital_id,
      full_name: 'Jane Smith',
      email: 'receptionist@sanjeevani.com',
      password_hash: passwordHash,
      role: 'receptionist',
      status: 'Active'
    }
  });

  const doctorUser1 = await prisma.users.create({
    data: {
      user_id: 2,
      hospital_id: hospital.hospital_id,
      full_name: 'Dr. John Doe',
      email: 'john.doe@sanjeevani.com',
      password_hash: passwordHash,
      role: 'doctor',
      status: 'Active'
    }
  });

  const doctorUser2 = await prisma.users.create({
    data: {
      user_id: 3,
      hospital_id: hospital.hospital_id,
      full_name: 'Dr. Sarah Smith',
      email: 'sarah.smith@sanjeevani.com',
      password_hash: passwordHash,
      role: 'doctor',
      status: 'Active'
    }
  });

  const patientUser = await prisma.users.create({
    data: {
      user_id: 4,
      hospital_id: hospital.hospital_id,
      full_name: 'Rahul Verma',
      email: 'rahul.verma@demo.com',
      password_hash: passwordHash,
      role: 'patient',
      status: 'Active'
    }
  });

  // 3. Departments
  const cardiology = await prisma.departments.create({
    data: {
      department_id: 1,
      hospital_id: hospital.hospital_id,
      department_name: 'Cardiology',
      location: 'Floor 1',
      daily_capacity: 50
    }
  });

  const neurology = await prisma.departments.create({
    data: {
      department_id: 2,
      hospital_id: hospital.hospital_id,
      department_name: 'Neurology',
      location: 'Floor 2',
      daily_capacity: 40
    }
  });

  // 4. Doctors
  const doctor1 = await prisma.doctors.create({
    data: {
      doctor_id: 1,
      user_id: doctorUser1.user_id,
      hospital_id: hospital.hospital_id,
      department_id: cardiology.department_id,
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD',
      experience_years: 10,
      rating: 4.8,
      availability_status: 'Active',
      phone: '1234567890',
      opd: 'OPD-1',
      schedule: 'Mon-Fri 09:00-17:00',
      bio: 'Experienced cardiologist.',
      focus: 'Interventional Cardiology'
    }
  });

  const doctor2 = await prisma.doctors.create({
    data: {
      doctor_id: 2,
      user_id: doctorUser2.user_id,
      hospital_id: hospital.hospital_id,
      department_id: neurology.department_id,
      specialization: 'Neurologist',
      qualification: 'MBBS, DM',
      experience_years: 8,
      rating: 4.9,
      availability_status: 'Active',
      phone: '9876543210',
      opd: 'OPD-2',
      schedule: 'Mon-Fri 10:00-18:00',
      bio: 'Expert in neurology.',
      focus: 'Brain disorders'
    }
  });

  // 5. Patient
  const patient = await prisma.patients.create({
    data: {
      patient_id: 1,
      hospital_id: hospital.hospital_id,
      user_id: patientUser.user_id,
      uhid: 'UHID-1001',
      full_name: 'Rahul Verma',
      age: 35,
      gender: 'Male',
      blood_group: 'O+',
      billing_status: 'Clear',
      patient_status: 'Active',
      email: 'rahul.verma@demo.com',
      phone: '555-0100'
    }
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error("Seed error:");
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
