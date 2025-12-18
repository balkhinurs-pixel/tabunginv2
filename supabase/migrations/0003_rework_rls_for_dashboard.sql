-- Drop existing policies on students and transactions to redefine them.
DROP POLICY IF EXISTS "Users can manage their own students." ON public.students;
DROP POLICY IF EXISTS "Users can view transactions in their own school." ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions for students in their school." ON public.transactions;


-- POLICY: Users can manage students that belong to them.
-- This is the main simplification. Instead of checking school_code, we just check if the student's user_id (the teacher/admin who created them) matches the current user.
CREATE POLICY "Users can manage their own students."
ON public.students
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- POLICY: Users can manage transactions that belong to them.
-- Similarly, a transaction is owned by the user who created it.
CREATE POLICY "Users can manage their own transactions."
ON public.transactions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
