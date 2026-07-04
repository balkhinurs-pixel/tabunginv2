
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
    <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex gap-2 my-2 h-5">
            {[...Array(6)].map((_, i) => (
                <div key={i} className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all duration-200",
                    i < pin.length ? "bg-white border-white shadow-[0_0_8px_white]" : "border-white/20"
                )} />
            ))}
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-[300px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button 
                    key={num} 
                    variant="outline" 
                    className="h-14 text-xl font-black rounded-xl bg-white/10 border-white/10 text-white hover:bg-white/20 active:scale-95 transition-transform"
                    onClick={() => handlePinPress(num.toString())}
                >
                    {num}
                </Button>
            ))}
            <Button 
                variant="outline" 
                className="h-14 rounded-xl bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/20"
                onClick={() => setPin('')}
            >
                <XCircle className="h-5 w-5" />
            </Button>
            <Button 
                variant="outline" 
                className="h-14 text-xl font-black rounded-xl bg-white/10 border-white/10 text-white"
                onClick={() => handlePinPress('0')}
            >
                0
            </Button>
            <Button 
                variant="outline" 
                className="h-14 rounded-xl bg-white/10 border-white/10 text-white"
                onClick={() => setPin(p => p.slice(0, -1))}
            >
                <Delete className="h-5 w-5" />
            </Button>
        </div>
        <Button 
            className="w-full max-w-[300px] h-14 rounded-xl bg-white text-primary font-black text-base shadow-lg mt-2"
            disabled={pin.length < 6}
            onClick={onConfirm}
        >
            {confirmLabel} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden font-sans">
        {/* Background Video Layer */}
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
        <div className="relative z-10 p-4 flex justify-between items-center">
            <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter text-white">
                    Tabung<span className="text-primary">.in</span> <span className="opacity-50 text-xs">ATM</span>
                </h1>
            </div>
            {kioskState === 'SCANNING' && (
                <div className="flex gap-2">
                    <Button variant="ghost" className="text-white/60 text-[10px] rounded-full h-8 px-3 bg-white/5" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}>
                        <RefreshCw className="mr-2 h-3 w-3" /> Kamera
                    </Button>
                    <Button variant="ghost" className="text-white/60 text-[10px] rounded-full h-8 px-3 bg-white/5" asChild>
                        <Link href="/login"><ArrowLeft className="mr-2 h-3 w-3" /> Keluar</Link>
                    </Button>
                </div>
            )}
        </div>

        {/* CONTENT AREA */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
            
            {/* 1. STATE: SCANNING */}
            {kioskState === 'SCANNING' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="relative w-64 h-64 sm:w-80 sm:h-80 border border-white/20 rounded-[3rem] flex items-center justify-center overflow-hidden">
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-[3rem]" />
                        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-[3rem]" />
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-[3rem]" />
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-[3rem]" />
                        
                        <ScanLine className="absolute w-full text-primary/80 h-1 animate-[bounce_2s_infinite] shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                        <div className="flex flex-col items-center gap-3 text-white/20">
                            <Wallet className="h-12 w-12" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center px-8">Scan Kartu</p>
                        </div>
                    </div>
                    <div className="mt-8 text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <p className="text-primary font-bold text-[9px] uppercase tracking-widest">Sistem Siap</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. STATE: MAIN MENU */}
            {kioskState === 'MAIN_MENU' && student && (
                <div className="w-full max-w-sm space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                    <Card className="bg-gradient-to-br from-primary via-blue-600 to-blue-800 border-none shadow-2xl rounded-[2.5rem] overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                        <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
                            <div className="bg-white/10 p-3 rounded-full mb-4 backdrop-blur-md border border-white/20">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight mb-1">{student.name}</h2>
                            <p className="text-white/70 font-black uppercase tracking-[0.2em] text-[9px] mb-6">Kelas {student.class}</p>
                            
                            <div className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[2rem]">
                                <p className="text-white/50 text-[9px] font-bold uppercase tracking-[0.3em] mb-2">Saldo Anda</p>
                                <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(student.balance)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            className="h-18 rounded-[1.5rem] bg-white/10 border border-white/20 text-white text-base font-black hover:bg-white/20 shadow-xl"
                            onClick={() => handleReset()}
                        >
                            Selesai
                        </Button>
                        <Button 
                            className="h-18 rounded-[1.5rem] bg-white text-primary text-base font-black shadow-xl shadow-primary/20"
                            onClick={() => setKioskState('PIN_INPUT')}
                        >
                            Tarik Tunai
                        </Button>
                    </div>
                </div>
            )}

            {/* 3. STATE: PIN INPUT */}
            {kioskState === 'PIN_INPUT' && (
                <div className="w-full max-w-sm flex flex-col items-center space-y-6 animate-in fade-in duration-300">
                    <div className="text-center space-y-2">
                        <div className="h-14 w-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <KeyRound className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight uppercase">PIN ATM</h2>
                        <p className="text-white/50 text-[10px] font-medium px-8">Masukkan 6 digit PIN akun Anda.</p>
                    </div>
                    <NumericKeypad onConfirm={() => setKioskState('WITHDRAW_MENU')} />
                    <Button variant="ghost" className="text-white/30 text-xs hover:text-white" onClick={() => setKioskState('MAIN_MENU')}>
                        Batal
                    </Button>
                </div>
            )}

            {/* 4. STATE: WITHDRAW MENU */}
            {kioskState === 'WITHDRAW_MENU' && (
                <div className="w-full max-w-sm flex flex-col items-center space-y-6 animate-in slide-in-from-right-8 duration-500">
                    <div className="text-center">
                        <h2 className="text-xl font-black text-white tracking-tight mb-1 uppercase">Pilih Nominal</h2>
                        <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Tersedia: {formatCurrency(student.balance)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {QUICK_AMOUNTS.map(amt => (
                            <Button 
                                key={amt}
                                disabled={amt > student.balance}
                                className="h-24 rounded-[2rem] bg-white/10 border border-white/20 text-white text-lg font-black hover:bg-white shadow-xl hover:text-primary transition-all active:scale-95 disabled:opacity-30"
                                onClick={() => handleWithdraw(amt)}
                            >
                                {amt.toLocaleString('id-ID')}
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-3 w-full">
                        <Button 
                            variant="outline" 
                            className="flex-1 h-16 rounded-[1.5rem] bg-white/5 border-white/10 text-white font-bold text-sm"
                            onClick={() => setKioskState('PIN_INPUT')}
                        >
                            Kembali
                        </Button>
                        <Button 
                            className="flex-1 h-16 rounded-[1.5rem] bg-primary text-white font-bold text-sm"
                            onClick={() => setKioskState('CUSTOM_AMOUNT')}
                        >
                            Nominal Lain
                        </Button>
                    </div>
                </div>
            )}

            {/* 5. STATE: CUSTOM AMOUNT */}
            {kioskState === 'CUSTOM_AMOUNT' && (
                <div className="w-full max-w-sm flex flex-col items-center space-y-6">
                     <div className="text-center w-full">
                        <h2 className="text-xl font-black text-white tracking-tight mb-2 uppercase">Input Nominal</h2>
                        <div className="bg-white/10 p-5 rounded-[1.5rem] border border-white/20 w-full text-center">
                            <p className="text-primary-foreground/50 text-[9px] font-bold uppercase tracking-widest mb-1">Jumlah Tarik</p>
                            <p className="text-3xl font-black text-white">{formatCurrency(amount)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 w-full max-w-[300px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                            <Button 
                                key={num}
                                variant="outline" 
                                className={cn(
                                    "h-14 text-xl font-black rounded-xl bg-white/10 border-white/10 text-white",
                                    num === 0 && "col-span-2"
                                )}
                                onClick={() => setAmount(prev => parseInt(`${prev}${num}`))}
                            >
                                {num}
                            </Button>
                        ))}
                         <Button 
                            variant="outline" 
                            className="h-14 rounded-xl bg-white/10 border-white/10 text-white"
                            onClick={() => setAmount(0)}
                        >
                            <Delete className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex gap-3 w-full">
                         <Button 
                            variant="ghost" 
                            className="flex-1 h-14 rounded-xl text-white/50 text-xs"
                            onClick={() => { setAmount(0); setKioskState('WITHDRAW_MENU'); }}
                        >
                            Batal
                        </Button>
                        <Button 
                            className="flex-1 h-14 rounded-xl bg-white text-primary font-black"
                            disabled={amount <= 0 || amount > student.balance}
                            onClick={() => handleWithdraw(amount)}
                        >
                            Tarik
                        </Button>
                    </div>
                </div>
            )}

            {/* 6. STATE: PROCESSING */}
            {kioskState === 'PROCESSING' && (
                <div className="flex flex-col items-center gap-6 animate-pulse">
                    <div className="h-20 w-24 border-8 border-primary border-t-transparent rounded-full animate-spin" />
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">Memproses</h2>
                        <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Mohon Tunggu</p>
                    </div>
                </div>
            )}

            {/* 7. STATE: SUCCESS */}
            {kioskState === 'SUCCESS' && (
                <div className="w-full max-w-sm animate-in zoom-in-95 duration-500">
                    <Card className="bg-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-0">
                            <div className="bg-emerald-500 p-8 flex flex-col items-center text-white text-center">
                                <div className="bg-white/20 p-4 rounded-full mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight mb-1">Berhasil!</h2>
                            </div>
                            <div className="p-8 space-y-4">
                                <div className="flex flex-col items-center py-4 border-b border-dashed border-gray-200">
                                    <ReceiptText className="h-5 w-5 text-gray-300 mb-2" />
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Uang Ditarik</p>
                                    <p className="text-3xl font-black text-gray-900">{formatCurrency(lastWithdrawal || 0)}</p>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                        <span className="uppercase tracking-widest text-[9px]">Sisa Saldo</span>
                                        <span className="text-emerald-600">{formatCurrency(student.balance)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                        <span className="uppercase tracking-widest text-[9px]">Nama Siswa</span>
                                        <span className="text-gray-900 truncate max-w-[150px]">{student.name}</span>
                                    </div>
                                </div>
                                <Button 
                                    className="w-full h-14 rounded-[1.5rem] bg-gray-900 text-white font-black mt-4"
                                    onClick={() => handleReset()}
                                >
                                    Selesai
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 8. STATE: ERROR */}
            {kioskState === 'ERROR' && (
                <div className="w-full max-w-sm animate-in shake-in duration-500">
                    <Card className="bg-rose-600 border-none shadow-2xl rounded-[2.5rem] overflow-hidden text-center text-white">
                        <CardContent className="p-8 flex flex-col items-center">
                            <div className="bg-white/20 p-4 rounded-full mb-6">
                                <AlertCircle className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Gagal</h2>
                            <p className="text-rose-100 font-medium mb-8 text-sm leading-relaxed px-4">{errorMessage}</p>
                            <Button 
                                className="w-full h-16 rounded-[1.5rem] bg-white text-rose-600 font-black shadow-xl"
                                onClick={() => setKioskState('PIN_INPUT')}
                            >
                                Coba Lagi
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-full h-12 mt-2 text-white/50 text-xs"
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
                 <div className="bg-rose-100 p-6 rounded-full mb-6">
                    <AlertCircle className="h-12 w-12 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold mb-3">Izin Kamera Diperlukan</h2>
                <p className="text-muted-foreground mb-8 max-sm:px-4 max-w-xs text-sm leading-relaxed">
                    Mohon berikan akses kamera pada browser Anda untuk dapat melakukan pengecekan saldo dan penarikan mandiri.
                </p>
                <Button onClick={() => window.location.reload()} size="lg" className="rounded-xl h-14 px-8 text-base font-bold">
                    Buka Kamera Sekarang
                </Button>
            </div>
        )}
    </div>
  );
}
