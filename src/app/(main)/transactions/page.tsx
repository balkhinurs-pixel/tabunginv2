
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase';
import type { AuthUser } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

export default function TransactionsPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const getCameraAndUser = async () => {
      // Get user session
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Get camera permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };
    

    getCameraAndUser();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast, supabase]);

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
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
                setScanResult(code.data);
            }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (hasCameraPermission && !scanResult) {
       animationFrameId = requestAnimationFrame(tick);
    }
   
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasCameraPermission, scanResult]);

  useEffect(() => {
    if(scanResult) {
        const [nis, schoolCode] = scanResult.split(',');

        if (!nis) {
             toast({
                title: 'Kode QR Tidak Valid',
                description: `Format kode QR tidak dikenali.`,
                variant: 'destructive',
            });
            setTimeout(() => setScanResult(null), 2000);
            return;
        }

        // If user is logged in (i.e., a teacher), proceed to transaction
        if (user) {
             const findStudent = async () => {
                const { data: student, error } = await supabase
                    .from('students')
                    .select('id, name')
                    .eq('nis', nis)
                    .single();

                if (student && !error) {
                    toast({
                        title: 'Siswa Ditemukan',
                        description: `Membuka profil untuk ${student.name}.`,
                    });
                    router.push(`/profiles/${student.id}`);
                } else {
                    toast({
                        title: 'Siswa Tidak Ditemukan',
                        description: `Tidak ada siswa dengan NIS "${nis}". Pindai lagi.`,
                        variant: 'destructive',
                    });
                    setTimeout(() => setScanResult(null), 2000); 
                }
            }
            findStudent();
        } else {
            // If user is not logged in (i.e., a student trying to log in)
            // Redirect to login page with pre-filled data
            if (!schoolCode) {
                 toast({
                    title: 'Kode QR Login Tidak Lengkap',
                    description: `Kode QR tidak berisi kode sekolah. Gunakan kartu yang baru.`,
                    variant: 'destructive',
                });
                setTimeout(() => setScanResult(null), 2000);
                return;
            }
            const params = new URLSearchParams({ nis, school_code: schoolCode });
            router.push(`/student-login?${params.toString()}`);
        }
    }
  }, [scanResult, router, toast, supabase, user])


  return (
    <div className="flex flex-col gap-8 items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-center">
             <h2 className="text-2xl font-bold tracking-tight">Pindai untuk Memulai</h2>
            <p className="text-muted-foreground max-w-xs">
                {user ? 'Pindai kode QR siswa untuk memulai transaksi.' : 'Pindai kode QR pada kartu Anda untuk login.'}
            </p>
        </div>
        
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-4 border-dashed">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <ScanLine className="absolute h-full w-full text-primary animate-pulse" />
            <canvas ref={canvasRef} className="hidden" />
        </div>

        {!user && (
            <Button variant="outline" asChild>
                <Link href="/student-login">Login Manual</Link>
            </Button>
        )}

        {hasCameraPermission === false && (
            <Alert variant="destructive" className="max-w-xs">
                <QrCode className="h-4 w-4" />
                <AlertTitle>Akses Kamera Diperlukan</AlertTitle>
                <AlertDescription>
                Mohon izinkan akses kamera di pengaturan browser Anda untuk menggunakan fitur ini.
                </AlertDescription>
            </Alert>
        )}
    </div>
  );
}
