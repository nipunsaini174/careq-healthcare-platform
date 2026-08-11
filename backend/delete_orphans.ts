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
  console.log('Fetching all users from Supabase Auth...');
  
  let allSupabaseUsers: any[] = [];
  let page = 1;
  const PER_PAGE = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) {
      console.error('Error fetching Supabase users:', error);
      break;
    }
    
    if (data.users && data.users.length > 0) {
      allSupabaseUsers = allSupabaseUsers.concat(data.users);
      page++;
    } else {
      break;
    }
  }

  console.log(`Found ${allSupabaseUsers.length} users in Supabase Auth.`);

  console.log('Fetching all users from database (public.users)...');
  const dbUsers = await prisma.users.findMany({ select: { email: true } });
  const dbEmails = new Set(dbUsers.map(u => u.email.toLowerCase()));

  console.log(`Found ${dbEmails.size} users in database.`);

  let deletedCount = 0;

  for (const authUser of allSupabaseUsers) {
    if (authUser.email && !dbEmails.has(authUser.email.toLowerCase())) {
      console.log(`Deleting orphaned Supabase Auth user: ${authUser.email}`);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      if (error) {
        console.error(`Failed to delete ${authUser.email}:`, error);
      } else {
        deletedCount++;
      }
    }
  }

  console.log(`Successfully deleted ${deletedCount} orphaned users from Supabase Auth.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
