'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ScanLine, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Delete,
  ArrowRight,
  XCircle,
  Banknote,
  KeyRound,
  Clock
} from 'lucide-react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStudentDataForPayment, processCantinePayment } from '../actions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type PaymentState = 'AMOUNT_INPUT' | 'SCANNING' | 'PIN_INPUT' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export default function CantinePOSPage() {
  const [state, setState] = useState<PaymentState>('AMOUNT_INPUT');
  const [student, setStudent] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessingQR, setIsProcessingQR] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Reset states
  const handleReset = () => {
    setState('AMOUNT_INPUT');
    setStudent(null);
    setAmount('');
    setPin('');
    setIsProcessingQR(false);
    setErrorMessage('');
  };

  // Camera handling for SCANNING state
  useEffect(() => {
    if (state !== 'SCANNING') return;

    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        toast({ title: "Izin Kamera Ditolak", variant: "destructive" });
      }
    };

    startCamera();

    const tick = () => {
      if (state === 'SCANNING' && !isProcessingQR && videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData!.data, imageData!.width, imageData!.height);

        if (code) {
            setIsProcessingQR(true);
            handleScan(code.data);
        }
      }
      if (state === 'SCANNING') requestAnimationFrame(tick);
    };

    const animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [state, isProcessingQR, toast]);

  const handleScan = async (data: string) => {
    if (!data.includes(',')) {
        toast({ title: "Format QR Tidak Valid", variant: "destructive" });
        setTimeout(() => setIsProcessingQR(false), 2000);
        return;
    }

    const [nis, schoolCode] = data.split(',');
    const result = await getStudentDataForPayment(nis, schoolCode);

    if (result.success) {
        setStudent(result.data);
        setState('PIN_INPUT');
    } else {
        toast({ title: result.message, variant: "destructive" });
        setTimeout(() => setIsProcessingQR(false), 2000);
    }
  };

  const handleProcessPayment = async () => {
    setState('PROCESSING');
    const result = await processCantinePayment({
        studentId: student.id,
        nis: student.nis,
        schoolCode: student.schoolCode,
        amount: parseInt(amount),
        pin: pin
    });

    if (result.success) {
        setState('SUCCESS');
        // Auto redirect to dashboard after 5 seconds
        setTimeout(() => router.push('/cantine/outlet'), 5000);
    } else {
        setErrorMessage(result.message);
        setState('ERROR');
    }
  };

  const Keypad = ({ value, onChange, onConfirm, label, subLabel, max = 9 }: any) => (
    <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-bottom-12 duration-500">
        <div className="text-center space-y-3">
            <h2 className="text-xl font-black text-gray-400 tracking-[0.3em] uppercase">{label}</h2>
            <div className="bg-gray-50 p-8 rounded-[2.5rem] border-4 border-gray-100 shadow-inner group transition-all focus-within:border-primary">
                <p className={cn(
                    "text-5xl font-black truncate tracking-tighter",
                    state === 'PIN_INPUT' ? "text-gray-900 tracking-[0.5em]" : "text-primary"
                )}>
                    {state === 'PIN_INPUT' ? '●'.repeat(value.length) || ' ' : `Rp ${parseInt(value || '0').toLocaleString('id-ID')}`}
                </p>
                {subLabel && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{subLabel}</p>}
            </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((k) => (
                <Button 
                    key={k} 
                    variant="outline" 
                    className={cn(
                        "h-20 text-2xl font-black rounded-3xl border-2 border-gray-100 bg-white transition-all active:scale-90 active:bg-gray-50",
                        k === 'C' && "text-rose-500 border-rose-50",
                        k === 'DEL' && "text-gray-400"
                    )}
                    onClick={() => {
                        if (k === 'C') onChange('');
                        else if (k === 'DEL') onChange(value.slice(0, -1));
                        else if (value.length < max) onChange(value + k.toString());
                    }}
                >
                    {k === 'DEL' ? <Delete className="h-7 w-7" /> : k}
                </Button>
            ))}
        </div>
        
        <Button 
            className="w-full h-20 rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/30 border-b-8 border-black/10 active:border-b-0 active:translate-y-1 transition-all" 
            disabled={!value || (state === 'PIN_INPUT' && value.length < 6)}
            onClick={onConfirm}
        >
            {state === 'PIN_INPUT' ? 'KONFIRMASI BAYAR' : 'LANJUT KE SCAN'} <ArrowRight className="ml-2 h-6 w-6" />
        </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col p-6 space-y-6">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="rounded-full bg-gray-50" onClick={() => router.back()}>
              <ArrowLeft />
          </Button>
          <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Pembayaran</span>
              <span className="text-base font-black text-gray-900 tracking-tight">
                  {state === 'AMOUNT_INPUT' && 'Input Nominal'}
                  {state === 'SCANNING' && 'Scan Kartu'}
                  {state === 'PIN_INPUT' && 'Verifikasi PIN'}
                  {state === 'PROCESSING' && 'Memproses...'}
                  {state === 'SUCCESS' && 'Berhasil!'}
              </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Banknote className="h-5 w-5" />
          </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center pb-12">
          {/* STEP 1: INPUT NOMINAL */}
          {state === 'AMOUNT_INPUT' && (
              <Keypad label="Belanjaan" value={amount} onChange={setAmount} onConfirm={() => setState('SCANNING')} />
          )}

          {/* STEP 2: SCANNING */}
          {state === 'SCANNING' && (
              <div className="space-y-12 flex flex-col items-center w-full animate-in zoom-in-95 duration-500">
                  <div className="relative w-80 h-80 border-8 border-dashed border-gray-100 rounded-[4rem] overflow-hidden flex items-center justify-center bg-gray-50/50 shadow-inner">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale-[0.2]" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 border-[50px] border-white/60 pointer-events-none" />
                      <ScanLine className="absolute w-full h-1.5 text-primary animate-[bounce_2s_infinite] shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
                      
                      <div className="absolute top-4 left-4 bg-primary text-white p-3 rounded-2xl shadow-xl flex items-center gap-2">
                          <Banknote className="h-5 w-5" />
                          <span className="font-black text-lg">Rp {parseInt(amount).toLocaleString('id-ID')}</span>
                      </div>
                  </div>
                  
                  <div className="text-center space-y-3">
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">SCAN KARTU SISWA</h2>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-[250px] mx-auto leading-relaxed">Arahkan kamera ke kode QR pada kartu Tabungin milik siswa.</p>
                      <Button variant="ghost" className="text-rose-500 font-bold" onClick={handleReset}>Batal</Button>
                  </div>
              </div>
          )}

          {/* STEP 3: INPUT PIN */}
          {state === 'PIN_INPUT' && (
              <Keypad 
                label="Keamanan" 
                subLabel={student?.name}
                value={pin} 
                onChange={setPin} 
                onConfirm={handleProcessPayment} 
                max={6}
              />
          )}

          {/* STEP 4: PROCESSING */}
          {state === 'PROCESSING' && (
              <div className="flex flex-col items-center gap-8">
                  <div className="relative">
                      <div className="h-28 w-28 border-8 border-gray-100 rounded-full" />
                      <div className="h-28 w-28 border-8 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
                  </div>
                  <div className="text-center space-y-2">
                      <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase italic italic-shadow">MEMPROSES...</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] animate-pulse">Menghubungkan ke Bank Digital</p>
                  </div>
              </div>
          )}

          {/* STEP 5: SUCCESS RECEIPT */}
          {state === 'SUCCESS' && (
              <div className="w-full max-w-sm text-center space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="h-32 w-32 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-50">
                      <CheckCircle2 className="h-16 w-12 text-emerald-600" />
                  </div>
                  
                  <div className="space-y-2">
                      <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">LUNAS!</h2>
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Pembayaran Berhasil Diterima</p>
                  </div>

                  <Card className="bg-gray-50 border-4 border-white rounded-[2.5rem] shadow-xl overflow-hidden">
                      <CardContent className="p-8 space-y-6">
                          <div className="flex justify-between items-center border-b border-gray-200/50 pb-4">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nominal</span>
                              <span className="text-2xl font-black text-gray-900">Rp {parseInt(amount).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex flex-col items-start gap-1 border-b border-gray-200/50 pb-4">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Siswa</span>
                              <span className="font-black text-gray-900 text-lg uppercase tracking-tight">{student?.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Waktu</span>
                              <div className="flex items-center gap-2 text-gray-600 font-bold text-xs">
                                  <Clock className="h-3 w-3" /> {format(new Date(), 'HH:mm:ss')}
                              </div>
                          </div>
                      </CardContent>
                  </Card>

                  <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-16 rounded-3xl font-black text-gray-500" onClick={handleReset}>
                          Transaksi Baru
                      </Button>
                      <Button className="flex-[1.5] h-16 rounded-3xl font-black shadow-xl" onClick={() => router.push('/cantine/outlet')}>
                          Dashboard
                      </Button>
                  </div>
              </div>
          )}

          {/* STEP 6: ERROR */}
          {state === 'ERROR' && (
              <div className="w-full max-w-sm text-center space-y-8">
                   <div className="h-28 w-28 bg-rose-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-50">
                      <XCircle className="h-14 w-14 text-rose-600" />
                  </div>
                  <div className="space-y-2">
                      <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">GAGAL</h2>
                      <p className="text-rose-600 font-bold px-8 leading-relaxed">{errorMessage}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                      <Button size="lg" className="w-full rounded-3xl h-20 font-black shadow-xl" variant="destructive" onClick={() => setState('PIN_INPUT')}>
                          COBA PIN LAGI
                      </Button>
                      <Button variant="ghost" className="h-14 font-bold text-gray-400" onClick={handleReset}>
                          Batal & Kembali
                      </Button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}
