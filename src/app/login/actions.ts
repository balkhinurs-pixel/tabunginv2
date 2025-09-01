'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Mengembalikan ke halaman login dengan pesan error
    const errorMessage = encodeURIComponent(error.message);
    return redirect(`/login?message=Gagal masuk: ${errorMessage}`);
  }

  // Revalidasi path dan redirect ke dashboard
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
