
-- 1. Hapus aturan lama jika ada
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Tambahkan aturan baru yang mendukung ADMIN, CANTINE, dan USER
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('ADMIN', 'CANTINE', 'USER'));

-- 3. Ubah semua pengguna yang sudah ada menjadi 'USER' sementara (Sesuai permintaan)
UPDATE profiles SET role = 'USER';

-- 4. Perbarui fungsi trigger agar memberikan role 'USER' secara default saat pendaftaran
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, plan)
  VALUES (
    new.id,
    new.email,
    'USER', -- Default role sekarang adalah USER
    'TRIAL'
  );
  RETURN new;
END;
$$;

-- Pastikan trigger terpasang dengan benar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
