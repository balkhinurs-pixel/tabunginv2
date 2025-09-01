
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
import { login, loginWithGoogle } from './actions';
import { SubmitButton } from '@/components/SubmitButton';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.96-4.42 1.96-3.68 0-6.72-3.04-6.72-6.8s3.04-6.8 6.72-6.8c1.96 0 3.36.79 4.32 1.73L20.48 5.4C18.62 3.82 15.96 2.92 12.48 2.92c-5.4 0-9.84 4.44-9.84 9.84s4.44 9.84 9.84 9.84c2.82 0 5.16-1.04 6.9-2.72 1.78-1.68 2.6-4.28 2.6-6.84 0-.54-.04-.98-.1-1.44H12.48z" />
    </svg>
);
  
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
          <CardTitle className="text-2xl">Selamat Datang</CardTitle>
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                Atau lanjutkan dengan
                </span>
            </div>
          </div>
        
          <form action={loginWithGoogle}>
              <Button variant="outline" className="w-full">
                  <GoogleIcon className="mr-2 h-5 w-5" />
                  Lanjutkan dengan Google
              </Button>
          </form>

        </CardContent>
      </Card>
    </main>
  );
}
