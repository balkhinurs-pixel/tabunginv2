-- ========================================================
-- TABUNGIN DATABASE BLUEPRINT (Final Solid Version)
-- Gunakan file ini di SQL Editor Supabase Proyek Baru
-- ========================================================

-- 1. BERSIHKAN SKEMA LAMA (Gunakan dengan hati-hati pada database produksi)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.transactions;
-- DROP TABLE IF EXISTS public.students;
-- DROP TABLE IF EXISTS public.activation_codes;
-- DROP TABLE IF EXISTS public.profiles;

-- 2. TABEL PROFIL (GURU/ADMIN)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    school_name TEXT,
    school_code TEXT UNIQUE,
    plan TEXT DEFAULT 'TRIAL' CHECK (plan IN ('TRIAL', 'PRO')),
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    custom_quota INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL SISWA
CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    nis TEXT NOT NULL,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    whatsapp_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(nis, user_id) -- NIS harus unik di dalam satu sekolah (guru) yang sama
);

-- 4. TABEL TRANSAKSI
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL CHECK (amount >= 0),
    type TEXT NOT NULL CHECK (type IN ('Pemasukan', 'Pengeluaran')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL KODE AKTIVASI
CREATE TABLE public.activation_codes (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES public.profiles(id),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. AKTIFKAN RLS (ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- 7. KEBIJAKAN (POLICIES) - PROFILES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 8. KEBIJAKAN (POLICIES) - STUDENTS
CREATE POLICY "Teachers can manage their own students" ON public.students FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Students can view their own record" ON public.students FOR SELECT USING (auth.uid() = id);

-- 9. KEBIJAKAN (POLICIES) - TRANSACTIONS
CREATE POLICY "Teachers can manage their students transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Students can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = student_id);

-- 10. KEBIJAKAN (POLICIES) - ACTIVATION CODES
CREATE POLICY "Admins can manage activation codes" ON public.activation_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Users can view activation codes" ON public.activation_codes FOR SELECT USING (true);

-- 11. FUNGSI OTOMATIS: PEMBUATAN PROFIL SAAT DAFTAR (CRITICAL FIX)
-- Fungsi ini HARUS memiliki SECURITY DEFINER untuk bisa menulis ke public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Hanya buat profil jika user BUKAN akun bayangan siswa (shadow email)
    IF NOT (NEW.email LIKE '%.supabase.user') THEN
        INSERT INTO public.profiles (id, email, plan, role)
        VALUES (NEW.id, NEW.email, 'TRIAL', 'USER');
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger untuk menjalankan fungsi di atas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. FUNGSI AKTIVASI AKUN PRO (RPC)
CREATE OR REPLACE FUNCTION public.activate_account(p_code TEXT, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Validasi kode
    IF EXISTS (SELECT 1 FROM public.activation_codes WHERE code = p_code AND is_used = false) THEN
        -- 2. Update profil ke PRO
        UPDATE public.profiles SET plan = 'PRO' WHERE id = p_user_id;
        -- 3. Tandai kode sudah terpakai
        UPDATE public.activation_codes 
        SET is_used = true, used_by = p_user_id, used_at = now() 
        WHERE code = p_code;
    ELSE
        RAISE EXCEPTION 'invalid_or_used_code';
    END IF;
END;
$$;

-- ========================================================
-- BAGIAN PERBAIKAN (Hanya jalankan jika Anda sudah punya akun tapi profil tidak muncul)
-- Ganti 'email@anda.com' dengan email asli Anda
-- ========================================================
/*
INSERT INTO public.profiles (id, email, role, plan)
SELECT id, email, 'ADMIN', 'PRO'
FROM auth.users
WHERE email = 'email@anda.com'
ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', plan = 'PRO';
*/