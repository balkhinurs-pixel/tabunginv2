
'use client';

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import AdminMobileBottomNav from '@/app/admin/components/AdminMobileBottomNav';
import Header from '@/components/layout/Header';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import './globals.css';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// export const metadata: Metadata = {
//   title: 'Tabungin',
//   description: 'Aplikasi tabungan siswa modern.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // This is a simple way to set metadata dynamically on the client
    document.title = 'Tabungin';
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', 'Aplikasi tabungan siswa modern.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Aplikasi tabungan siswa modern.';
      document.head.appendChild(meta);
    }
  }, []);

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isAdminPage = pathname.startsWith('/admin');

  if (isAuthPage) {
    return (
      <html lang="id" suppressHydrationWarning>
        <body className={`font-sans antialiased ${inter.variable}`}>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }
  
  const MainContent = (
    <main className="p-4 sm:p-6 lg:p-8">{children}</main>
  );

  if (isMobile) {
    return (
       <html lang="id" suppressHydrationWarning>
        <body className={`font-sans antialiased ${inter.variable}`}>
          <div className="flex min-h-screen w-full bg-background">
            {isAdminPage ? <AdminMobileBottomNav /> : <MobileBottomNav />}
            <div className="w-full pb-24">
              <Header />
              {MainContent}
            </div>
          </div>
          <Toaster />
        </body>
      </html>
    );
  }

  // Admin pages have their own sidebar layout
  if (isAdminPage) {
     return (
        <html lang="id" suppressHydrationWarning>
          <body className={`font-sans antialiased ${inter.variable}`}>
            {children}
            <Toaster />
          </body>
        </html>
     )
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.variable}`}>
        <SidebarProvider>
          <Sidebar>
            <AppSidebar />
          </Sidebar>
          <SidebarInset>
            <Header />
            {MainContent}
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
