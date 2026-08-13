import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const hospital = await prisma.hospitals.findUnique({ where: { hospital_id: 1n } });
    if (!hospital) {
      console.log("No hospital 1");
      return;
    }

    const dept = "Test Dept";
    let department = await prisma.departments.findFirst({
      where: { department_name: dept, hospital_id: hospital.hospital_id }
    });

    if (!department) {
      department = await prisma.departments.create({
        data: {
          hospital_id: hospital.hospital_id,
          department_name: dept,
          location: "Main Building",
          daily_capacity: 50
        }
      });
    }

    const newDoc = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          hospital_id: hospital.hospital_id,
          full_name: "Dr. Test Node",
          email: "testnode@demo.com",
          password_hash: "SUPABASE_AUTH_DELEGATED",
          role: "DOCTOR",
          status: "active"
        }
      });

      return tx.doctors.create({
        data: {
          user_id: user.user_id,
          hospital_id: hospital.hospital_id,
          department_id: department.department_id,
          specialization: "General",
          qualification: "MD",
          experience_years: 5,
          rating: 5.0,
          availability_status: "Available",
          phone: "12345",
          opd: "A-1",
          schedule: "9-5",
          bio: "Test bio",
          focus: "Test focus",
          awards: "None"
        }
      });
    });

    console.log("SUCCESS:", newDoc);
  } catch (err) {
    console.error("FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
