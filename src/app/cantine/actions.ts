
'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

/**
 * Mengambil data ringkas siswa untuk divalidasi di layar POS kasir sebelum minta PIN.
 */
export async function getStudentDataForPayment(nis: string, schoolCode: string) {
    const supabaseAdmin = getSupabaseAdmin();
    try {
        const { data, error } = await supabaseAdmin
            .from('students')
            .select(`
                id, name, class, nis,
                transactions (amount, type),
                profiles:user_id!inner (school_code)
            `)
            .eq('nis', nis.trim())
            .eq('profiles.school_code', schoolCode.trim().toLowerCase())
            .single();
        
        if (error || !data) return { success: false, message: 'Siswa tidak ditemukan di sekolah ini.' };

        const balance = (data.transactions || []).reduce((acc: number, tx: any) => {
            return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
        }, 0);

        return {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                class: data.class,
                nis: data.nis,
                balance: balance,
                schoolCode: schoolCode.trim().toLowerCase()
            }
        };
    } catch (err) {
        return { success: false, message: 'Terjadi kesalahan sistem saat mencari data siswa.' };
    }
}

/**
 * Memproses pembayaran dari tabungan siswa ke outlet kantin.
 */
export async function processCantinePayment(params: {
    studentId: string;
    nis: string;
    schoolCode: string;
    amount: number;
    pin: string;
}) {
    const { studentId, nis, schoolCode, amount, pin } = params;
    const supabaseAdmin = getSupabaseAdmin();
    const supabaseUser = createClient();
    
    try {
        // 1. Verifikasi PIN menggunakan Client Tanpa Sesi
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
            return { success: false, message: 'PIN Siswa Salah.' };
        }

        // 2. Ambil data merchant aktif
        const { data: { user: activeMerchant } } = await supabaseUser.auth.getUser();
        if (!activeMerchant) return { success: false, message: 'Sesi outlet berakhir.' };

        // Ambil nama outlet dari email shadow merchant
        const merchantDisplayName = activeMerchant.email?.split('@')[0] || 'Kantin';

        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('transactions(amount, type)')
            .eq('id', studentId)
            .single();

        if (studentError) return { success: false, message: 'Gagal verifikasi saldo.' };

        const currentBalance = (student.transactions || []).reduce((acc: number, tx: any) => {
            return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
        }, 0);

        if (amount > currentBalance) {
            return { success: false, message: `Saldo Tidak Cukup (Sisa: Rp ${currentBalance.toLocaleString('id-ID')})` };
        }

        // 3. Masukkan transaksi dengan nama merchant dan status unsettled
        const { error: txError } = await supabaseAdmin.from('transactions').insert({
            student_id: studentId,
            user_id: activeMerchant.id,
            amount: amount,
            type: 'Pengeluaran',
            category: 'BELANJA_KANTIN',
            description: `Belanja: ${merchantDisplayName.toUpperCase()}`,
            is_settled: false
        });

        if (txError) throw txError;

        // Revalidasi Global agar Guru & Siswa langsung sinkron
        revalidatePath('/', 'layout'); 
        revalidatePath('/dashboard');
        revalidatePath('/home');
        revalidatePath(`/profiles/${studentId}`);

        return { success: true, message: 'Pembayaran Berhasil.' };
    } catch (err: any) {
        return { success: false, message: 'Gagal: ' + (err.message || 'Error internal') };
    }
}
