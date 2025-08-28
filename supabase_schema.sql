-- Skema Database untuk Aplikasi Tabungan Siswa di Supabase

-- 1. Buat tipe data custom untuk jenis transaksi
-- Ini memastikan bahwa kolom 'type' hanya bisa berisi nilai 'Pemasukan' atau 'Pengeluaran'.
CREATE TYPE public.transaction_type AS ENUM ('Pemasukan', 'Pengeluaran');

-- 2. Buat tabel untuk data siswa (students)
-- Tabel ini akan menyimpan informasi dasar dari setiap siswa.
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Kunci utama unik untuk setiap siswa
    nis TEXT NOT NULL UNIQUE,                       -- Nomor Induk Siswa, harus unik
    name TEXT NOT NULL,                             -- Nama lengkap siswa
    class TEXT NOT NULL,                            -- Kelas siswa
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL -- Waktu data dibuat
);

-- Tambahkan komentar untuk menjelaskan tabel
COMMENT ON TABLE public.students IS 'Menyimpan data profil siswa.';


-- 3. Buat tabel untuk data transaksi (transactions)
-- Tabel ini akan menyimpan semua catatan transaksi yang terkait dengan siswa.
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                        -- Kunci utama unik untuk setiap transaksi
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, -- Kunci asing yang terhubung ke tabel siswa. Jika siswa dihapus, transaksinya juga terhapus (ON DELETE CASCADE).
    date TIMESTAMP WITH TIME ZONE NOT NULL,                               -- Tanggal dan waktu transaksi terjadi
    type public.transaction_type NOT NULL,                                -- Jenis transaksi (Pemasukan / Pengeluaran)
    description TEXT NOT NULL,                                            -- Keterangan singkat mengenai transaksi
    amount NUMERIC NOT NULL CHECK (amount >= 0),                          -- Jumlah uang, tidak boleh negatif
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL -- Waktu data dibuat
);

-- Tambahkan komentar untuk menjelaskan tabel
COMMENT ON TABLE public.transactions IS 'Menyimpan riwayat transaksi untuk setiap siswa.';

-- 4. Aktifkan Row Level Security (RLS)
-- Ini adalah langkah keamanan penting di Supabase.
-- Secara default, ini akan memblokir semua akses ke tabel.
-- Anda harus membuat 'policies' untuk mengizinkan akses (SELECT, INSERT, UPDATE, DELETE).
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Contoh Policy (Kebijakan Akses):
-- Izinkan semua pengguna yang terautentikasi untuk membaca semua data siswa.
-- Anda mungkin ingin membuat aturan yang lebih ketat sesuai kebutuhan.
-- CREATE POLICY "Allow authenticated read access to students"
-- ON public.students FOR SELECT
-- TO authenticated
-- USING (true);

-- CREATE POLICY "Allow authenticated read access to transactions"
-- ON public.transactions FOR SELECT
-- TO authenticated
-- USING (true);

-- CREATE POLICY "Allow users to insert their own transactions"
-- ON public.transactions FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = student_id); -- Contoh jika Anda menghubungkan 'student_id' dengan user id di Supabase Auth

-- 5. Buat Indeks (Indexes) untuk Performa
-- Indeks mempercepat query pada kolom yang sering digunakan untuk pencarian atau filter.
CREATE INDEX idx_student_id ON public.transactions(student_id);
CREATE INDEX idx_nis ON public.students(nis);
