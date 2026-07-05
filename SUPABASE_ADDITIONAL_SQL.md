# Panduan Pembaruan Database Supabase (Tabungin V2)

Salin dan jalankan perintah SQL berikut di **Supabase SQL Editor** untuk mengaktifkan fitur Settlement Kantin, Mode Kios, dan sinkronisasi data Guru.

### 1. Menambahkan Kolom Baru pada Tabel Transactions
Perintah ini menambahkan kategori transaksi (agar bisa membedakan belanja kantin, ATM, atau tabungan biasa) dan status pembayaran ke merchant.

```sql
-- Tambahkan kolom category jika belum ada
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'TABUNGAN';

-- Tambahkan kolom is_settled untuk fitur pencairan dana kantin
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT FALSE;

-- Tambahkan indeks untuk mempercepat pencarian laporan
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_is_settled ON public.transactions(is_settled);
```

### 2. Membuka Izin Akses bagi Guru (RLS Policy)
Secara default, Supabase hanya mengizinkan penginput data untuk melihat data tersebut. Perintah ini "meruntuhkan" tembok itu agar Guru bisa melihat transaksi siswanya yang dibuat oleh Kantin atau Kios ATM (sinkronisasi saldo).

```sql
-- Hapus policy lama jika ada (opsional, untuk mencegah duplikasi)
DROP POLICY IF EXISTS "Teachers can view their managed students' transactions" ON public.transactions;

-- Buat policy baru: Guru bisa melihat SEMUA transaksi yang dilakukan oleh SISWA MILIKNYA
CREATE POLICY "Teachers can view their managed students' transactions" 
ON public.transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = transactions.student_id 
    AND students.user_id = auth.uid()
  )
);
```

### 3. Memastikan Integritas Data Merchant (Opsional)
Jika Anda ingin memastikan data merchant selalu bersih:

```sql
-- Memastikan kolom is_settled selalu bernilai FALSE untuk transaksi baru
ALTER TABLE public.transactions 
ALTER COLUMN is_settled SET DEFAULT FALSE;
```
