-- supabase/migrations/0002_fix_rls_policies.sql
-- Fixes recursive Row Level Security (RLS) policies and makes the script re-runnable.

-- Drop ALL potentially problematic policies first, using IF EXISTS to avoid errors on a clean DB.
-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- STUDENTS
DROP POLICY IF EXISTS "Users can manage their own students." ON public.students;
DROP POLICY IF EXISTS "Students can view their own profile." ON public.students;

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users can manage transactions for their students." ON public.transactions;
DROP POLICY IF EXISTS "Students can view their own transactions." ON public.transactions;

-- ACTIVATION CODES
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.activation_codes;


-- Recreate policies with correct, non-recursive logic.

-- === PROFILES ===
-- 1. Users can view their own profile.
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 2. Users can update their own profile.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);


-- === STUDENTS ===
-- 1. Teacher/Admins can manage students they created.
CREATE POLICY "Users can manage their own students."
ON public.students FOR ALL
USING (auth.uid() = user_id);

-- 2. Students can view their own profile/data (but not others).
CREATE POLICY "Students can view their own profile."
ON public.students FOR SELECT
USING (auth.uid() = id);


-- === TRANSACTIONS ===
-- 1. Teacher/Admins can manage transactions for the students they own.
-- This checks if the user_id of the student related to the transaction matches the current user.
CREATE POLICY "Users can manage transactions for their students."
ON public.transactions FOR ALL
USING (
  (
    SELECT user_id FROM public.students
    WHERE id = transactions.student_id
  ) = auth.uid()
);

-- 2. Students can view their own transactions.
CREATE POLICY "Students can view their own transactions."
ON public.transactions FOR SELECT
USING (auth.uid() = student_id);

-- === ACTIVATION CODES ===
-- 1. Allow authenticated users to read activation codes (for activation process).
CREATE POLICY "Enable read access for authenticated users"
ON public.activation_codes FOR SELECT
USING (auth.role() = 'authenticated');
