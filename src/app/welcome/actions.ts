
'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

interface RegisterRoleResult {
  success: boolean;
  message: string;
}

export async function registerUserRoleAction(params: {
  userId: string;
  email: string;
  role: 'ADMIN' | 'CANTINE';
  schoolName: string;
  schoolCode: string;
}): Promise<RegisterRoleResult> {
  const { userId, email, role, schoolName, schoolCode } = params;
  const supabaseAdmin = getSupabaseAdmin();
  const sanitizedCode = schoolCode.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

  try {
    // 1. Verifikasi untuk peran KANTIN
    if (role === 'CANTINE') {
      const { data: schoolCheck, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('school_name')
        .eq('school_code', sanitizedCode)
        .eq('role', 'ADMIN')
        .maybeSingle();

      if (checkError) throw checkError;
      if (!schoolCheck) {
        return { 
          success: false, 
          message: 'Sekolah tidak ditemukan. Pastikan kode unik yang dimasukkan sudah didaftarkan oleh Guru.' 
        };
      }
    }

    // 2. Verifikasi untuk peran ADMIN (mencegah duplikasi kode sekolah)
    if (role === 'ADMIN') {
        const { data: duplicateCheck } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('school_code', sanitizedCode)
            .eq('role', 'ADMIN')
            .neq('id', userId)
            .maybeSingle();
        
        if (duplicateCheck) {
            return {
                success: false,
                message: 'Kode sekolah ini sudah digunakan oleh guru lain. Mohon pilih kode yang berbeda.'
            };
        }
    }

    // 3. Update Profil menggunakan Admin Client untuk menembus RLS
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        school_name: role === 'ADMIN' ? schoolName : 'Outlet Kantin',
        school_code: sanitizedCode,
        role: role,
        plan: 'TRIAL' // Default plan
      });

    if (updateError) throw updateError;

    revalidatePath('/', 'layout');
    return { success: true, message: 'Profil berhasil dikonfigurasi.' };

  } catch (error: any) {
    console.error('Welcome Action Error:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan internal.' };
  }
}
