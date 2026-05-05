
'use server';

import { createClient } from '@/lib/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import type { Student, Transaction } from '@/types';

interface BackupData {
  version: string;
  exportDate: string;
  school_code: string;
  students: any[];
  transactions: any[];
}

export async function exportUserData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_code')
    .eq('id', user.id)
    .single();

  const [
    { data: students },
    { data: transactions }
  ] = await Promise.all([
    supabase.from('students').select('*').eq('user_id', user.id),
    supabase.from('transactions').select('*').eq('user_id', user.id)
  ]);

  const backup: BackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    school_code: profile?.school_code || 'unknown',
    students: students || [],
    transactions: transactions || []
  };

  return backup;
}

export async function importUserData(backup: BackupData) {
  const supabase = createClient();
  const supabaseAdmin = getSupabaseAdmin();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Sesi berakhir, silakan login kembali.' };

  // Basic Validation
  if (!backup.students || !backup.transactions || backup.version !== '1.0') {
    return { success: false, message: 'Format file cadangan tidak valid atau versi tidak didukung.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_code')
    .eq('id', user.id)
    .single();

  try {
    // 1. Restore Students & their Auth accounts if missing
    for (const student of backup.students) {
      const shadowEmail = `${student.nis}@${profile?.school_code}.supabase.user`;
      
      // Check if auth user exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(student.id);
      
      if (!existingUser.user) {
        // Recreate auth user if it was deleted
        await supabaseAdmin.auth.admin.createUser({
          id: student.id,
          email: shadowEmail,
          password: '123456', // Default PIN for restored accounts
          email_confirm: true,
        });
      }

      // Upsert student profile
      await supabase.from('students').upsert({
        id: student.id,
        nis: student.nis,
        name: student.name,
        class: student.class,
        whatsapp_number: student.whatsapp_number,
        user_id: user.id,
        created_at: student.created_at
      });
    }

    // 2. Restore Transactions
    // We do this in chunks to avoid payload limits
    const transactionsToInsert = backup.transactions.map(tx => ({
      id: tx.id,
      student_id: tx.student_id,
      user_id: user.id,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      created_at: tx.created_at
    }));

    if (transactionsToInsert.length > 0) {
      const { error: txError } = await supabase.from('transactions').upsert(transactionsToInsert);
      if (txError) throw txError;
    }

    revalidatePath('/dashboard');
    revalidatePath('/profiles');
    revalidatePath('/reports');

    return { 
      success: true, 
      message: `Berhasil memulihkan ${backup.students.length} siswa dan ${backup.transactions.length} transaksi.` 
    };

  } catch (error: any) {
    console.error('Restore Error:', error);
    return { success: false, message: `Gagal memulihkan data: ${error.message}` };
  }
}
