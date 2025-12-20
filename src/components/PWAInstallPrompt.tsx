'use client';

import React from 'react';
import usePWAInstall from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AppLogo } from './AppLogo';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const { installPrompt, handleInstall, handleDismiss } = usePWAInstall();

  if (!installPrompt) {
    return null;
  }

  return (
    <Sheet open={!!installPrompt} onOpenChange={(open) => !open && handleDismiss()}>
      <SheetContent side="bottom" className="rounded-t-lg max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl border">
                  <AppLogo variant="compact" />
              </div>
            </div>
          <SheetTitle className="text-2xl font-bold">Install Aplikasi Tabungin</SheetTitle>
          <SheetDescription className="max-w-sm mx-auto">
            Dapatkan pengalaman terbaik dengan menginstal aplikasi ini di perangkat Anda. Akses lebih cepat dan mudah, langsung dari layar utama.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-8">
          <Button onClick={handleInstall} className="w-full h-12 text-base font-semibold" size="lg">
            <Download className="mr-2 h-5 w-5" />
            Install Aplikasi
          </Button>
          <Button onClick={handleDismiss} variant="ghost" className="w-full h-12 text-base">
             Lain Kali
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PWAInstallPrompt;
