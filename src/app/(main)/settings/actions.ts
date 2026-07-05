
'use server';

import { createClient } from '@/lib/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

interface ActionResult {
  success: boolean;
  message: string;
}

export async function addCantineAction(params: {
  cantineId: string;
  pin: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const supabaseAdmin = getSupabaseAdmin();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Sesi berakhir, silakan login kembali.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_code')
    .eq('id', user.id)
    .single();

  if (!profile?.school_code) {
    return { success: false, message: 'Mohon atur ulang Kode Sekolah Anda di tab Umum terlebih dahulu.' };
  }

  // Sanitasi ID Kantin: huruf kecil, tanpa spasi/karakter aneh
  const sanitizedId = params.cantineId.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  
  if (!sanitizedId || sanitizedId.length < 3) {
      return { success: false, message: 'ID Kantin tidak valid (min. 3 karakter).' };
  }

  // PENTING: Sanitasi Kode Sekolah untuk email (menghindari spasi yang bikin email tidak valid)
  const schoolCode = profile.school_code.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const shadowEmail = `${sanitizedId}@${schoolCode}.kantin.user`;

  console.log(`[CANTINE_CREATE] Mencoba membuat akun: ${shadowEmail}`);

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: shadowEmail,
      password: params.pin,
      email_confirm: true,
      user_metadata: { role: 'CANTINE', school_code: schoolCode }
    });

    if (authError) {
      console.error('[CANTINE_AUTH_ERROR]', authError);
      if (authError.message.includes('unique') || authError.message.includes('already exists')) {
        return { success: false, message: `ID Kantin "${sanitizedId}" sudah terdaftar di sekolah ini.` };
      }
      return { success: false, message: `Gagal Auth: ${authError.message}` };
    }

    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: shadowEmail,
          school_name: 'Outlet Kantin',
          school_code: schoolCode,
          role: 'CANTINE',
          plan: 'TRIAL'
        });

      if (profileError) {
        console.error('[CANTINE_PROFILE_ERROR]', profileError);
        // Rollback auth user jika profil gagal dibuat
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return { success: false, message: `Gagal Profile: ${profileError.message}` };
      }
    }

    revalidatePath('/settings');
    return { success: true, message: `Akun outlet "${sanitizedId}" berhasil dibuat.` };
  } catch (error: any) {
    console.error('[CANTINE_FATAL_ERROR]', error);
    return { success: false, message: error.message || 'Terjadi kesalahan sistem internal.' };
  }
}

export async function deleteCantineAction(cantineUserId: string): Promise<ActionResult> {
  const supabaseAdmin = getSupabaseAdmin();
  try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(cantineUserId);
      if (error) throw error;
      
      revalidatePath('/settings');
      return { success: true, message: 'Akun outlet berhasil dihapus.' };
  } catch (err: any) {
      console.error('[CANTINE_DELETE_ERROR]', err);
      return { success: false, message: err.message };
  }
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

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    school_code: profile?.school_code || 'unknown',
    students: students || [],
    transactions: transactions || []
  };
}

export async function importUserData(backup: any) {
  const supabase = createClient();
  const supabaseAdmin = getSupabaseAdmin();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Sesi berakhir.' };
  if (!backup.students || !backup.transactions) return { success: false, message: 'Format tidak valid.' };

  const { data: profile } = await supabase.from('profiles').select('school_code').eq('id', user.id).single();

  try {
    for (const student of backup.students) {
      const shadowEmail = `${student.nis}@${profile?.school_code}.supabase.user`;
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(student.id);
      
      if (!existingUser.user) {
        await supabaseAdmin.auth.admin.createUser({
          id: student.id,
          email: shadowEmail,
          password: '123456',
          email_confirm: true,
        });
      }

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

    const transactionsToInsert = backup.transactions.map((tx: any) => ({
      id: tx.id,
      student_id: tx.student_id,
      user_id: user.id,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      created_at: tx.created_at
    }));

    if (transactionsToInsert.length > 0) {
      await supabase.from('transactions').upsert(transactionsToInsert);
    }

    revalidatePath('/dashboard');
    return { success: true, message: 'Data berhasil dipulihkan.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
