'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Cek apakah splash screen sudah ditampilkan di sesi ini
    const hasShownSplash = sessionStorage.getItem('hasShownSplashScreen');
    
    if (!hasShownSplash) {
      setIsVisible(true);
      // Simpan status agar tidak muncul lagi saat refresh di sesi yang sama
      sessionStorage.setItem('hasShownSplashScreen', 'true');

      // Batas waktu maksimal splash screen (10-12 detik sesuai permintaan)
      // Ini berfungsi sebagai fallback jika video gagal dimuat atau durasinya pendek
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Memastikan video diputar saat komponen muncul
    if (isVisible && videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Autoplay dipicu kendala browser:", error);
      });
    }
  }, [isVisible]);

  const handleDismiss = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 1000); // Durasi fade out yang elegan
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-1000 ease-in-out",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div className="flex-1 w-full flex items-center justify-center">
          <video
            ref={videoRef}
            muted
            playsInline
            onEnded={handleDismiss}
            className="h-full w-full object-contain sm:max-w-4xl"
            onError={handleDismiss}
          >
            <source src="/splash-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        {/* Indikator Pemuatan Halus di bagian bawah */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce"></div>
            </div>
            <p className="text-[10px] font-bold tracking-[0.4em] text-gray-300 uppercase">Menyiapkan Pengalaman Anda</p>
        </div>
        
        {/* Tombol lewati yang minimalis */}
        <button 
          onClick={handleDismiss}
          className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 text-[10px] font-bold tracking-widest uppercase bg-gray-50/50 hover:bg-gray-100 px-5 py-2.5 rounded-full backdrop-blur-sm transition-all border border-gray-100"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
