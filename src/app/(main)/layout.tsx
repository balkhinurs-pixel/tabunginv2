
'use client';

import Header from '@/components/layout/Header';
import AppSidebar from '@/components/layout/AppSidebar';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // This layout is now simplified to correctly wrap the main app content
  // with the appropriate sidebar for desktop and let the root layout handle mobile.

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
