import { prisma } from './src/prisma/client.js';
import { supabaseAdmin } from './src/config/supabase.js';

async function seed() {
  const email = 'dhruvraj487@gmail.com';
  const password = 'Zepic@121122#';
  const fullName = 'Dhruv Receptionist';
  const role = 'RECEPTIONIST';

  try {
    console.log('1. Checking Supabase for user...');
    
    // Check if user exists in DB first to prevent duplicate
    const existingDbUser = await prisma.users.findFirst({ where: { email } });
    if (existingDbUser) {
      console.log('User already exists in PostgreSQL users table.');
    }

    // Try creating in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already exists') || authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        console.log('User already exists in Supabase. Updating password...');
        
        // Let's get the user ID
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listData && listData.users) {
          const user = listData.users.find(u => u.email === email);
          if (user) {
            await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
            console.log('Supabase password updated successfully.');
          }
        }
      } else {
        throw new Error(`Supabase Error: ${authError.message}`);
      }
    } else {
      console.log('User created in Supabase successfully.');
    }

    if (!existingDbUser) {
      console.log('2. Creating user in PostgreSQL users table...');
      await prisma.users.create({
        data: {
          email,
          password_hash: 'SUPABASE_AUTH_DELEGATED',
          full_name: fullName,
          role: role,
          hospital_id: 1n,
          status: 'active'
        }
      });
      console.log('PostgreSQL user created successfully.');
    }

    console.log('\n✅ Setup Complete! You can now login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('Failed to seed receptionist:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
