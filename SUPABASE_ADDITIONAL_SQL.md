# Panduan Pembaruan Database Supabase (Tabungin V2)

Salin dan jalankan perintah SQL berikut di **Supabase SQL Editor** satu per satu untuk memastikan kolom dibuat dengan benar sebelum indeks ditambahkan.

### 1. Menambahkan Kolom Kategori & Status Settlement
Perintah ini wajib dijalankan pertama kali.

```sql
-- Tambahkan kolom category
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'TABUNGAN';

-- Tambahkan kolom is_settled
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT FALSE;
```

### 2. Membuat Indeks (Jalankan SETELAH langkah 1 berhasil)
Indeks ini digunakan untuk mempercepat performa laporan dan settlement.

```sql
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_is_settled ON public.transactions(is_settled);
```

### 3. Izin Akses Guru (RLS Policy)
Agar Guru bisa melihat transaksi siswanya yang dibuat oleh Kantin.

```sql
-- Hapus policy lama jika ada untuk menghindari konflik
DROP POLICY IF EXISTS "Teachers can view their managed students' transactions" ON public.transactions;

-- Buat policy baru
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

### 4. Sinkronisasi Data Lama (Opsional)
Jika Anda sudah memiliki transaksi sebelumnya, jalankan ini agar statusnya rapi.

```sql
UPDATE public.transactions 
SET category = 'TABUNGAN' 
WHERE category IS NULL;

UPDATE public.transactions 
SET is_settled = FALSE 
WHERE is_settled IS NULL;
```