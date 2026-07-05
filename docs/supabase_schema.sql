-- ==========================================
-- TABUNGIN DATABASE BLUEPRINT
-- Gunakan file ini di SQL Editor Supabase Anda
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES DEFINITIONS

-- Tabel Profiles (Untuk Guru/Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE,
  plan TEXT DEFAULT 'TRIAL' CHECK (plan IN ('TRIAL', 'PRO')),
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  school_name TEXT,
  school_code TEXT UNIQUE,
  custom_quota INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel Students (Untuk Data Santri)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  nis TEXT NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  whatsapp_number TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Guru yang mendaftarkan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(nis, user_id)
);

-- Tabel Transactions (Riwayat Setoran/Penarikan)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Guru penanggung jawab
  amount BIGINT NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('Pemasukan', 'Pengeluaran')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel Activation Codes (Sistem Premium)
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES

-- Profiles: Pengguna bisa melihat dan mengupdate profilnya sendiri
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Admin Policy
CREATE POLICY "Admins can do everything on profiles" ON public.profiles 
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Students: Guru bisa melihat & mengelola muridnya. Murid bisa melihat datanya sendiri.
CREATE POLICY "Teachers can manage their students" ON public.students 
FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Students can view their own profile" ON public.students 
FOR SELECT USING (auth.uid() = id);

-- Transactions: Guru bisa melihat & mengelola transaksi muridnya. Murid bisa melihat transaksinya sendiri.
CREATE POLICY "Teachers can manage transactions" ON public.transactions 
FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Students can view their transactions" ON public.transactions 
FOR SELECT USING (auth.uid() = student_id);

-- Activation Codes: Hanya Admin yang bisa mengelola kode. Guru bisa melihat kode saat aktivasi.
CREATE POLICY "Admins manage codes" ON public.activation_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Users can view codes during activation" ON public.activation_codes FOR SELECT USING (true);

-- 5. FUNCTIONS & TRIGGERS

-- Fungsi otomatis membuat profil saat Guru mendaftar (SignUp)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Jangan buat profil publik untuk akun bayangan siswa (.supabase.user)
  IF (NEW.email NOT LIKE '%.supabase.user') THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'USER');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang Trigger ke Auth.Users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fungsi Aktivasi Akun PRO via RPC
CREATE OR REPLACE FUNCTION public.activate_account(p_code TEXT, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    code_record RECORD;
BEGIN
    -- Cek validitas kode
    SELECT * INTO code_record FROM public.activation_codes 
    WHERE code = p_code AND is_used = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_or_used_code';
    END IF;

    -- Update Akun Guru ke PRO
    UPDATE public.profiles SET plan = 'PRO' WHERE id = p_user_id;

    -- Tandai kode sudah digunakan
    UPDATE public.activation_codes 
    SET is_used = TRUE, used_by = p_user_id, used_at = now() 
    WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. PERBAIKAN UNTUK AKUN YANG SUDAH TERDAFTAR
-- Jika Anda sudah signup tapi profil belum ada, jalankan baris di bawah ini:
-- Ganti 'EMAIL_ANDA' dengan email yang Anda gunakan mendaftar.
-- ==========================================
/*
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'ADMIN' FROM auth.users 
WHERE email = 'EMAIL_ANDA'
ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';
*/