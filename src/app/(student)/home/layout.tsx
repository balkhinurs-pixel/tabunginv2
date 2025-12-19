
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import type { AuthUser } from '@supabase/supabase-js';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/student-login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-6">
            <div className='flex items-center gap-3'>
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.email ? user.email.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                    <span className='text-sm font-semibold text-foreground'>Siswa</span>
                    <span className='text-xs text-muted-foreground -mt-1'>{user?.email?.split('@')[0]}</span>
                </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
            </Button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
