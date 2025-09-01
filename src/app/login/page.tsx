'use client';

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
import { login } from './actions';
import { SubmitButton } from '@/components/SubmitButton';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message');

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <AppLogo />
          </div>
          <CardTitle className="text-2xl">Selamat Datang Kembali</CardTitle>
          <CardDescription>
            Masukkan kredensial Anda untuk mengakses akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="anda@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {errorMessage && (
                <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
            <SubmitButton className="w-full bg-primary hover:bg-primary/90">
              Masuk
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
