
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const errorMessage = encodeURIComponent(error.message);
    return redirect(`/login?message=Gagal masuk: ${errorMessage}`);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function loginWithGoogle() {
    const supabase = createClient();
    const origin = headers().get('origin');

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        console.error('Error logging in with Google:', error);
        return redirect('/login?message=Gagal masuk dengan Google');
    }

    if (data.url) {
        return redirect(data.url);
    }
    
    return redirect('/login?message=Terjadi kesalahan, silakan coba lagi');
}
