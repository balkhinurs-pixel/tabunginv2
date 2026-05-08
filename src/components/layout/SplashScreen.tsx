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
    }, 500); // Durasi fade out
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ease-in-out",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleDismiss}
        className="h-full w-full object-cover"
        // Jika video gagal dimuat atau terlalu lama, paksa tutup setelah 4 detik
        onError={handleDismiss}
      >
        <source src="/splashscreen.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Tombol lewati opsional jika video terlalu panjang */}
      <button 
        onClick={handleDismiss}
        className="absolute bottom-10 right-10 text-white/50 hover:text-white text-xs font-medium tracking-widest uppercase bg-white/10 px-4 py-2 rounded-full backdrop-blur-md transition-colors"
      >
        Lewati
      </button>
    </div>
  );
}
