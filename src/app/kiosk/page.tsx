'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScanLine, ArrowLeft, Wallet, User, Loader2, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef(false); // Blokir instan di level memory
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isProcessing, setIsProcessing] = useState(false); // Untuk UI state
  const [studentData, setStudentData] = useState<{ name: string; class: string; balance: number } | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: facingMode,
              width: { ideal: 640 }, // Resolusi standar agar pemrosesan jsQR cepat
              height: { ideal: 480 }
            } 
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error kamera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [facingMode]);

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      // JANGAN pindai jika sedang memproses database atau menampilkan saldo
      if (!processingRef.current && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;

            // Mirroring logic
            context.save();
            if (facingMode === 'user') {
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            context.restore();

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
                // KUNCI segera agar tidak ada double scan dalam satu frame
                processingRef.current = true; 
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
  }, [hasCameraPermission, facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    processingRef.current = false;
  };

  const handleScanResult = async (data: string) => {
    const [nis, schoolCode] = data.split(',');
    
    if (!nis || !schoolCode) {
        // Jika format salah, tunggu sebentar baru boleh scan lagi
        setTimeout(() => { processingRef.current = false; }, 2000);
        return;
    }

    setIsProcessing(true);
    
    try {
        // Query database
        const { data: student, error } = await supabase
            .from('students')
            .select(`
                name, 
                class, 
                transactions(amount, type),
                profiles:user_id!inner(school_code)
            `)
            .eq('nis', nis.trim())
            .eq('profiles.school_code', schoolCode.trim().toLowerCase())
            .maybeSingle();

        if (error) throw error;

        if (student) {
            const balance = (student.transactions || []).reduce((acc, tx) => {
                return acc + (tx.type === 'Pemasukan' ? tx.amount : -tx.amount);
            }, 0);

            setStudentData({
                name: student.name,
                class: student.class,
                balance: balance
            });
            setShowOverlay(true);

            // Tampilkan hasil selama 6 detik
            setTimeout(() => {
                setShowOverlay(false);
                setStudentData(null);
                setIsProcessing(false);
                processingRef.current = false; // Buka kunci pemindaian
            }, 6000);

        } else {
            toast({
                title: "Data Tidak Ditemukan",
                description: `NIS ${nis} tidak terdaftar di sekolah ${schoolCode}.`,
                variant: "destructive"
            });
            setTimeout(() => {
                setIsProcessing(false);
                processingRef.current = false; 
            }, 3000);
        }
    } catch (err) {
        console.error("Kiosk error:", err);
        setIsProcessing(false);
        processingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
        {/* Layer Kamera */}
        <div className="absolute inset-0 z-0">
             <video 
                ref={videoRef} 
                className={cn(
                    "w-full h-full object-cover opacity-60 grayscale-[0.3] transition-all duration-700",
                    facingMode === 'user' && "-scale-x-100",
                    isProcessing && "blur-xl scale-110"
                )} 
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
                    Tabung<span className="text-primary">.in</span> <span className="opacity-50 text-sm">KIOS</span>
                </h1>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Cek Saldo Mandiri</p>
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="ghost" 
                    className="text-white/60 hover:text-white hover:bg-white/10 text-xs rounded-full h-10 px-4"
                    onClick={toggleCamera}
                >
                    <RefreshCw className="mr-2 h-3 w-3" /> Ganti Kamera
                </Button>
                <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 text-xs rounded-full h-10 px-4" asChild>
                    <Link href="/login">
                        <ArrowLeft className="mr-2 h-3 w-3" /> Keluar
                    </Link>
                </Button>
            </div>
        </div>

        {/* Scan Area */}
        {!showOverlay && (
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className={cn(
                    "relative w-72 h-72 sm:w-80 sm:h-80 border border-white/20 rounded-[3rem] flex items-center justify-center overflow-hidden transition-all duration-500",
                    isProcessing ? "scale-90 opacity-0" : "scale-100 opacity-100"
                )}>
                    {/* Scanner Frame Corners */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-[3rem]" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-[3rem]" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-[3rem]" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-[3rem]" />
                    
                    <ScanLine className="absolute w-full text-primary/80 h-1 animate-[bounce_2s_infinite] shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                    
                    <div className="flex flex-col items-center gap-4 text-white/20">
                        <div className="p-5 bg-white/5 rounded-full">
                            {isProcessing ? <Loader2 className="h-12 w-12 animate-spin text-primary" /> : <Wallet className="h-12 w-12" />}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center px-10">
                            {isProcessing ? "Mencari Data..." : "Arahkan Kartu QR"}
                        </p>
                    </div>
                </div>
                
                {!isProcessing && (
                    <div className="mt-12 text-center space-y-4 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-full">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <p className="text-primary font-bold text-[10px] uppercase tracking-widest">Kamera {facingMode === 'user' ? 'Depan' : 'Belakang'} Aktif</p>
                        </div>
                        <p className="text-white/40 text-[9px] max-w-[250px] mx-auto font-medium leading-relaxed uppercase tracking-[0.2em]">
                            Dekatkan kartu secara perlahan <br/> hingga terbaca otomatis
                        </p>
                    </div>
                )}
            </div>
        )}

        {/* Overlay Saldo */}
        {showOverlay && studentData && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                <Card className="w-full max-w-lg bg-gradient-to-br from-primary via-primary to-blue-800 border-none shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden rounded-[3.5rem] relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    
                    <CardContent className="p-10 flex flex-col items-center text-center relative z-10">
                        <div className="bg-white/20 p-5 rounded-full mb-6 backdrop-blur-md border border-white/20 shadow-inner">
                            <CheckCircle2 className="h-12 w-12 text-white" />
                        </div>

                        <div className="space-y-1 mb-8">
                            <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{studentData.name}</h2>
                            <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-[10px]">Kelas {studentData.class}</p>
                        </div>

                        <div className="w-full bg-white/10 backdrop-blur-3xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl">
                            <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.4em] mb-3">Saldo Tabungan</p>
                            <p className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                                {studentData.balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </p>
                        </div>

                        <div className="mt-10 flex flex-col items-center gap-4">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce"></div>
                            </div>
                            <p className="text-white/40 text-[8px] font-bold uppercase tracking-[0.5em] animate-pulse">Menutup otomatis...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* Izin Kamera Ditolak */}
        {hasCameraPermission === false && (
            <div className="absolute inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 text-center">
                 <div className="bg-rose-100 p-8 rounded-full mb-8">
                    <AlertCircle className="h-16 w-16 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Kamera Bermasalah</h2>
                <p className="text-muted-foreground mb-10 max-w-sm leading-relaxed">
                    Pastikan Anda telah memberikan izin kamera dan tidak ada aplikasi lain yang menggunakan kamera.
                </p>
                <Button onClick={() => window.location.reload()} size="lg" className="rounded-2xl h-14 px-10 text-lg font-bold">
                    Segarkan Halaman
                </Button>
            </div>
        )}
    </div>
  );
}
