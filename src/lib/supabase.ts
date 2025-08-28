import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Please add NEXT_PUBLIC_SUPABASE_URL to your environment variables.");
}

if (!supabaseAnonKey) {
  throw new Error("Supabase anon key not found. Please add NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
