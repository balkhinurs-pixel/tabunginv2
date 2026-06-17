
'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function getStudentKioskData(nis: string, schoolCode: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    // Kita gunakan admin client untuk melewati RLS secara aman di sisi server
    // Mencari siswa yang memiliki NIS tersebut dan terhubung ke profil guru dengan school_code yang sesuai
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(`
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

    // Hitung saldo dari riwayat transaksi yang ditemukan
    const balance = (data.transactions || []).reduce((acc: number, tx: any) => {
      return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
    }, 0);

    return {
      success: true,
      data: {
        name: data.name,
        class: data.class,
        balance: balance
      }
    };
  } catch (err) {
    console.error('Kiosk Action Unexpected Error:', err);
    return { success: false, message: 'Terjadi kesalahan sistem.' };
  }
}
