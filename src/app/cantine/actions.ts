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

        // Hitung saldo real-time
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
        // 1. Verifikasi PIN Siswa secara aman tanpa merusak sesi petugas kantin
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
            console.error('[PIN_VERIFY_ERROR]', authError.message);
            return { success: false, message: 'PIN Siswa Salah atau Akun tidak ditemukan.' };
        }

        // 2. Dapatkan identitas outlet kantin yang sedang login
        const { data: { user: activeMerchant } } = await supabaseUser.auth.getUser();
        if (!activeMerchant) return { success: false, message: 'Sesi outlet berakhir, silakan login ulang.' };

        // 3. Verifikasi saldo terakhir siswa melalui admin (bypass RLS)
        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('transactions(amount, type)')
            .eq('id', studentId)
            .single();

        if (studentError) return { success: false, message: 'Gagal memverifikasi saldo siswa.' };

        const currentBalance = (student.transactions || []).reduce((acc: number, tx: any) => {
            return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
        }, 0);

        if (amount > currentBalance) {
            return { success: false, message: `Saldo Tidak Cukup. Saldo Anda: Rp ${currentBalance.toLocaleString('id-ID')}` };
        }

        // 4. Catat Transaksi Pembayaran
        const { error: txError } = await supabaseAdmin.from('transactions').insert({
            student_id: studentId,
            user_id: activeMerchant.id,
            amount: amount,
            type: 'Pengeluaran',
            category: 'BELANJA_KANTIN',
            description: 'Pembayaran Kantin Digital'
        });

        if (txError) {
            console.error('[INSERT_TX_ERROR]', txError);
            throw txError;
        }

        // 5. Revalidasi menyeluruh agar data langsung sinkron di semua antarmuka
        revalidatePath('/cantine/outlet'); // Dashboard Kantin
        revalidatePath('/cantine/history'); // Riwayat Kantin
        revalidatePath('/dashboard'); // Dashboard Guru (Total Saldo)
        revalidatePath(`/profiles/${studentId}`); // Profil Siswa di sisi Guru
        revalidatePath('/home'); // Dashboard Siswa (Saldo Sendiri)

        return { success: true, message: 'Pembayaran Berhasil Diproses.' };
    } catch (err: any) {
        console.error('[POS_PAYMENT_ERROR]', err);
        return { success: false, message: 'Gagal memproses transaksi: ' + (err.message || 'Error internal') };
    }
}