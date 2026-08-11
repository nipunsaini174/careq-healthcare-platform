import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('Cleaning up old staff from Apollo Hospital (ID: 1)...');

  // Find all users for hospital_id = 1 except Admin1@gmail.com and patients
  const usersToDelete = await prisma.users.findMany({
    where: {
      hospital_id: 1n,
      email: { not: 'Admin1@gmail.com' },
      role: { not: 'patient' } // Don't delete patients
    }
  });

  console.log(`Found ${usersToDelete.length} old staff members to delete.`);

  for (const u of usersToDelete) {
    console.log(`Deleting ${u.role}: ${u.email}`);
    
    // 1. Delete from dependent tables based on role
    if (u.role.toLowerCase() === 'admin') {
      await prisma.admins.deleteMany({ where: { user_id: u.user_id } });
    } else if (u.role.toLowerCase() === 'doctor') {
      // Need to clean up doctor related stuff if any
      const doc = await prisma.doctors.findUnique({ where: { user_id: u.user_id } });
      if (doc) {
        await prisma.appointments.deleteMany({ where: { doctor_id: doc.doctor_id } });
        await prisma.consultations.deleteMany({ where: { doctor_id: doc.doctor_id } });
        await prisma.queue_tokens.deleteMany({ where: { doctor_id: doc.doctor_id } });
        await prisma.doctors.delete({ where: { doctor_id: doc.doctor_id } });
      }
    } else if (u.role.toLowerCase() === 'receptionist') {
      await prisma.receptionists.deleteMany({ where: { user_id: u.user_id } });
    }

    // 2. Delete from users table
    await prisma.users.delete({ where: { user_id: u.user_id } });

    // 3. Delete from Supabase Auth
    // We need to find the user in Supabase Auth by email
    let authUserId = null;
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data.users || data.users.length === 0) break;
      const match = data.users.find((su: any) => su.email?.toLowerCase() === u.email.toLowerCase());
      if (match) {
        authUserId = match.id;
        break;
      }
      page++;
    }

    if (authUserId) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      console.log(`Deleted ${u.email} from Supabase Auth.`);
    } else {
      console.log(`${u.email} not found in Supabase Auth.`);
    }
  }

  console.log('Old staff cleanup complete. Only Admin1@gmail.com remains as admin.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
