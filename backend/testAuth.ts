import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing Supabase signup with url:', supabaseUrl);
  const { data, error } = await supabase.auth.signUp({
    email: 'testsupabasesignup@gmail.com',
    password: 'password123',
  });
  
  if (error) {
    console.error('SUPABASE ERROR:', error);
    console.error('ERROR MESSAGE:', error.message);
  } else {
    console.log('SUCCESS:', data);
  }
}

test();
