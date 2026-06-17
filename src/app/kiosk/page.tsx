
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
        // Menggunakan kamera depan (facingMode: user) untuk mode kios
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Izin Kamera Ditolak',
          description: 'Mohon aktifkan izin kamera depan untuk menggunakan Mode Kios.',
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
        const context = canvas.getContext('2d');
        
        if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
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
    if (!nis) return;

    setIsProcessing(true);
    
    try {
        const { data: student, error } = await supabase
            .from('students')
            .select('name, class, transactions(amount, type)')
            .eq('nis', nis)
            .single();

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

            // Auto-reset setelah 6 detik
            setTimeout(() => {
                setShowOverlay(false);
                setStudentData(null);
                setIsProcessing(false);
            }, 6000);

        } else {
            toast({
                title: 'Data Tidak Ditemukan',
                description: 'Kartu tidak dikenali atau siswa belum terdaftar.',
                variant: 'destructive',
            });
            setTimeout(() => setIsProcessing(false), 3000);
        }
    } catch (err) {
        setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0">
             <video 
                ref={videoRef} 
                className="w-full h-full object-cover opacity-60 grayscale-[0.3]" 
                autoPlay 
                playsInline 
                muted 
            />
            <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Header UI */}
        <div className="relative z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter text-white">
                    Tabung<span className="text-primary">.in</span> KIOS
                </h1>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Self-Service Station</p>
            </div>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                <Link href="/student-login">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Keluar
                </Link>
            </Button>
        </div>

        {/* Scan Area UI */}
        {!showOverlay && (
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 border-2 border-white/30 rounded-[2rem] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 border-4 border-primary/50 animate-pulse rounded-[2rem]" />
                    <ScanLine className="absolute w-[120%] text-primary/80 h-1 animate-[bounce_3s_infinite]" />
                    <div className="flex flex-col items-center gap-3 text-white/80">
                        <Wallet className="h-12 w-12 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-center px-4">Tunjukkan Kartu Anda</p>
                    </div>
                </div>
                
                <div className="mt-12 text-center space-y-4 px-6">
                    <div className="flex items-center gap-2 justify-center">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        <p className="text-white font-bold text-lg">Sistem Siap Pindai</p>
                    </div>
                    <p className="text-white/40 text-sm max-w-xs mx-auto">
                        Posisikan kode QR di tengah kotak untuk melihat saldo tabungan Anda secara otomatis.
                    </p>
                </div>
            </div>
        )}

        {/* Balance Overlay UI */}
        {showOverlay && studentData && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                <Card className="w-full max-w-lg bg-gradient-to-br from-primary via-primary to-blue-800 border-none shadow-[0_30px_100px_rgba(59,130,246,0.5)] overflow-hidden rounded-[3rem]">
                    <CardContent className="p-10 flex flex-col items-center text-center relative">
                        {/* Decorative Circles */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

                        <div className="bg-white/20 p-4 rounded-full mb-6">
                            <CheckCircle2 className="h-12 w-12 text-white" />
                        </div>

                        <div className="space-y-1 mb-8">
                            <h2 className="text-3xl font-black text-white tracking-tight">{studentData.name}</h2>
                            <p className="text-white/70 font-bold uppercase tracking-widest text-sm">Kelas {studentData.class}</p>
                        </div>

                        <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-inner">
                            <p className="text-white/60 text-xs font-black uppercase tracking-[0.3em] mb-3">Saldo Tabungan Saat Ini</p>
                            <p className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                                {studentData.balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </p>
                        </div>

                        <div className="mt-10 flex flex-col items-center gap-4">
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></div>
                            </div>
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.4em]">Kembali ke Scan Otomatis</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* Security Warning for camera permission */}
        {hasCameraPermission === false && (
            <div className="absolute inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 text-center">
                 <div className="bg-rose-100 p-6 rounded-full mb-6">
                    <User className="h-12 w-12 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Akses Kamera Diperlukan</h2>
                <p className="text-muted-foreground mb-8 max-w-sm">
                    Mode Kios membutuhkan akses kamera depan Anda untuk memindai kartu tabungan siswa.
                </p>
                <Button onClick={() => window.location.reload()} size="lg" className="rounded-xl">
                    Coba Lagi
                </Button>
            </div>
        )}
    </div>
  );
}
