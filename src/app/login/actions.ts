"use server";

import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  // In a real app, you'd validate credentials against a database.
  // We'll simulate a network delay for demonstration purposes.
  await new Promise(resolve => setTimeout(resolve, 1000));

  redirect('/dashboard');
}
