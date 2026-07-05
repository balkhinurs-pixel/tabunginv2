# Panduan Pembaruan Database Supabase (Tabungin V2)

Salin dan jalankan seluruh blok kode di bawah ini sekaligus di **Supabase SQL Editor**. Skrip ini akan menambahkan kolom yang diperlukan, mempercepat performa dengan indeks, dan yang paling penting: **memperbaiki masalah sinkronisasi saldo antara Guru dan Siswa.**

```sql
-- ==========================================================
-- 1. TAMBAHKAN KOLOM (WAJIB)
-- ==========================================================
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'TABUNGAN',
ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT FALSE;

-- ==========================================================
-- 2. BUAT INDEKS (PERFORMA)
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_is_settled ON public.transactions(is_settled);

-- ==========================================================
-- 3. IZIN AKSES GURU (SANGAT WAJIB - UNTUK SINKRONISASI SALDO)
-- Agar Guru bisa melihat transaksi belanja siswanya di Kantin
-- ==========================================================
DROP POLICY IF EXISTS "Teachers can view their managed students' transactions" ON public.transactions;

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

-- ==========================================================
-- 4. SINKRONISASI DATA LAMA (OPSIONAL)
-- ==========================================================
UPDATE public.transactions SET category = 'TABUNGAN' WHERE category IS NULL;
UPDATE public.transactions SET is_settled = FALSE WHERE is_settled IS NULL;
```