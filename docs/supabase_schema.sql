-- CEK POIN SKEMA DATABASE TABUNGIN
-- Gunakan skrip ini di SQL Editor Supabase untuk membangun ulang database dari nol.

-- 1. TABEL PROFIL (GURU / ADMIN)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    plan TEXT DEFAULT 'TRIAL' CHECK (plan IN ('TRIAL', 'PRO')),
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    school_name TEXT,
    school_code TEXT UNIQUE,
    custom_quota INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL SISWA
CREATE TABLE public.students (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nis TEXT NOT NULL,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    whatsapp_number TEXT,
    user_id UUID REFERENCES public.profiles(id) NOT NULL, -- ID Guru/Admin pembuat
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(nis, user_id) -- Mencegah NIS ganda di satu sekolah
);

-- 3. TABEL TRANSAKSI
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Pemasukan', 'Pengeluaran')),
    description TEXT,
    amount BIGINT NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL -- Guru yang menginput
);

-- 4. TABEL KODE AKTIVASI PREMIUM
CREATE TABLE public.activation_codes (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES public.profiles(id),
    used_at TIMESTAMP WITH TIME ZONE
);

-- 5. TRIGGER OTOMATIS CREATE PROFILE SAAT SIGNUP
-- Fungsi untuk membuat baris di public.profiles saat user baru daftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, plan)
  VALUES (new.id, new.email, 'USER', 'TRIAL');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. FUNGSI RPC: AKTIVASI AKUN PRO
CREATE OR REPLACE FUNCTION public.activate_account(p_code TEXT, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Validasi kode
    IF EXISTS (SELECT 1 FROM public.activation_codes WHERE code = p_code AND is_used = false) THEN
        -- Update tabel profil
        UPDATE public.profiles SET plan = 'PRO' WHERE id = p_user_id;
        -- Tandai kode sudah digunakan
        UPDATE public.activation_codes 
        SET is_used = true, used_by = p_user_id, used_at = now() 
        WHERE code = p_code;
    ELSE
        RAISE EXCEPTION 'invalid_or_used_code';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. KEAMANAN RLS (ROW LEVEL SECURITY)

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Kebijakan Tabel Profil
CREATE POLICY "Pengguna bisa melihat profil sendiri" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Pengguna bisa update profil sendiri" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin bisa melihat semua profil" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Kebijakan Tabel Siswa
CREATE POLICY "Guru bisa melihat siswanya" ON public.students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Guru bisa mengelola siswanya" ON public.students FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Siswa bisa melihat profilnya sendiri" ON public.students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin bisa melihat semua siswa" ON public.students FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Kebijakan Tabel Transaksi
CREATE POLICY "Guru bisa melihat transaksi siswanya" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Guru bisa menginput transaksi" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Guru bisa menghapus transaksi siswanya" ON public.transactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Siswa bisa melihat transaksinya sendiri" ON public.transactions FOR SELECT USING (auth.uid() = student_id);

-- Kebijakan Tabel Kode Aktivasi
CREATE POLICY "Hanya Admin yang bisa mengelola kode" ON public.activation_codes FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "User bisa cek kode untuk aktivasi" ON public.activation_codes FOR SELECT USING (true);
