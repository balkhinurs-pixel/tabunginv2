'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function getStudentKioskData(nis: string, schoolCode: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        name,
        class,
        transactions (
          amount,
          type
        ),
        profiles:user_id!inner (
          school_code
        )
      `)
      .eq('nis', nis.trim())
      .eq('profiles.school_code', schoolCode.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Kiosk Action Database Error:', error);
      return { success: false, message: 'Gagal mengakses database.' };
    }

    if (!data) {
      return { success: false, message: 'Siswa tidak ditemukan di sekolah ini.' };
    }

    const balance = (data.transactions || []).reduce((acc: number, tx: any) => {
      return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
    }, 0);

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        class: data.class,
        balance: balance,
        nis: nis.trim(),
        schoolCode: schoolCode.trim().toLowerCase()
      }
    };
  } catch (err) {
    console.error('Kiosk Action Unexpected Error:', err);
    return { success: false, message: 'Terjadi kesalahan sistem.' };
  }
}

export async function processKioskWithdrawal(params: {
    studentId: string;
    nis: string;
    schoolCode: string;
    pin: string;
    amount: number;
}) {
    const { studentId, nis, schoolCode, pin, amount } = params;
    const supabaseAdmin = getSupabaseAdmin();
    
    try {
        // 1. Verifikasi PIN menggunakan Non-Persisting Client (Tanpa merusak cookie)
        const authVerifier = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        const shadowEmail = `${nis}@${schoolCode.toLowerCase()}.supabase.user`;
        const { error: authError } = await authVerifier.auth.signInWithPassword({
            email: shadowEmail,
            password: pin
        });

        if (authError) {
            return { success: false, message: 'PIN yang Anda masukkan salah.' };
        }

        // 2. Cek Saldo Terkini via Admin (Bypass RLS)
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select(`
                user_id,
                transactions (amount, type)
            `)
            .eq('id', studentId)
            .single();
        
        if (studentError || !student) {
            return { success: false, message: 'Gagal memverifikasi data siswa.' };
        }

        const currentBalance = (student.transactions || []).reduce((acc: number, tx: any) => {
            return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
        }, 0);

        if (amount > currentBalance) {
            return { success: false, message: 'Saldo Anda tidak mencukupi untuk penarikan ini.' };
        }

        // 3. Catat Transaksi Penarikan
        const { error: txError } = await supabaseAdmin.from('transactions').insert({
            student_id: studentId,
            user_id: student.user_id, // Terikat ke Guru yang bersangkutan
            amount: amount,
            type: 'Pengeluaran',
            category: 'TARIK_TUNAI',
            description: 'Tarik Tunai via Kios ATM'
        });

        if (txError) {
            console.error('[KIOS_INSERT_TX_ERROR]', txError);
            return { success: false, message: 'Gagal memproses penarikan di database.' };
        }

        // 4. Sinkronisasi Global (Hapus Cache di semua dashboard terkait)
        revalidatePath('/dashboard'); // Dashboard Guru
        revalidatePath(`/profiles/${studentId}`); // Profil Siswa di sisi Guru
        revalidatePath('/home'); // Dashboard Siswa

        return { 
            success: true, 
            message: 'Penarikan berhasil!',
            newBalance: currentBalance - amount
        };

    } catch (err) {
        console.error('Kiosk Withdrawal Error:', err);
        return { success: false, message: 'Terjadi kesalahan internal.' };
    }
}