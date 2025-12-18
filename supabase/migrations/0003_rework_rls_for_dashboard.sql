-- Rework RLS policies for students and transactions to be simpler and avoid recursion.
-- This is the definitive fix for the "infinite recursion" error on the dashboard.

-- Drop all relevant policies first to ensure the script is re-runnable.
DROP POLICY IF EXISTS "Users can manage their own students." ON public.students;
DROP POLICY IF EXISTS "Users can manage their own transactions." ON public.transactions;

-- === STUDENTS ===
-- A user can see/edit/delete students that are linked to their own user_id.
-- This is direct and doesn't require checking other tables in the policy.
CREATE POLICY "Users can manage their own students."
ON public.students
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- === TRANSACTIONS ===
-- A user can see/edit/delete transactions that are linked to their own user_id.
-- This is also direct and avoids complex joins in the security layer.
CREATE POLICY "Users can manage their own transactions."
ON public.transactions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
