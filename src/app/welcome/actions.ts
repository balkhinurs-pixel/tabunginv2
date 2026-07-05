
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
  
  // Pembersihan kode sekolah: huruf kecil, hapus spasi, hapus karakter aneh
  const sanitizedCode = schoolCode.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');

  console.log(`[WELCOME_DEBUG] Memulai pendaftaran untuk user: ${email}`);
  console.log(`[WELCOME_DEBUG] Role: ${role}, Kode Input: ${schoolCode}, Sanitized: ${sanitizedCode}`);

  try {
    // 1. Verifikasi untuk peran KANTIN
    if (role === 'CANTINE') {
      console.log(`[WELCOME_DEBUG] Mengecek keberadaan sekolah dengan kode: ${sanitizedCode}`);
      
      const { data: schoolCheck, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id, school_name, role')
        .eq('school_code', sanitizedCode)
        .eq('role', 'ADMIN')
        .maybeSingle();

      if (checkError) {
        console.error(`[WELCOME_DEBUG] Database error saat cek sekolah:`, checkError);
        throw checkError;
      }

      if (!schoolCheck) {
        console.warn(`[WELCOME_DEBUG] Sekolah TIDAK ditemukan atau kode '${sanitizedCode}' bukan milik GURU/ADMIN.`);
        return { 
          success: false, 
          message: 'Sekolah tidak ditemukan. Pastikan kode unik yang dimasukkan sudah didaftarkan oleh Guru/Admin sekolah tersebut.' 
        };
      }
      
      console.log(`[WELCOME_DEBUG] Sekolah ditemukan: ${schoolCheck.school_name}`);
    }

    // 2. Verifikasi untuk peran ADMIN (mencegah duplikasi kode sekolah)
    if (role === 'ADMIN') {
        console.log(`[WELCOME_DEBUG] Mengecek apakah kode sekolah '${sanitizedCode}' sudah dipakai oleh ADMIN lain.`);
        
        const { data: duplicateCheck } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .eq('school_code', sanitizedCode)
            .eq('role', 'ADMIN')
            .neq('id', userId)
            .maybeSingle();
        
        if (duplicateCheck) {
            console.warn(`[WELCOME_DEBUG] Kode sekolah '${sanitizedCode}' sudah digunakan oleh: ${duplicateCheck.email}`);
            return {
                success: false,
                message: 'Kode sekolah ini sudah digunakan oleh guru lain. Mohon pilih kode yang berbeda.'
            };
        }
    }

    // 3. Update Profil menggunakan Admin Client
    console.log(`[WELCOME_DEBUG] Menyimpan profil baru ke database untuk user ID: ${userId}`);
    
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        school_name: role === 'ADMIN' ? schoolName : 'Outlet Kantin',
        school_code: sanitizedCode,
        role: role,
        plan: 'TRIAL' 
      });

    if (updateError) {
        console.error(`[WELCOME_DEBUG] Error saat upsert profil:`, updateError);
        throw updateError;
    }

    console.log(`[WELCOME_DEBUG] Pendaftaran BERHASIL untuk ${email} sebagai ${role}`);
    revalidatePath('/', 'layout');
    return { success: true, message: 'Profil berhasil dikonfigurasi.' };

  } catch (error: any) {
    console.error('[WELCOME_DEBUG] Fatal Error di registerUserRoleAction:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan internal sistem.' };
  }
}
