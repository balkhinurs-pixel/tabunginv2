
'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';

interface RegisterRoleResult {
  success: boolean;
  message: string;
}

export async function registerUserRoleAction(params: {
  role: 'TEACHER' | 'CANTINE';
  schoolName: string;
  schoolCode: string;
}): Promise<RegisterRoleResult> {
  const { role, schoolName, schoolCode } = params;
  const supabase = createClient();
  const supabaseAdmin = getSupabaseAdmin();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
      return { success: false, message: 'Sesi tidak valid. Silakan login kembali.' };
  }

  // Pembersihan kode sekolah
  const sanitizedCode = schoolCode.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

  console.log(`[WELCOME_DEBUG] Memulai pendaftaran untuk: ${user.email} (Role: ${role})`);

  try {
    // 1. Verifikasi untuk peran KANTIN
    if (role === 'CANTINE') {
      const { data: schoolCheck, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id, school_name')
        .eq('school_code', sanitizedCode)
        .eq('role', 'TEACHER') // Kantin harus mencari Guru (TEACHER)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!schoolCheck) {
        return { 
          success: false, 
          message: 'Sekolah tidak ditemukan. Pastikan Kode Sekolah yang Anda masukkan sudah didaftarkan oleh Guru.' 
        };
      }
    }

    // 2. Verifikasi untuk peran TEACHER (mencegah duplikasi kode sekolah antar guru)
    if (role === 'TEACHER') {
        const { data: duplicateCheck } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .eq('school_code', sanitizedCode)
            .eq('role', 'TEACHER')
            .neq('id', user.id)
            .maybeSingle();
        
        if (duplicateCheck) {
            return {
                success: false,
                message: 'Kode sekolah ini sudah digunakan oleh guru lain. Mohon pilih kode yang berbeda.'
            };
        }
    }

    // 3. Update Profil menggunakan Upsert
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        school_name: role === 'TEACHER' ? schoolName : 'Outlet Kantin',
        school_code: sanitizedCode,
        role: role,
        plan: 'TRIAL' 
      }, { onConflict: 'id' });

    if (updateError) throw updateError;

    revalidatePath('/', 'layout');
    return { success: true, message: 'Profil berhasil dikonfigurasi.' };

  } catch (error: any) {
    console.error('[WELCOME_DEBUG] Error:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan sistem.' };
  }
}
