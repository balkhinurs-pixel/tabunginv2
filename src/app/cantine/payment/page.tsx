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
  XCircle
} from 'lucide-react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStudentDataForPayment, processCantinePayment } from '../actions';

type PaymentState = 'SCANNING' | 'AMOUNT_INPUT' | 'PIN_INPUT' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export default function CantinePaymentPage() {
  const [state, setState] = useState<PaymentState>('SCANNING');
  const [student, setStudent] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessingQR, setIsProcessingQR] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const router = useRouter();

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
        setState('AMOUNT_INPUT');
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
        setTimeout(() => router.push('/cantine/outlet'), 5000);
    } else {
        setErrorMessage(result.message);
        setState('ERROR');
    }
  };

  const handleReset = () => {
      setState('SCANNING');
      setStudent(null);
      setAmount('');
      setPin('');
      setIsProcessingQR(false);
  };

  const Keypad = ({ value, onChange, onConfirm, label }: any) => (
    <div className="w-full max-w-sm space-y-6 animate-in slide-in-from-bottom-4">
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{label}</h2>
            <div className="bg-gray-100 p-6 rounded-3xl border-2 border-gray-200">
                <p className="text-4xl font-black text-primary truncate">
                    {state === 'PIN_INPUT' ? '●'.repeat(value.length) : `Rp ${parseInt(value || '0').toLocaleString('id-ID')}`}
                </p>
            </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((k) => (
                <Button 
                    key={k} 
                    variant="outline" 
                    className="h-16 text-xl font-black rounded-2xl bg-white border-2 border-gray-100 hover:border-primary active:scale-95"
                    onClick={() => {
                        if (k === 'C') onChange('');
                        else if (k === 'DEL') onChange(value.slice(0, -1));
                        else if (value.length < (state === 'PIN_INPUT' ? 6 : 9)) onChange(value + k.toString());
                    }}
                >
                    {k === 'DEL' ? <Delete /> : k}
                </Button>
            ))}
        </div>
        <Button 
            className="w-full h-16 rounded-2xl text-lg font-black shadow-xl" 
            disabled={!value || (state === 'PIN_INPUT' && value.length < 6)}
            onClick={onConfirm}
        >
            LANJUTKAN <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col p-4 space-y-6">
      <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft />
          </Button>
          <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Pembayaran</span>
              <span className="text-sm font-bold text-gray-900">Kantin Digital</span>
          </div>
          <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
          {state === 'SCANNING' && (
              <div className="space-y-10 flex flex-col items-center w-full">
                  <div className="relative w-72 h-72 border-4 border-dashed border-gray-200 rounded-[3rem] overflow-hidden flex items-center justify-center">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 border-[40px] border-white/40 pointer-events-none" />
                      <ScanLine className="absolute w-full h-1 text-primary animate-bounce shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div className="text-center space-y-2">
                      <h2 className="text-xl font-black text-gray-900">SCAN KARTU SISWA</h2>
                      <p className="text-xs text-muted-foreground font-medium max-w-[200px]">Arahkan kamera ke kode QR pada kartu Tabungin siswa.</p>
                  </div>
              </div>
          )}

          {state === 'AMOUNT_INPUT' && (
              <Keypad label="NOMINAL BELANJA" value={amount} onChange={setAmount} onConfirm={() => setState('PIN_INPUT')} />
          )}

          {state === 'PIN_INPUT' && (
              <Keypad label="MASUKKAN PIN SISWA" value={pin} onChange={setPin} onConfirm={handleProcessPayment} />
          )}

          {state === 'PROCESSING' && (
              <div className="flex flex-col items-center gap-6 animate-pulse">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="font-black text-gray-900 tracking-widest uppercase italic">Memproses...</p>
              </div>
          )}

          {state === 'SUCCESS' && (
              <div className="w-full max-w-sm text-center space-y-8 animate-in zoom-in-95">
                  <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                      <h2 className="text-3xl font-black text-gray-900">PEMBAYARAN BERHASIL!</h2>
                      <p className="text-gray-500 font-medium">Pembayaran ke outlet kantin telah diterima.</p>
                  </div>
                  <Card className="bg-gray-50 border-none rounded-3xl overflow-hidden shadow-inner">
                      <CardContent className="p-6 space-y-4">
                          <div className="flex justify-between border-b border-gray-200 pb-3">
                              <span className="text-[10px] font-black uppercase text-gray-400">Nominal</span>
                              <span className="font-black text-gray-900">Rp {parseInt(amount).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-200 pb-3">
                              <span className="text-[10px] font-black uppercase text-gray-400">Siswa</span>
                              <span className="font-bold text-gray-900">{student?.name}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-[10px] font-black uppercase text-gray-400">Waktu</span>
                              <span className="font-medium text-gray-600 italic">Baru saja</span>
                          </div>
                      </CardContent>
                  </Card>
                  <Button size="lg" className="w-full rounded-2xl h-14 font-black" onClick={() => router.push('/cantine/outlet')}>
                      SELESAI
                  </Button>
              </div>
          )}

          {state === 'ERROR' && (
              <div className="w-full max-w-sm text-center space-y-8">
                   <div className="h-24 w-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                      <XCircle className="h-12 w-12 text-rose-600" />
                  </div>
                  <div className="space-y-2">
                      <h2 className="text-2xl font-black text-gray-900">PEMBAYARAN GAGAL</h2>
                      <p className="text-rose-600 font-bold">{errorMessage}</p>
                  </div>
                  <Button size="lg" className="w-full rounded-2xl h-14 font-black" variant="destructive" onClick={handleReset}>
                      COBA LAGI
                  </Button>
              </div>
          )}
      </div>
    </div>
  );
}