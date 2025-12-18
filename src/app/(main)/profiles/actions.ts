'use server';

import { createClient } from '@/lib/utils/supabase/server';
import type { Profile, Student } from '@/types';
import { revalidatePath } from 'next/cache';

interface AddStudentResult {
  success: boolean;
  message: string;
  student?: Student;
}

export async function addStudentAction(formData: FormData): Promise<AddStudentResult> {
  const supabase = createClient();

  // 1. Get current user and their profile
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
  if (studentCount >= studentQuota) {
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

  // 4. Create Supabase Auth user (shadow email)
  const shadowEmail = `${newNis}@${profile.school_code}.supabase.user`;
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: shadowEmail,
    password: newPin,
    email_confirm: true, // Auto-confirm the shadow email
  });

  if (authError) {
    const errorMessage = authError.message.includes('unique')
      ? 'Kombinasi NIS dan Kode Sekolah ini sudah terdaftar.'
      : authError.message;
    return { success: false, message: `Gagal membuat akun siswa: ${errorMessage}` };
  }

  // 5. Create student profile in 'students' table
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .insert({
      id: authData.user.id, // Use the auth user ID as the student ID
      nis: newNis,
      name: newName,
      class: newStudentClass,
      user_id: user.id, // The admin user_id
      whatsapp_number: newWhatsappNumber,
    })
    .select()
    .single();

  if (studentError) {
    // IMPORTANT: If student insert fails, we must delete the created auth user to avoid orphans
    await supabase.auth.admin.deleteUser(authData.user.id);
    const errorMessage = studentError.code === '23505'
        ? 'NIS ini sudah digunakan. Mohon gunakan NIS yang lain.'
        : studentError.message;
    return { success: false, message: `Gagal menambahkan siswa: ${errorMessage}` };
  }

  // 6. Success! Revalidate the path and return success
  revalidatePath('/profiles');
  return {
    success: true,
    message: `Siswa baru dengan nama ${newName} berhasil ditambahkan.`,
    student: studentData as Student
  };
}
