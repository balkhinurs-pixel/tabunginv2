
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
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Users, Key, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ADMIN_NAV_ITEMS = [
  { href: '/admin/dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', title: 'Pengguna', icon: Users },
  { href: '/admin/codes', title: 'Kode Aktivasi', icon: Key },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {ADMIN_NAV_ITEMS.map((item) => (
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
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Separator className="my-2" />
        <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke App
            </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Keluar
        </Button>
      </SidebarFooter>
    </>
  );
}
