
'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Header from '@/components/layout/Header';
import { StudentProvider } from '@/context/StudentContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <StudentProvider>
      <div className="flex min-h-screen w-full bg-background">
        {isMobile === undefined ? null : isMobile ? (
          <MobileBottomNav />
        ) : (
          <DesktopSidebar />
        )}
        <div
          className={`w-full transition-all duration-300 ease-in-out ${
            isMobile ? 'pb-24' : 'sm:pl-20'
          }`}
        >
          <Header />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </StudentProvider>
  );
}
