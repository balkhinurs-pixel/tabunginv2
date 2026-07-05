'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/utils/supabase/server';

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
        
        if (error || !data) return { success: false, message: 'Siswa tidak ditemukan.' };

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
        return { success: false, message: 'Terjadi kesalahan sistem.' };
    }
}

export async function processCantinePayment(params: {
    studentId: string;
    nis: string;
    schoolCode: string;
    amount: number;
    pin: string;
}) {
    const { studentId, nis, schoolCode, amount, pin } = params;
    const supabaseAdmin = getSupabaseAdmin();
    
    try {
        // 1. Verifikasi PIN Siswa
        const shadowEmail = `${nis}@${schoolCode}.supabase.user`;
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: shadowEmail,
            password: pin
        });

        if (authError) return { success: false, message: 'PIN Siswa Salah.' };

        // 2. Cek Saldo & Hak Akses Merchant
        const { data: { user: merchant } } = await supabaseAdmin.auth.getUser(); // Ini salah, butuh auth merchant
        // Karena ini Server Action, kita pakai client standar untuk cek sesi merchant
        const { data: { user: activeMerchant } } = await createClient().auth.getUser();
        if (!activeMerchant) return { success: false, message: 'Sesi merchant berakhir.' };

        const { data: student, error: studentError } = await supabaseAdmin
            .from('students')
            .select('transactions(amount, type)')
            .eq('id', studentId)
            .single();

        if (studentError) return { success: false, message: 'Gagal memverifikasi saldo.' };

        const balance = (student.transactions || []).reduce((acc: number, tx: any) => {
            return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
        }, 0);

        if (amount > balance) return { success: false, message: 'Saldo Siswa Tidak Mencukupi.' };

        // 3. Catat Transaksi Belanja
        const { error: txError } = await supabaseAdmin.from('transactions').insert({
            student_id: studentId,
            user_id: activeMerchant.id,
            amount: amount,
            type: 'Pengeluaran',
            category: 'BELANJA_KANTIN',
            description: 'Pembayaran Kantin Digital'
        });

        if (txError) throw txError;

        // Logout sesi bayangan siswa agar tidak mengganggu merchant
        await supabase.auth.signOut();

        return { success: true, message: 'Pembayaran Berhasil.' };
    } catch (err) {
        return { success: false, message: 'Terjadi kesalahan internal.' };
    }
}
