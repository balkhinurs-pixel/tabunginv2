
'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/AppLogo';
import { studentLogin } from './actions';
import { SubmitButton } from '@/components/SubmitButton';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, KeyRound, User, ArrowRight, Shield, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

function StudentLoginContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message');
  
  // Get data from QR scan if available
  const initialNis = searchParams.get('nis') || '';
  const initialSchoolCode = searchParams.get('school_code') || '';
  
  const [nis, setNis] = useState(initialNis);
  const [schoolCode, setSchoolCode] = useState(initialSchoolCode);

  useEffect(() => {
    setNis(initialNis);
    setSchoolCode(initialSchoolCode);
  }, [initialNis, initialSchoolCode]);

  const isQrLogin = !!(initialNis && initialSchoolCode);

  return (
    <>
      <form action={studentLogin} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="school_code">Kode Sekolah</Label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="school_code"
              name="school_code"
              type="text"
              placeholder="Masukkan kode unik sekolah"
              className="pl-10 h-12"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              readOnly={isQrLogin}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nis">NIS (Nomor Induk Siswa)</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="nis"
              name="nis"
              type="text"
              placeholder="Masukkan NIS Anda"
              className="pl-10 h-12"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              readOnly={isQrLogin}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
              id="pin" 
              name="pin" 
              type="password"
              placeholder="Masukkan PIN Anda"
              className="pl-10 h-12"
              required
              autoFocus={isQrLogin}
            />
          </div>
        </div>

        {errorMessage && (
            <Alert variant="destructive">
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
            </Alert>
        )}
        
        <SubmitButton className="w-full h-12 bg-primary text-white font-medium group">
          <span className="flex items-center justify-center gap-2">
            Masuk
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </SubmitButton>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <Link 
          href="/login" 
          className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
        >
          Login sebagai Guru/Admin
        </Link>
      </div>
    </>
  );
}
  
export default function StudentLoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="relative z-10 w-full max-w-md">
        <Card>
          <CardHeader className="text-center pb-6">
             <div className="mb-6 flex justify-center">
                <AppLogo />
            </div>
            <CardTitle className="text-2xl font-bold">
              Login Siswa
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Isi form di bawah ini atau pindai kartu Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full mb-6 h-12 text-base" asChild>
                <Link href="/transactions">
                    <QrCode className="mr-2 h-5 w-5"/>
                    Pindai Kode QR
                </Link>
            </Button>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    Atau login manual
                    </span>
                </div>
            </div>
            <Suspense fallback={
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <StudentLoginContent />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
