'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Header from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {isMobile === undefined ? (
        <div className="fixed inset-y-0 left-0 z-20 hidden w-20 flex-col border-r bg-card sm:flex" />
      ) : isMobile ? (
        <MobileBottomNav />
      ) : (
        <DesktopSidebar />
      )}
      <div
        className={`w-full transition-all duration-300 ease-in-out ${
          isMobile ? 'pb-16' : 'sm:pl-20'
        }`}
      >
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
