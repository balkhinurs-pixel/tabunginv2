
'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Header from '@/components/layout/Header';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <MobileBottomNav />
        <div className="w-full pb-24">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
