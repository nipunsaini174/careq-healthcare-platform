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
  console.log('Updating hospital ID from 2 to 1...');
  try {
    await prisma.$executeRaw`UPDATE hospitals SET hospital_id = 1 WHERE hospital_id = 2;`;
    console.log('Successfully updated hospital ID to 1.');
  } catch (err: any) {
    console.log('Could not update hospital ID, maybe it is already 1?', err.message);
  }

  const email = 'Admin1@gmail.com';
  const password = 'Admin@1';

  console.log('Creating admin in Supabase Auth...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
      console.log('User already exists in Supabase Auth, skipping creation...');
    } else {
      throw new Error(`Supabase Auth Error: ${authError.message}`);
    }
  } else {
    console.log('Created in Supabase Auth.');
  }

  console.log('Creating admin in database...');
  let dbUser = await prisma.users.findFirst({ where: { email } });
  if (dbUser) {
    dbUser = await prisma.users.update({
      where: { user_id: dbUser.user_id },
      data: { role: 'admin', hospital_id: 1n }
    });
  } else {
    dbUser = await prisma.users.create({
      data: {
        email,
        password_hash: 'SUPABASE_AUTH_DELEGATED',
        full_name: 'Admin',
        role: 'admin',
        hospital_id: 1n,
        status: 'active'
      }
    });
  }
  console.log('Created user record (ID: ' + dbUser.user_id + ')');

  // Upsert into admins table
  await prisma.admins.upsert({
    where: { user_id: dbUser.user_id },
    update: {
      hospital_id: 1n,
    },
    create: {
      user_id: dbUser.user_id,
      hospital_id: 1n,
      admin_level: 'Super Admin',
      permissions: { all: true }
    }
  });

  console.log('Created admin record. All done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
