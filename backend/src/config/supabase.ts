import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || 'placeholder-publishable-key';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || 'placeholder-secret-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY || !process.env.SUPABASE_SECRET_KEY) {
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
