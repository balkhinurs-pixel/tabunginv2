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
    }
  }, []);

  const handleDismiss = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 600); // Durasi fade out yang sedikit lebih halus
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-700 ease-in-out",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleDismiss}
          className="h-full w-full object-cover sm:object-contain transition-all duration-500"
          // Menggunakan object-contain di layar besar agar video tidak terpotong jika aspek rasionya berbeda
          onError={handleDismiss}
        >
          <source src="/splash-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Indikator Pemuatan Halus (Opsional, di bawah video) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-bounce"></div>
            </div>
        </div>
      </div>
      
      {/* Tombol lewati yang lebih minimalis untuk latar putih */}
      <button 
        onClick={handleDismiss}
        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-[10px] font-bold tracking-[0.2em] uppercase bg-gray-100/50 hover:bg-gray-100 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300"
      >
        Skip
      </button>
    </div>
  );
}
