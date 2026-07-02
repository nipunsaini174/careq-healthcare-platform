import { PrismaClient } from '@prisma/client';
import { supabaseAdmin } from '../src/config/supabase.js';

// Force BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient();

async function syncAuth() {
  console.log('Syncing Prisma users to Supabase Auth...');
  
  const users = await prisma.users.findMany();
  
  for (const user of users) {
    console.log(`Syncing ${user.email} (${user.role})...`);
    
    // We default all passwords to 123456789 (the standard demo password)
    // because Supabase Auth hashes cannot be exported from the old project.
    // In a true production environment, users would use a 'Forgot Password' flow.
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: '123456789',
      email_confirm: true,
    });
    
    if (error) {
      if (error.message.includes('already')) {
        console.log(`  ✓ Already exists`);
      } else {
        console.error(`  ✗ Error: ${error.message}`);
      }
    } else {
      console.log(`  ✓ Created successfully`);
    }
  }

  console.log('\n✅ Supabase Auth sync complete!');
  await prisma.$disconnect();
}

syncAuth().catch(console.error);
