
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function studentLogin(formData: FormData) {
  const schoolCode = formData.get('school_code') as string;
  const nis = formData.get('nis') as string;
  const pin = formData.get('pin') as string;
  const supabase = createClient();

  if (!schoolCode || !nis || !pin) {
    return redirect('/student-login?message=Kode Sekolah, NIS, dan PIN wajib diisi.');
  }

  // Construct the "shadow email" from the NIS and school code
  // This format must match what's used when creating the student auth user.
  const email = `${nis}@${schoolCode}.supabase.user`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  });

  if (error) {
    console.error("Student login error:", error.message);
    if (error.message.includes('Invalid login credentials')) {
        return redirect('/student-login?message=Kode Sekolah, NIS atau PIN salah.');
    }
    return redirect(`/student-login?message=Gagal masuk: ${error.message}`);
  }

  if (data.user) {
    revalidatePath('/', 'layout');
    // Redirect to the student's own profile page.
    // The user ID from auth should match the student's profile ID.
    return redirect(`/profiles/${data.user.id}`);
  }

  return redirect('/student-login?message=Terjadi kesalahan yang tidak diketahui.');
}

    
