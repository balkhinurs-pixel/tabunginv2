
-- =================================================================
-- MIGRATION TO FIX ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================
-- This script fixes the "infinite recursion" error by replacing
-- the existing policies with simpler, non-recursive ones.
-- You should run this script on your existing Supabase database.
-- =================================================================

-- -----------------------------------------------------------------
-- Step 1: Drop all existing policies for the tables.
-- This is necessary to avoid conflicts before creating new ones.
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

DROP POLICY IF EXISTS "Users can view students from their school." ON public.students;
DROP POLICY IF EXISTS "Users can insert students for their school." ON public.students;
DROP POLICY IF EXISTS "Users can update students from their school." ON public.students;
DROP POLICY IF EXISTS "Users can delete students from their school." ON public.students;
DROP POLICY IF EXISTS "Students can view their own profile." ON public.students;

DROP POLICY IF EXISTS "Users can view transactions in their school." ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their school." ON public.transactions;
DROP POLICY IF EXISTS "Users can delete transactions for their school." ON public.transactions;
DROP POLICY IF EXISTS "Students can view their own transactions." ON public.transactions;

DROP POLICY IF EXISTS "Allow authenticated users to read activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Allow admin to manage activation codes" ON public.activation_codes;

-- -----------------------------------------------------------------
-- Step 2: Recreate policies with corrected, non-recursive logic.
-- -----------------------------------------------------------------

-- === PROFILES ===
-- Users can view and update their OWN profile.
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid () = id);

CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid () = id)
  WITH CHECK (auth.uid () = id);


-- === STUDENTS ===
-- A user (teacher/admin) can manage students that are linked to their user ID.
CREATE POLICY "Users can manage their own students." ON public.students
  FOR ALL USING (auth.uid () = user_id);

-- A student can view their own student profile.
CREATE POLICY "Students can view their own profile." ON public.students
  FOR SELECT USING (auth.uid () = id);


-- === TRANSACTIONS ===
-- A user (teacher/admin) can manage transactions they have created.
CREATE POLICY "Users can manage their own transactions." ON public.transactions
  FOR ALL USING (auth.uid () = user_id);

-- A student can view their own transactions.
CREATE POLICY "Students can view their own transactions." ON public.transactions
  FOR SELECT USING (auth.uid () = student_id);


-- === ACTIVATION CODES ===
-- Any authenticated user can read activation codes (needed for the activation page).
CREATE POLICY "Allow authenticated users to read activation codes" ON public.activation_codes
  FOR SELECT USING (auth.role () = 'authenticated');
  
-- Admins can do anything with activation codes.
CREATE POLICY "Allow admin to manage activation codes" ON public.activation_codes
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

