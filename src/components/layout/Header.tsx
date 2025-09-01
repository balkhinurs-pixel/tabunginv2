
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, User, LogOut, Shield, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@supabase/supabase-js';


export default function Header() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isAdmin = user?.email?.endsWith('@admin.com');

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-6">
        <div className="font-bold text-lg">
            {/* Balance can be added back here if needed */}
        </div>
      <div className='flex items-center gap-2'>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Image
                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user?.email || 'default'}`}
                width={36}
                height={36}
                alt="Avatar"
                className="overflow-hidden rounded-full"
                data-ai-hint="user avatar"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className='flex flex-col'>
                <span>Akun Saya</span>
                <span className='text-xs text-muted-foreground font-normal truncate'>{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings"><SettingsIcon className="mr-2 h-4 w-4" /><span>Pengaturan</span></Link>
            </DropdownMenuItem>
            {isAdmin && (
                <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard"><Shield className="mr-2 h-4 w-4" /><span>Panel Admin</span></Link>
                </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
