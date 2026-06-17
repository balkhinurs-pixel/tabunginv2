'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScanLine, ArrowLeft, Wallet, User, Loader2, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Halaman Mode Kios untuk cek saldo mandiri tanpa login.
 * Dioptimalkan untuk kamera depan dengan resolusi HD dan fitur un-mirroring.
 */

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentData, setStudentData] = useState<{ name: string; class: string; balance: number } | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        // Meminta resolusi HD untuk ketajaman maksimal agar tidak blur
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'user', 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            } 
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error mengakses kamera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Izin Kamera Ditolak',
          description: 'Mohon aktifkan izin kamera depan dan pastikan pencahayaan cukup.',
        });
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (!isProcessing && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        // willReadFrequently mengoptimalkan pengambilan data pixel secara berulang
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;

            // Un-mirroring: Membalikkan gambar agar QR terbaca normal oleh sistem
            context.save();
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            context.restore();

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                handleScanResult(code.data);
            }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (hasCameraPermission) {
       animationFrameId = requestAnimationFrame(tick);
    }
   
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasCameraPermission, isProcessing]);

  const handleScanResult = async (data: string) => {
    const [nis, schoolCode] = data.split(',');
    
    if (!nis || !schoolCode) return;

    setIsProcessing(true);
    
    try {
        const { data: student, error } = await supabase
            .from('students')
            .select(`
                name, 
                class, 
                transactions(amount, type),
                profiles:user_id!inner(school_code)
            `)
            .eq('nis', nis)
            .eq('profiles.school_code', schoolCode.toLowerCase())
            .maybeSingle();

        if (student && !error) {
            const balance = (student.transactions || []).reduce((acc, tx) => {
                return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
            }, 0);

            setStudentData({
                name: student.name,
                class: student.class,
                balance: balance
            });
            setShowOverlay(true);

            // Tampilkan saldo selama 6 detik
            setTimeout(() => {
                setShowOverlay(false);
                setStudentData(null);
                setIsProcessing(false);
            }, 6000);

        } else {
            // Jika tidak ditemukan, beri jeda singkat lalu izinkan scan lagi
            setTimeout(() => setIsProcessing(false), 2000);
        }
    } catch (err) {
        setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
        {/* Layer Kamera */}
        <div className="absolute inset-0 z-0">
             <video 
                ref={videoRef} 
                className="w-full h-full object-cover opacity-60 grayscale-[0.3] -scale-x-100" 
                autoPlay 
                playsInline 
                muted 
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 flex justify-between items-center">
            <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter text-white">
                    Tabung<span className="text-primary">.in</span> <span className="opacity-50">KIOS</span>
                </h1>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Smart Self-Service</p>
            </div>
            <Button variant="ghost" className="text-white/40 hover:text-white hover:bg-white/10 text-xs" asChild>
                <Link href="/login">
                    <ArrowLeft className="mr-2 h-3 w-3" /> Kembali ke Login
                </Link>
            </Button>
        </div>

        {/* Scan Area */}
        {!showOverlay && (
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="relative w-72 h-72 sm:w-96 sm:h-96 border border-white/20 rounded-[3.5rem] flex items-center justify-center overflow-hidden backdrop-blur-[1px]">
                    {/* Scanner Frame Corners */}
                    <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-primary rounded-tl-[3.5rem]" />
                    <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-primary rounded-tr-[3.5rem]" />
                    <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-primary rounded-bl-[3.5rem]" />
                    <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-primary rounded-br-[3.5rem]" />
                    
                    <ScanLine className="absolute w-[120%] text-primary/80 h-1 animate-[bounce_2.5s_infinite] shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                    
                    <div className="flex flex-col items-center gap-4 text-white/30">
                        <div className="p-6 bg-white/5 rounded-full animate-pulse">
                            <Wallet className="h-16 w-16" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center px-10 leading-relaxed">
                            Arahkan Kode QR <br/> ke Tengah Kamera
                        </p>
                    </div>
                </div>
                
                <div className="mt-12 text-center space-y-4 px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Sistem Aktif & Tajam</p>
                    </div>
                    <p className="text-white/50 text-[10px] max-w-[280px] mx-auto font-medium leading-relaxed uppercase tracking-wider">
                        Jaga jarak kartu ± 15cm dari kamera <br/> untuk fokus terbaik
                    </p>
                </div>
            </div>
        )}

        {/* Overlay Saldo */}
        {showOverlay && studentData && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
                <Card className="w-full max-w-lg bg-gradient-to-br from-primary via-primary to-blue-800 border-none shadow-[0_40px_150px_rgba(59,130,246,0.6)] overflow-hidden rounded-[4rem] relative">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    
                    <CardContent className="p-12 flex flex-col items-center text-center relative z-10">
                        <div className="bg-white/20 p-6 rounded-full mb-8 backdrop-blur-md shadow-inner border border-white/20">
                            <CheckCircle2 className="h-16 w-16 text-white" />
                        </div>

                        <div className="space-y-2 mb-10">
                            <h2 className="text-4xl font-black text-white tracking-tight leading-tight">{studentData.name}</h2>
                            <div className="inline-block px-4 py-1 bg-white/10 border border-white/20 rounded-full">
                                <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-xs">Kelas {studentData.class}</p>
                            </div>
                        </div>

                        <div className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 p-12 rounded-[3rem] shadow-2xl">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Saldo Anda Saat Ini</p>
                            <p className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">
                                {studentData.balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </p>
                        </div>

                        <div className="mt-12 flex flex-col items-center gap-6">
                            <div className="flex gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce"></div>
                            </div>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.6em] animate-pulse">Siap untuk Scan Berikutnya</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* Izin Kamera Ditolak */}
        {hasCameraPermission === false && (
            <div className="absolute inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 text-center">
                 <div className="bg-rose-100 p-8 rounded-full mb-8">
                    <User className="h-16 w-16 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Akses Kamera Diperlukan</h2>
                <p className="text-muted-foreground mb-10 max-w-sm leading-relaxed">
                    Mode Kios membutuhkan akses kamera untuk memindai kartu. Silakan klik "Coba Lagi" dan izinkan kamera jika muncul permintaan.
                </p>
                <Button onClick={() => window.location.reload()} size="lg" className="rounded-2xl h-14 px-10 text-lg font-bold">
                    Coba Lagi
                </Button>
            </div>
        )}
    </div>
  );
}
