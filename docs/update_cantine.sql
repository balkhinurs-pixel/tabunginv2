
-- SNIPPET PEMBARUAN SISTEM KANTIN & PERBAIKAN ROLE (UPDATE) --

-- 1. Bersihkan Data Role yang bermasalah (set default ADMIN untuk profil lama)
UPDATE public.profiles SET role = 'ADMIN' WHERE role IS NULL;

-- 2. Update CHECK constraint pada role untuk mendukung CANTINE
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('ADMIN', 'CANTINE'));

-- 3. Tambahkan kolom category pada transactions jika belum ada
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'transactions' AND column_name = 'category') THEN
        ALTER TABLE public.transactions ADD COLUMN category TEXT DEFAULT 'TABUNGAN';
    END IF;
END $$;

-- 4. Perbaiki Trigger handle_new_user agar TIDAK memaksakan role ADMIN
-- Ini supaya pengguna bisa memilih role sendiri di halaman Welcome
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Hanya buat profil untuk pengguna Guru/Kantin (Bukan akun bayangan siswa)
  IF (NEW.email NOT LIKE '%.supabase.user') THEN
    INSERT INTO public.profiles (id, email, plan)
    VALUES (NEW.id, NEW.email, 'TRIAL')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Perbarui kebijakan RLS agar Kantin bisa melihat siswa di sekolah yang sama
DROP POLICY IF EXISTS "Kantin can view students in their school" ON public.students;
CREATE POLICY "Kantin can view students in their school"
ON public.students
FOR SELECT
TO authenticated
USING (
  (SELECT school_code FROM public.profiles WHERE id = auth.uid()) = 
  (SELECT school_code FROM public.profiles WHERE id = public.students.user_id)
);

-- 6. Perbarui kebijakan RLS agar Kantin bisa memproses transaksi
DROP POLICY IF EXISTS "Kantin can create transactions" ON public.transactions;
CREATE POLICY "Kantin can create transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'CANTINE' OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
);
