-- ==========================================
-- SNIPPET UPDATE KHUSUS FITUR KANTIN
-- (Jalankan ini jika database sudah ada data)
-- ==========================================

-- 1. Tambahkan kolom category ke tabel transactions jika belum ada
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='category') THEN
        ALTER TABLE public.transactions ADD COLUMN category text DEFAULT 'TABUNGAN';
        -- Tambahkan constraint check
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_category_check 
        CHECK (category IN ('TABUNGAN', 'BELANJA_KANTIN', 'TARIK_TUNAI'));
    END IF;
END $$;

-- 2. Update Role pada tabel profiles untuk mendukung CANTINE
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('ADMIN', 'CANTINE'));

-- 3. Kebijakan RLS agar Kantin bisa melihat siswa di sekolah yang sama
DROP POLICY IF EXISTS "Cantine can view students in same school" ON public.students;
CREATE POLICY "Cantine can view students in same school" 
ON public.students FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'CANTINE' 
        AND p.school_code = (
            SELECT school_code FROM public.profiles WHERE id = public.students.user_id LIMIT 1
        )
    )
);

-- 4. Kebijakan RLS agar Kantin bisa memasukkan transaksi belanja
DROP POLICY IF EXISTS "Cantine can insert transactions" ON public.transactions;
CREATE POLICY "Cantine can insert transactions" 
ON public.transactions FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'CANTINE'
    )
);

-- 5. Kebijakan RLS agar Kantin bisa melihat riwayat penjualannya sendiri
DROP POLICY IF EXISTS "Cantine can view their own sales" ON public.transactions;
CREATE POLICY "Cantine can view their own sales" 
ON public.transactions FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- NOTIFIKASI: Pastikan Anda menjalankan ini di SQL Editor Supabase.