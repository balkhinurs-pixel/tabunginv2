'use client';

import React from 'react';
import usePWAInstall from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AppLogo } from './AppLogo';
import { Download } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const { installPrompt, handleInstall, handleDismiss } = usePWAInstall();

  if (!installPrompt) {
    return null;
  }

  return (
    <Sheet open={!!installPrompt} onOpenChange={(open) => !open && handleDismiss()}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t-4 border-primary/20 p-6 pb-10">
        <SheetHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-inner border border-gray-100">
                  <AppLogo variant="compact" />
              </div>
            </div>
          <SheetTitle className="text-2xl font-bold tracking-tight">Pasang Aplikasi Tabungin</SheetTitle>
          <SheetDescription className="max-w-xs mx-auto text-base">
            Nikmati akses lebih cepat, aman, dan lancar langsung dari layar utama perangkat Anda.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 mt-8">
          <Button onClick={handleInstall} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" size="lg">
            <Download className="mr-3 h-6 w-6" />
            Install Sekarang
          </Button>
          <Button onClick={handleDismiss} variant="ghost" className="w-full h-12 text-muted-foreground font-medium">
             Gunakan di Browser Saja
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PWAInstallPrompt;