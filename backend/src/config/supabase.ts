import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabasePublishableKey || !supabaseSecretKey) {
  console.warn("WARNING: Missing Supabase environment variables! Supabase Auth will fail.");
}

// Client for normal operations (e.g. signup, signin)
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Admin Client for secure operations (e.g. inviting users)
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
