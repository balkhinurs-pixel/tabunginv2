-- ### TABEL PENGGUNA & PROFIL ###
-- Tabel ini akan menyimpan informasi profil tambahan untuk pengguna.
-- Relasi 1-ke-1 dengan tabel auth.users.
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  plan TEXT DEFAULT 'TRIAL' NOT NULL -- Bisa 'TRIAL' atau 'PRO'
);

-- Kebijakan Keamanan untuk Tabel Profiles
-- Memastikan pengguna hanya bisa melihat dan mengedit profil mereka sendiri.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Fungsi ini akan dijalankan setiap kali ada pengguna baru mendaftar.
-- Ini akan membuat entri profil baru untuk pengguna tersebut.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger yang memanggil fungsi handle_new_user setiap kali ada user baru.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ### TABEL DATA UTAMA ###

-- Tipe enumerasi untuk jenis transaksi
CREATE TYPE transaction_type AS ENUM ('Pemasukan', 'Pengeluaran');

-- Tabel untuk menyimpan data siswa.
-- Setiap siswa terhubung dengan seorang pengguna (guru/admin sekolah).
CREATE TABLE students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nis TEXT NOT NULL,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Membuat NIS unik untuk setiap user_id, tapi bisa sama antar user yang berbeda.
    UNIQUE(user_id, nis)
);

-- Kebijakan Keamanan untuk Tabel Students
-- Pengguna hanya bisa melihat/mengelola siswa yang mereka buat.
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own students" ON students
    FOR ALL USING (auth.uid() = user_id);

-- Tabel untuk menyimpan semua transaksi yang terkait dengan siswa.
CREATE TABLE transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type transaction_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMTZ DEFAULT NOW()
);

-- Kebijakan Keamanan untuk Tabel Transactions
-- Pengguna hanya bisa melihat/mengelola transaksi milik siswa mereka.
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);


-- ### TABEL KODE AKTIVASI ###
CREATE TABLE activation_codes (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by uuid REFERENCES auth.users(id),
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kebijakan Keamanan untuk Tabel Activation Codes
-- Hanya pengguna terautentikasi yang dapat melihat kode (meskipun admin akan jadi satu-satunya yang melihatnya via UI).
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view codes" ON activation_codes FOR SELECT USING (auth.role() = 'authenticated');
-- Admin (atau peran khusus di masa depan) dapat mengelola kode. Untuk saat ini, dibatasi.
-- Di aplikasi nyata, Anda akan membuat peran 'admin' dan kebijakan yang lebih ketat.
CREATE POLICY "Admins can manage codes" ON activation_codes FOR ALL USING (
  -- Untuk saat ini, kita bisa membatasi berdasarkan email admin untuk keamanan sederhana
  auth.uid() IN (SELECT id FROM profiles WHERE email LIKE '%@admin.com%')
);


-- ### FUNGSI DATABASE (RPC) ###

-- Fungsi untuk mengaktifkan akun pengguna ke PRO
CREATE OR REPLACE FUNCTION activate_account(p_code TEXT, p_user_id uuid)
RETURNS TABLE(status TEXT, message TEXT) AS $$
DECLARE
    v_code_id BIGINT;
    v_is_used BOOLEAN;
BEGIN
    -- 1. Cari kode dan kunci untuk pembaruan
    SELECT id, is_used INTO v_code_id, v_is_used
    FROM public.activation_codes
    WHERE code = p_code
    FOR UPDATE;

    -- 2. Cek jika kode ada
    IF v_code_id IS NULL THEN
        RETURN QUERY SELECT 'error'::TEXT, 'Kode aktivasi tidak valid.'::TEXT;
        RETURN;
    END IF;

    -- 3. Cek jika kode sudah digunakan
    IF v_is_used THEN
        RETURN QUERY SELECT 'error'::TEXT, 'Kode aktivasi ini telah digunakan.'::TEXT;
        RETURN;
    END IF;

    -- 4. Update profil pengguna menjadi 'PRO'
    UPDATE public.profiles
    SET plan = 'PRO'
    WHERE id = p_user_id;

    -- 5. Tandai kode sebagai telah digunakan
    UPDATE public.activation_codes
    SET 
        is_used = TRUE,
        used_by = p_user_id,
        used_at = NOW()
    WHERE id = v_code_id;

    RETURN QUERY SELECT 'success'::TEXT, 'Akun berhasil diaktivasi ke PRO.'::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 'error'::TEXT, 'Terjadi kesalahan internal.'::TEXT;
END;
$$ LANGUAGE plpgsql;
