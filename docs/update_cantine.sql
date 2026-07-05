-- =========================================================
-- SNIPPET PEMBARUAN FITUR KANTIN (UPDATE ONLY)
-- Jalankan ini di SQL Editor Supabase jika sudah ada data lama
-- =========================================================

-- 1. Hapus constraint lama agar tidak bentrok (Menyelesaikan error 23514)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Tambahkan kembali constraint role dengan menyertakan 'CANTINE'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('ADMIN', 'CANTINE'));

-- 3. Tambahkan kolom category pada tabel transaksi jika belum ada
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'TABUNGAN';

-- 4. Tambahkan Aturan Keamanan (RLS) untuk Akun Kantin
-- Izinkan kantin melihat data siswa yang berada di kode sekolah yang sama
DROP POLICY IF EXISTS "Cantine can view students in same school" ON public.students;
CREATE POLICY "Cantine can view students in same school" ON public.students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles merchant
            JOIN public.profiles guru ON guru.school_code = merchant.school_code
            WHERE merchant.id = auth.uid()
            AND merchant.role = 'CANTINE'
            AND guru.id = students.user_id
        )
    );

-- Izinkan kantin untuk mencatat transaksi baru (pembayaran)
DROP POLICY IF EXISTS "Cantine can insert transactions" ON public.transactions;
CREATE POLICY "Cantine can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'CANTINE'
        )
    );

-- 5. Izinkan guru/admin untuk melihat transaksi kategori kantin di sekolah mereka
DROP POLICY IF EXISTS "Admins can view cantine transactions" ON public.transactions;
CREATE POLICY "Admins can view cantine transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
            AND profiles.id = transactions.user_id
        )
    );