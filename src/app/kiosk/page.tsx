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
 * Menggunakan kamera depan dan sistem auto-reset setelah scan berhasil.
 * Pencarian data dilakukan berdasarkan NIS dan Kode Sekolah dari barcode.
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
        // Menggunakan kamera depan (facingMode: user) untuk mode kios agar siswa bisa melihat layar
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
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
    // Format QR yang diharapkan: "nis,schoolCode"
    const [nis, schoolCode] = data.split(',');
    
    if (!nis || !schoolCode) {
        // Abaikan jika format tidak sesuai agar tidak mengganggu scan berikutnya
        return;
    }

    setIsProcessing(true);
    
    try {
        // Ambil data siswa dengan filter NIS dan Kode Sekolah (via join table profiles)
        const { data: student, error } = await supabase
            .from('students')
            .select(`
                name, 
                class, 
                transactions(amount, type),
                profiles:user_id!inner(school_code)
            `)
            .eq('nis', nis)
            .eq('profiles.school_code', schoolCode)
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

            // Auto-reset kembali ke mode scan setelah 6 detik
            setTimeout(() => {
                setShowOverlay(false);
                setStudentData(null);
                setIsProcessing(false);
            }, 6000);

        } else {
            toast({
                title: 'Siswa Tidak Ditemukan',
                description: 'Data tidak cocok dengan sekolah manapun.',
                variant: 'destructive',
            });
            // Reset lebih cepat jika error agar bisa coba lagi
            setTimeout(() => setIsProcessing(false), 2000);
        }
    } catch (err) {
        setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
        {/* Layer Kamera sebagai background untuk kesan futuristik */}
        <div className="absolute inset-0 z-0">
             <video 
                ref={videoRef} 
                className="w-full h-full object-cover opacity-50 grayscale-[0.5]" 
                autoPlay 
                playsInline 
                muted 
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        {/* Header Kios */}
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

        {/* Tampilan Scan (Aktif jika tidak sedang menampilkan saldo) */}
        {!showOverlay && (
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="relative w-72 h-72 sm:w-96 sm:h-96 border border-white/20 rounded-[3.5rem] flex items-center justify-center overflow-hidden backdrop-blur-[2px]">
                    {/* Scanner Frame corner marks */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-[3.5rem]" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-[3.5rem]" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-[3.5rem]" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-[3.5rem]" />
                    
                    <ScanLine className="absolute w-[140%] text-primary/60 h-1.5 animate-[bounce_3s_infinite]" />
                    
                    <div className="flex flex-col items-center gap-4 text-white/40">
                        <div className="p-5 bg-white/5 rounded-full animate-pulse">
                            <Wallet className="h-14 w-14" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center px-8 leading-relaxed">
                            Tunjukkan QR Kartu Anda <br/> ke Kamera Depan
                        </p>
                    </div>
                </div>
                
                <div className="mt-16 text-center space-y-4 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest">Sistem Siap Pindai</p>
                    </div>
                    <p className="text-white/40 text-xs max-w-[240px] mx-auto font-medium leading-relaxed">
                        Posisikan kode QR di tengah kotak. Saldo akan muncul secara otomatis.
                    </p>
                </div>
            </div>
        )}

        {/* Tampilan Overlay Saldo (Muncul setelah scan berhasil) */}
        {showOverlay && studentData && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
                <Card className="w-full max-w-lg bg-gradient-to-br from-primary via-primary to-blue-800 border-none shadow-[0_40px_120px_rgba(59,130,246,0.6)] overflow-hidden rounded-[3.5rem] relative">
                    {/* Motif Lingkaran Estetik di latar belakang kartu */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <CardContent className="p-12 flex flex-col items-center text-center relative z-10">
                        <div className="bg-white/20 p-5 rounded-full mb-8 backdrop-blur-md shadow-inner border border-white/20">
                            <CheckCircle2 className="h-14 w-14 text-white" />
                        </div>

                        <div className="space-y-2 mb-10">
                            <h2 className="text-4xl font-black text-white tracking-tight leading-tight drop-shadow-sm">{studentData.name}</h2>
                            <div className="inline-block px-3 py-1 bg-white/10 border border-white/20 rounded-lg">
                                <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-xs">Kelas {studentData.class}</p>
                            </div>
                        </div>

                        <div className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Total Saldo Tabungan</p>
                            <p className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">
                                {studentData.balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </p>
                        </div>

                        <div className="mt-12 flex flex-col items-center gap-5">
                            <div className="flex gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                            </div>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.5em] animate-pulse">Menunggu Siswa Berikutnya</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* Peringatan Izin Kamera */}
        {hasCameraPermission === false && (
            <div className="absolute inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 text-center">
                 <div className="bg-rose-100 p-8 rounded-full mb-8">
                    <User className="h-16 w-16 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Akses Kamera Diperlukan</h2>
                <p className="text-muted-foreground mb-10 max-w-sm leading-relaxed">
                    Mode Kios membutuhkan akses kamera depan untuk memindai kartu tabungan siswa. Silakan izinkan melalui pengaturan browser Anda.
                </p>
                <Button onClick={() => window.location.reload()} size="lg" className="rounded-2xl h-14 px-10 text-lg font-bold">
                    Coba Lagi
                </Button>
            </div>
        )}
    </div>
  );
}
