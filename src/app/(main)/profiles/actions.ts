
'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Profile, Student } from '@/types';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

interface ActionResult {
  success: boolean;
  message: string;
  student?: Student;
}

// Helper function to get the supabase admin client
// This MUST be called from a server-side only context where process.env is available
const getSupabaseAdmin = () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase URL or Service Role Key is not configured in environment variables.');
    }
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
    return supabaseAdmin;
};

// Helper function to get the user-context supabase client
const getSupabaseUserClient = () => {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        }
      );
    return supabase;
}


export async function addStudentAction(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseUserClient();
  const supabaseAdmin = getSupabaseAdmin();

  // 1. Get current user and their profile using the user's cookie
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'Anda harus masuk untuk menambahkan siswa.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_code, plan')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile || !profile.school_code) {
    return { success: false, message: 'Kode sekolah Anda belum diatur. Mohon atur di halaman Pengaturan.' };
  }

  // 2. Check student quota
  const { count: studentCount, error: countError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
    return { success: false, message: `Gagal memeriksa kuota siswa: ${countError.message}` };
  }

  const studentQuota = profile.plan === 'PRO' ? 100 : 32;
  if (studentCount != null && studentCount >= studentQuota) {
    return { success: false, message: `Kuota siswa penuh. Batas untuk akun Anda adalah ${studentQuota} siswa.` };
  }

  // 3. Get form data
  const newNis = formData.get('nis') as string;
  const newName = formData.get('name') as string;
  const newStudentClass = formData.get('class') as string;
  const newPin = formData.get('pin') as string;
  const newWhatsappNumber = formData.get('whatsapp_number') as string | null;

  if (!newNis || !newName || !newStudentClass || !newPin) {
    return { success: false, message: 'Data tidak lengkap. Mohon isi NIS, Nama, Kelas, dan PIN.' };
  }
  
  // 4. Create Supabase Auth user (shadow email) using the admin client
  const shadowEmail = `${newNis}@${profile.school_code}.supabase.user`;
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: shadowEmail,
    password: newPin,
    email_confirm: true, // Auto-confirm the shadow email
  });

  if (authError) {
    const errorMessage = authError.message.includes('unique')
      ? 'Kombinasi NIS dan Kode Sekolah ini sudah terdaftar.'
      : `Gagal membuat akun siswa: ${authError.message}`;
    return { success: false, message: errorMessage };
  }
  
  if (!authData.user) {
    return { success: false, message: 'Gagal membuat pengguna di sistem autentikasi.' };
  }

  // 5. Create student profile in 'students' table using the standard client
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .insert({
      id: authData.user.id, // Use the auth user ID as the student ID
      nis: newNis,
      name: newName,
      class: newStudentClass,
      user_id: user.id, // The admin/teacher user_id who created the student
      whatsapp_number: newWhatsappNumber,
    })
    .select()
    .single();

  if (studentError) {
    // IMPORTANT: If student insert fails, we must delete the created auth user to avoid orphans
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    const errorMessage = studentError.code === '23505'
        ? 'NIS ini sudah digunakan. Mohon gunakan NIS yang lain.'
        : `Gagal menyimpan profil siswa: ${studentError.message}`;
    return { success: false, message: errorMessage };
  }

  // 6. Success! Revalidate the path and return success
  revalidatePath('/profiles');
  return {
    success: true,
    message: `Siswa baru dengan nama ${newName} berhasil ditambahkan.`,
    student: studentData as Student
  };
}


export async function updateStudentAction(formData: FormData): Promise<ActionResult> {
    const supabase = getSupabaseUserClient();
    const supabaseAdmin = getSupabaseAdmin();

    const id = formData.get('id') as string;
    const nis = formData.get('nis') as string;
    const name = formData.get('name') as string;
    const studentClass = formData.get('class') as string;
    const whatsapp_number = formData.get('whatsapp_number') as string | null;
    const pin = formData.get('pin') as string;

    if (!id || !nis || !name || !studentClass) {
        return { success: false, message: 'Data tidak lengkap. Mohon isi NIS, Nama, dan Kelas.' };
    }

    // 1. Update the public student profile
    const { data: updatedStudentData, error: updateStudentError } = await supabase
        .from('students')
        .update({ nis, name, class: studentClass, whatsapp_number })
        .eq('id', id)
        .select()
        .single();

    if (updateStudentError) {
        return { success: false, message: `Gagal memperbarui profil siswa: ${updateStudentError.message}` };
    }

    // 2. If a new PIN is provided, update the auth user
    if (pin) {
        const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
            id, { password: pin }
        );

        if (updateUserError) {
            return { success: false, message: `Profil siswa diperbarui, tetapi gagal mereset PIN: ${updateUserError.message}` };
        }
    }

    // 3. Success
    revalidatePath('/profiles');
    revalidatePath(`/profiles/${id}`);
    return {
        success: true,
        message: `Data siswa ${name} berhasil diperbarui.`,
        student: updatedStudentData as Student
    };
}


export async function deleteStudentAction(studentId: string): Promise<ActionResult> {
    if (!studentId) {
        return { success: false, message: 'ID Siswa tidak ditemukan.' };
    }

    const supabaseAdmin = getSupabaseAdmin();

    // The student's row in the public.students table will be deleted automatically 
    // by the CASCADE rule on the foreign key relationship to auth.users.
    // So we only need to delete the auth user.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(studentId);

    if (authError) {
        return { success: false, message: `Gagal menghapus akun siswa: ${authError.message}` };
    }
    
    revalidatePath('/profiles');
    return {
        success: true,
        message: 'Siswa telah dihapus secara permanen.'
    };
}
