
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ScanLine, 
  ArrowLeft, 
  Wallet, 
  Loader2, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  Banknote,
  KeyRound,
  Delete,
  ArrowRight,
  XCircle,
  ReceiptText
} from 'lucide-react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getStudentKioskData, processKioskWithdrawal } from './actions';

type KioskState = 'SCANNING' | 'MAIN_MENU' | 'PIN_INPUT' | 'WITHDRAW_MENU' | 'CUSTOM_AMOUNT' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef(false); 
  
  // States
  const [kioskState, setKioskState] = useState<KioskState>('SCANNING');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [student, setStudent] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastWithdrawal, setLastWithdrawal] = useState<number | null>(null);

  const { toast } = useToast();

  // Reset Timer - kembali ke scan jika ditinggalkan
  useEffect(() => {
    if (kioskState !== 'SCANNING') {
        const timeout = setTimeout(() => {
            handleReset();
        }, 30000); // 30 detik tanpa aktivitas
        return () => clearTimeout(timeout);
    }
  }, [kioskState]);

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
              width: { ideal: 1280 },
              height: { ideal: 720 }
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

    if (kioskState === 'SCANNING') {
        getCameraPermission();
    }

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [facingMode, kioskState]);

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (kioskState === 'SCANNING' && !processingRef.current && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        if (context) {
            const processWidth = 640;
            const processHeight = Math.floor((video.videoHeight / video.videoWidth) * processWidth);
            
            canvas.width = processWidth;
            canvas.height = processHeight;

            context.setTransform(1, 0, 0, 1, 0, 0);
            
            if (facingMode === 'user') {
                context.translate(processWidth, 0);
                context.scale(-1, 1);
            }
            
            context.drawImage(video, 0, 0, processWidth, processHeight);

            const imageData = context.getImageData(0, 0, processWidth, processHeight);
            const code = jsQR(imageData.data, processWidth, processHeight, {
                inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
                processingRef.current = true; 
                handleScanResult(code.data);
            }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (hasCameraPermission && kioskState === 'SCANNING') {
       animationFrameId = requestAnimationFrame(tick);
    }
   
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasCameraPermission, facingMode, kioskState]);

  const handleScanResult = async (data: string) => {
    const [nis, schoolCode] = data.split(',');
    
    if (!nis || !schoolCode) {
        setTimeout(() => { processingRef.current = false; }, 1500);
        return;
    }

    const result = await getStudentKioskData(nis, schoolCode);

    if (result.success && result.data) {
        setStudent(result.data);
        setKioskState('MAIN_MENU');
        processingRef.current = false;
    } else {
        toast({
            title: "Gagal Membaca Kartu",
            description: result.message || "Siswa tidak ditemukan.",
            variant: "destructive"
        });
        setTimeout(() => { processingRef.current = false; }, 2000);
    }
  };

  const handlePinPress = (num: string) => {
    if (pin.length < 6) {
        setPin(prev => prev + num);
    }
  };

  const handleWithdraw = async (withAmount: number) => {
    setKioskState('PROCESSING');
    
    const result = await processKioskWithdrawal({
        studentId: student.id,
        nis: student.nis,
        schoolCode: student.schoolCode,
        pin: pin,
        amount: withAmount
    });

    if (result.success) {
        setLastWithdrawal(withAmount);
        setStudent({ ...student, balance: result.newBalance });
        setKioskState('SUCCESS');
        setTimeout(() => handleReset(), 8000);
    } else {
        setErrorMessage(result.message || 'Terjadi kesalahan.');
        setKioskState('ERROR');
    }
  };

  const handleReset = () => {
    setKioskState('SCANNING');
    setStudent(null);
    setPin('');
    setAmount(0);
    setErrorMessage('');
    setLastWithdrawal(null);
    processingRef.current = false;
  };

  const formatCurrency = (val: number) => 
    val.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

  // ATM UI Parts
  const NumericKeypad = ({ onConfirm, confirmLabel = "Lanjutkan" }: { onConfirm: () => void, confirmLabel?: string }) => (
    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex gap-3 my-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all duration-300",
                    i < pin.length ? "bg-white border-white scale-110 shadow-[0_0_10px_white]" : "border-white/30"
                )} />
            ))}
        </div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-[320px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button 
                    key={num} 
                    variant="outline" 
                    className="h-16 text-2xl font-black rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 active:scale-90 transition-all"
                    onClick={() => handlePinPress(num.toString())}
                >
                    {num}
                </Button>
            ))}
            <Button 
                variant="outline" 
                className="h-16 rounded-2xl bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/40"
                onClick={() => setPin('')}
            >
                <XCircle className="h-6 w-6" />
            </Button>
            <Button 
                variant="outline" 
                className="h-16 text-2xl font-black rounded-2xl bg-white/10 border-white/20 text-white"
                onClick={() => handlePinPress('0')}
            >
                0
            </Button>
            <Button 
                variant="outline" 
                className="h-16 rounded-2xl bg-white/10 border-white/20 text-white"
                onClick={() => setPin(p => p.slice(0, -1))}
            >
                <Delete className="h-6 w-6" />
            </Button>
        </div>
        <Button 
            className="w-full max-w-[320px] h-16 rounded-2xl bg-white text-primary font-black text-lg shadow-xl shadow-black/20"
            disabled={pin.length < 6}
            onClick={onConfirm}
        >
            {confirmLabel} <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden font-sans">
        {/* Background Video Layer (Hanya saat scanning) */}
        <div className="absolute inset-0 z-0">
             <video 
                ref={videoRef} 
                className={cn(
                    "w-full h-full object-cover opacity-60 grayscale-[0.2] transition-all duration-1000",
                    facingMode === 'user' && "-scale-x-100",
                    (kioskState !== 'SCANNING') && "blur-[80px] opacity-40 scale-110"
                )} 
                autoPlay 
                playsInline 
                muted 
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        </div>

        {/* Header UI */}
        <div className="relative z-10 p-6 flex justify-between items-center">
            <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter text-white">
                    Tabung<span className="text-primary">.in</span> <span className="opacity-50 text-sm">ATM</span>
                </h1>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">Kios Penarikan Mandiri</p>
            </div>
            {kioskState === 'SCANNING' && (
                <div className="flex gap-2">
                    <Button variant="ghost" className="text-white/60 text-xs rounded-full h-10 px-4 bg-white/5" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}>
                        <RefreshCw className="mr-2 h-3 w-3" /> Kamera
                    </Button>
                    <Button variant="ghost" className="text-white/60 text-xs rounded-full h-10 px-4 bg-white/5" asChild>
                        <Link href="/login"><ArrowLeft className="mr-2 h-3 w-3" /> Keluar</Link>
                    </Button>
                </div>
            )}
        </div>

        {/* CONTENT AREA */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
            
            {/* 1. STATE: SCANNING */}
            {kioskState === 'SCANNING' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative w-72 h-72 sm:w-80 sm:h-80 border border-white/20 rounded-[3.5rem] flex items-center justify-center overflow-hidden">
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary rounded-tl-[3.5rem]" />
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-primary rounded-tr-[3.5rem]" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-primary rounded-bl-[3.5rem]" />
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary rounded-br-[3.5rem]" />
                        
                        <ScanLine className="absolute w-full text-primary/80 h-1 animate-[bounce_2s_infinite] shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                        <div className="flex flex-col items-center gap-4 text-white/20">
                            <Wallet className="h-16 w-16" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center px-10">Tunjukkan Kartu QR</p>
                        </div>
                    </div>
                    <div className="mt-12 text-center space-y-4">
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-full">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <p className="text-primary font-bold text-[10px] uppercase tracking-widest">Sistem Siap</p>
                        </div>
                        <p className="text-white/40 text-[9px] uppercase tracking-[0.2em]">Dekatkan kartu ke arah kamera</p>
                    </div>
                </div>
            )}

            {/* 2. STATE: MAIN MENU */}
            {kioskState === 'MAIN_MENU' && student && (
                <div className="w-full max-w-lg space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                    <Card className="bg-gradient-to-br from-primary via-blue-600 to-blue-800 border-none shadow-2xl rounded-[3rem] overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                        <CardContent className="p-10 flex flex-col items-center text-center relative z-10">
                            <div className="bg-white/10 p-4 rounded-full mb-6 backdrop-blur-md border border-white/20">
                                <CheckCircle2 className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">{student.name}</h2>
                            <p className="text-white/70 font-black uppercase tracking-[0.2em] text-[10px] mb-8">Kelas {student.class}</p>
                            
                            <div className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem]">
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">Saldo Anda</p>
                                <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(student.balance)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button 
                            className="h-24 rounded-[2rem] bg-white/10 border border-white/20 text-white text-lg font-black hover:bg-white/20 shadow-xl"
                            onClick={() => handleReset()}
                        >
                            <ArrowLeft className="mr-3 h-6 w-6" /> Selesai
                        </Button>
                        <Button 
                            className="h-24 rounded-[2rem] bg-white text-primary text-lg font-black shadow-xl shadow-primary/20"
                            onClick={() => setKioskState('PIN_INPUT')}
                        >
                            Tarik Tunai <Banknote className="ml-3 h-6 w-6" />
                        </Button>
                    </div>
                </div>
            )}

            {/* 3. STATE: PIN INPUT */}
            {kioskState === 'PIN_INPUT' && (
                <div className="w-full max-w-md flex flex-col items-center space-y-8">
                    <div className="text-center space-y-3">
                        <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Konfirmasi PIN ATM</h2>
                        <p className="text-white/50 text-xs font-medium px-10">Demi keamanan, masukkan 6 digit PIN akun Anda.</p>
                    </div>
                    <NumericKeypad onConfirm={() => setKioskState('WITHDRAW_MENU')} />
                    <Button variant="ghost" className="text-white/40 hover:text-white" onClick={() => setKioskState('MAIN_MENU')}>
                        Batal
                    </Button>
                </div>
            )}

            {/* 4. STATE: WITHDRAW MENU */}
            {kioskState === 'WITHDRAW_MENU' && (
                <div className="w-full max-w-lg flex flex-col items-center space-y-8 animate-in slide-in-from-right-8 duration-500">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase italic">Pilih Nominal Tarik</h2>
                        <p className="text-white/40 text-xs font-bold tracking-widest">SALDO TERSEDIA: {formatCurrency(student.balance)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 w-full">
                        {QUICK_AMOUNTS.map(amt => (
                            <Button 
                                key={amt}
                                disabled={amt > student.balance}
                                className="h-28 rounded-[2.5rem] bg-white/10 border border-white/20 text-white text-xl font-black hover:bg-white shadow-xl hover:text-primary transition-all active:scale-95 disabled:opacity-30"
                                onClick={() => handleWithdraw(amt)}
                            >
                                {amt.toLocaleString('id-ID')}
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-4 w-full">
                        <Button 
                            variant="outline" 
                            className="flex-1 h-20 rounded-[2rem] bg-white/5 border-white/10 text-white font-bold"
                            onClick={() => setKioskState('PIN_INPUT')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                        </Button>
                        <Button 
                            className="flex-1 h-20 rounded-[2rem] bg-primary text-white font-bold"
                            onClick={() => setKioskState('CUSTOM_AMOUNT')}
                        >
                            Nominal Lain
                        </Button>
                    </div>
                </div>
            )}

            {/* 5. STATE: CUSTOM AMOUNT */}
            {kioskState === 'CUSTOM_AMOUNT' && (
                <div className="w-full max-w-md flex flex-col items-center space-y-8">
                     <div className="text-center">
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase italic">Masukkan Nominal</h2>
                        <div className="bg-white/10 p-6 rounded-[2rem] border border-white/20 w-full min-w-[300px] text-center">
                            <p className="text-primary-foreground/50 text-[10px] font-bold uppercase tracking-widest mb-2">Jumlah Penarikan</p>
                            <p className="text-4xl font-black text-white">{formatCurrency(amount)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                            <Button 
                                key={num}
                                variant="outline" 
                                className={cn(
                                    "h-16 text-2xl font-black rounded-2xl bg-white/10 border-white/20 text-white",
                                    num === 0 && "col-span-2"
                                )}
                                onClick={() => setAmount(prev => parseInt(`${prev}${num}`))}
                            >
                                {num}
                            </Button>
                        ))}
                         <Button 
                            variant="outline" 
                            className="h-16 rounded-2xl bg-white/10 border-white/20 text-white"
                            onClick={() => setAmount(0)}
                        >
                            <Delete className="h-6 w-6" />
                        </Button>
                    </div>
                    <div className="flex gap-4 w-full">
                         <Button 
                            variant="ghost" 
                            className="flex-1 h-16 rounded-2xl text-white/50"
                            onClick={() => { setAmount(0); setKioskState('WITHDRAW_MENU'); }}
                        >
                            Batal
                        </Button>
                        <Button 
                            className="flex-1 h-16 rounded-2xl bg-white text-primary font-black"
                            disabled={amount <= 0 || amount > student.balance}
                            onClick={() => handleWithdraw(amount)}
                        >
                            Tarik Sekarang
                        </Button>
                    </div>
                </div>
            )}

            {/* 6. STATE: PROCESSING */}
            {kioskState === 'PROCESSING' && (
                <div className="flex flex-col items-center gap-8 animate-pulse">
                    <div className="h-24 w-24 border-8 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_50px_rgba(59,130,246,0.5)]" />
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase italic">Memproses</h2>
                        <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-xs">Jangan cabut kartu atau tutup layar</p>
                    </div>
                </div>
            )}

            {/* 7. STATE: SUCCESS */}
            {kioskState === 'SUCCESS' && (
                <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
                    <Card className="bg-white border-none shadow-[0_50px_100px_rgba(0,0,0,0.6)] rounded-[3rem] overflow-hidden">
                        <CardContent className="p-0">
                            <div className="bg-emerald-500 p-10 flex flex-col items-center text-white text-center">
                                <div className="bg-white/20 p-5 rounded-full mb-6">
                                    <CheckCircle2 className="h-12 w-12 text-white" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight mb-1">Berhasil!</h2>
                                <p className="text-emerald-100 font-bold uppercase tracking-widest text-[10px]">Transaksi Selesai</p>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="flex flex-col items-center py-4 border-b border-dashed border-gray-200">
                                    <ReceiptText className="h-6 w-6 text-gray-300 mb-4" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Uang yang ditarik</p>
                                    <p className="text-4xl font-black text-gray-900">{formatCurrency(lastWithdrawal || 0)}</p>
                                </div>
                                <div className="space-y-4 pt-4">
                                    <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                                        <span className="uppercase tracking-widest text-[10px]">Sisa Saldo</span>
                                        <span className="text-emerald-600">{formatCurrency(student.balance)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                                        <span className="uppercase tracking-widest text-[10px]">Nama Santri</span>
                                        <span className="text-gray-900">{student.name}</span>
                                    </div>
                                </div>
                                <Button 
                                    className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black mt-4"
                                    onClick={() => handleReset()}
                                >
                                    Selesai & Keluar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 8. STATE: ERROR */}
            {kioskState === 'ERROR' && (
                <div className="w-full max-w-md animate-in shake-in duration-500">
                    <Card className="bg-rose-600 border-none shadow-2xl rounded-[3rem] overflow-hidden text-center text-white">
                        <CardContent className="p-10 flex flex-col items-center">
                            <div className="bg-white/20 p-5 rounded-full mb-8">
                                <AlertCircle className="h-12 w-12 text-white" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight mb-4 uppercase italic">Transaksi Gagal</h2>
                            <p className="text-rose-100 font-medium mb-10 leading-relaxed px-4">{errorMessage}</p>
                            <Button 
                                className="w-full h-16 rounded-2xl bg-white text-rose-600 font-black shadow-xl"
                                onClick={() => setKioskState('PIN_INPUT')}
                            >
                                Coba Lagi
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-full h-14 mt-4 text-white/50"
                                onClick={() => handleReset()}
                            >
                                Kembali ke Awal
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>

        {/* Camera Access Error UI */}
        {hasCameraPermission === false && (
            <div className="absolute inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 text-center">
                 <div className="bg-rose-100 p-8 rounded-full mb-8">
                    <AlertCircle className="h-16 w-16 text-rose-600" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Izin Kamera Diperlukan</h2>
                <p className="text-muted-foreground mb-10 max-sm:px-4 max-w-sm leading-relaxed">
                    Mohon berikan akses kamera pada browser Anda untuk dapat melakukan pengecekan saldo dan penarikan mandiri.
                </p>
                <Button onClick={() => window.location.reload()} size="lg" className="rounded-2xl h-14 px-10 text-lg font-bold">
                    Buka Kamera Sekarang
                </Button>
            </div>
        )}
    </div>
  );
}
