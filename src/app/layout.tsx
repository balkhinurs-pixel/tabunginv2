
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { Toaster } from '@/components/ui/toaster';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import AdminMobileBottomNav from '@/app/admin/components/AdminMobileBottomNav';
import Header from '@/components/layout/Header';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Tabungin',
  description: 'Aplikasi tabungan siswa modern.',
};

function isMobile(headers: Headers) {
  const userAgent = headers.get('user-agent') || '';
  // This is a simple check, a more robust library might be needed for more accuracy
  // but for build purposes this avoids client-side hooks.
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = headers();
  const pathname = headersList.get('x-next-pathname') || '';
  
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/student-login');
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

  // Admin pages have their own specific layout handled within `src/app/admin/layout.tsx`
  // We can render them directly here to avoid layout conflicts.
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
  
  const mobile = isMobile(headersList);

  const MainContent = (
    <main className="p-4 sm:p-6 lg:p-8">{children}</main>
  );

  // For server-side rendering, we can't use useIsMobile hook.
  // We can make a best guess based on user-agent, but it's not foolproof.
  // The client-side will correct this on hydration if needed, but this structure
  // avoids using client components at the root layout level.
  // NOTE: This approach is a simplification. True adaptive rendering would be more complex.
  // Let's assume a desktop-first render and let client-side handle mobile for now
  // to ensure the build passes. A better approach might involve CSS media queries
  // to show/hide elements.

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.variable}`}>
        {/* Mobile View with bottom nav */}
        <div className="sm:hidden">
           <div className="flex min-h-screen w-full bg-background">
            <MobileBottomNav />
            <div className="w-full pb-24">
              <Header />
              {MainContent}
            </div>
          </div>
        </div>

        {/* Desktop View with sidebar */}
        <div className="hidden sm:block">
          <SidebarProvider>
            <Sidebar>
              <AppSidebar />
            </Sidebar>
            <SidebarInset>
              <Header />
              {MainContent}
            </SidebarInset>
          </SidebarProvider>
        </div>
        
        <Toaster />
      </body>
    </html>
  );
}
