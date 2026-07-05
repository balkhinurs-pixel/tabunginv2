-- SNIPPET UPDATE FITUR KANTIN (AMAN UNTUK DATA LAMA)

-- 1. Hapus constraint lama agar kita bisa membersihkan data yang melanggar
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Bersihkan data: Jika ada role yang NULL atau isinya bukan ADMIN/CANTINE, set ke 'ADMIN'
-- Ini dilakukan agar langkah selanjutnya tidak error
UPDATE public.profiles 
SET role = 'ADMIN' 
WHERE role IS NULL OR role NOT IN ('ADMIN', 'CANTINE');

-- 3. Pasang kembali constraint yang sudah mendukung peran CANTINE
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('ADMIN', 'CANTINE'));

-- 4. Tambahkan kolom 'category' ke tabel transactions jika belum ada
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='transactions' AND column_name='category') THEN
        ALTER TABLE public.transactions ADD COLUMN category text DEFAULT 'TABUNGAN';
    END IF;
END $$;

-- 5. Update constraint category agar mendukung kategori belanja kantin
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_category_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_category_check CHECK (category IN ('TABUNGAN', 'BELANJA_KANTIN', 'TARIK_TUNAI'));

-- 6. Pastikan kolom 'custom_quota' juga tersedia (untuk keamanan migrasi)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='profiles' AND column_name='custom_quota') THEN
        ALTER TABLE public.profiles ADD COLUMN custom_quota integer DEFAULT NULL;
    END IF;
END $$;

-- 7. Isi kategori 'TABUNGAN' untuk semua transaksi lama yang masih kosong
UPDATE public.transactions SET category = 'TABUNGAN' WHERE category IS NULL;