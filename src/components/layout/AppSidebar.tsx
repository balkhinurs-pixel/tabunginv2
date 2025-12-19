
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/AppLogo';
import { NAV_ITEMS } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import type { AuthUser } from '@supabase/supabase-js';
import Image from 'next/image';

export default function AppSidebar() {
  const pathname = usePathname();
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
    router.push('/login');
    router.refresh(); // Ensure the page reloads to reflect logged out state
  };

  return (
    <>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            if (item.isCentral) return null;
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Separator className="my-2" />
        {user && (
           <div className='flex items-center gap-3 px-2 py-3'>
                <Image
                    src={`https://api.dicebear.com/7.x/micah/svg?seed=${user?.email || 'default'}`}
                    width={40}
                    height={40}
                    alt="Avatar"
                    className="overflow-hidden rounded-full"
                />
                <div className='flex flex-col truncate'>
                    <span className='font-semibold text-sm'>Admin</span>
                    <span className='text-xs text-muted-foreground truncate'>{user.email}</span>
                </div>
           </div>
        )}
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Keluar
        </Button>
      </SidebarFooter>
    </>
  );
}
