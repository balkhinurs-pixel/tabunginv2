
'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/utils/supabase/server';

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
        // 1. Verifikasi PIN menggunakan login (Shadow Email)
        const shadowEmail = `${nis}@${schoolCode}.supabase.user`;
        
        // Kita gunakan client standar untuk mencoba login (verifikasi PIN)
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: shadowEmail,
            password: pin
        });

        if (authError) {
            return { success: false, message: 'PIN yang Anda masukkan salah.' };
        }

        // 2. Cek Saldo Terkini
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
            user_id: student.user_id, // Gunakan user_id milik guru
            amount: amount,
            type: 'Pengeluaran',
            description: 'Tarik Tunai via Kios ATM'
        });

        if (txError) {
            return { success: false, message: 'Gagal memproses penarikan di database.' };
        }

        // Sign out agar tidak ada sesi tersisa di server
        await supabase.auth.signOut();

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
