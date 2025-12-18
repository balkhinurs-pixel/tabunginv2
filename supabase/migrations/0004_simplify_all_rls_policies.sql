-- This is a definitive migration to fix all RLS policies and prevent recursion errors.

-- 1. Drop existing policies to ensure a clean slate.
-- Note: Dropping a policy that doesn't exist will throw an error without IF EXISTS.
DROP POLICY IF EXISTS "Users can manage their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can manage students in their school." ON public.students;
DROP POLICY IF EXISTS "Users can manage transactions in their school." ON public.transactions;
DROP POLICY IF EXISTS "Users can manage their own students." ON public.students;
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own profile data." ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.students;
DROP POLICY IF EXISTS "Enable read access for user based on user_id" ON public.students;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.students;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.students;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.transactions;
DROP POLICY IF EXISTS "Enable read access for user based on user_id" ON public.transactions;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.transactions;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.transactions;


-- 2. Create new, simplified, non-recursive policies.

-- PROFILES Table
-- Users can view and update their own profile.
CREATE POLICY "Users can manage their own profile." ON public.profiles
FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- STUDENTS Table
-- Users can do anything with students that are linked to their own user_id.
-- This is the most direct and secure way.
CREATE POLICY "Users can manage their own students." ON public.students
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS Table
-- Users can do anything with transactions that are linked to their own user_id.
CREATE POLICY "Users can manage their own transactions." ON public.transactions
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ACTIVATION_CODES Table (Assuming admins will manage this via service_role key, so no RLS needed for now for standard users)
-- If regular users need to read them, a policy would be added here. For now, it's safer to leave it admin-only.

-- 3. Ensure tables have RLS enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY; -- Enable it, but without policies, only service_role can access.

    