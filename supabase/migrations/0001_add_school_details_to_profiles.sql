-- 1. Add the new columns to the 'profiles' table.
-- We use "text" as the type, and it's recommended to add a reasonable character limit in production.
ALTER TABLE public.profiles
ADD COLUMN school_name text,
ADD COLUMN school_code text;

-- 2. Add a UNIQUE constraint to the 'school_code' column.
-- This is crucial to prevent two schools from having the same unique code.
-- The app relies on this constraint to give feedback to the user.
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_school_code_unique UNIQUE (school_code);

-- 3. Re-enable Row Level Security (RLS) and define policies.
-- This ensures that users can only update their OWN profile.

-- First, ensure RLS is enabled on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to avoid conflicts.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create new policies:

-- POLICY: Allow public read access for authenticated users.
-- This allows parts of the app to read basic profile info if needed.
CREATE POLICY "Public profiles are viewable by authenticated users."
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- POLICY: Allow users to insert their own profile record.
-- The user's ID from Supabase Auth must match the 'id' column in the 'profiles' table.
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- POLICY: Allow users to update their own profile record.
-- This is the most important policy for the settings page. It allows a logged-in user
-- to update a row in 'profiles' only if the 'id' of that row matches their own user ID.
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant usage on the schema to the 'service_role' (needed for admin functions like creating users)
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant all permissions on the profiles table to the necessary roles
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;

-- Inform the user how to run this script.
-- After this file is created, please copy its content and execute it in your
-- Supabase project's SQL Editor to apply the database changes.
