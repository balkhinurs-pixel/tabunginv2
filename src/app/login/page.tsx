
'use client';

import Link from 'next/link';
import { Suspense } from 'react';
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
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.96-4.42 1.96-3.68 0-6.72-3.04-6.72-6.8s3.04-6.8 6.72-6.8c1.96 0 3.36.79 4.32 1.73L20.48 5.4C18.62 3.82 15.96 2.92 12.48 2.92c-5.4 0-9.84 4.44-9.84 9.84s4.44 9.84 9.84 9.84c2.82 0 5.16-1.04 6.9-2.72 1.78-1.68 2.6-4.28 2.6-6.84 0-.54-.04-.98-.1-1.44H12.48z" />
    </svg>
);

function LoginContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <form action={login} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              className="pl-10 h-12 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
              id="password" 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter your password"
              className="pl-10 pr-10 h-12 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {errorMessage && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertDescription className="text-red-700 dark:text-red-400">
                  {errorMessage}
                </AlertDescription>
            </Alert>
        )}
        
        <SubmitButton className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group">
          <span className="flex items-center justify-center gap-2">
            Sign In
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </SubmitButton>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-4 text-gray-500 dark:text-gray-400 font-medium">
            Or continue with
            </span>
        </div>
      </div>
    
      <form action={loginWithGoogle}>
          <Button 
            variant="outline" 
            className="w-full h-12 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
          >
              <GoogleIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
              Continue with Google
          </Button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">Don't have an account?</span>{' '}
        <Link 
          href="/signup" 
          className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
        >
          Sign up here
        </Link>
      </div>
    </>
  );
}
  
export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md p-6">
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50 shadow-2xl shadow-black/10 dark:shadow-black/50">
          <CardHeader className="text-center pb-6">
            <div className="mb-6 flex justify-center">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <AppLogo variant="light" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
              Sign in to your account to continue your financial journey
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Suspense fallback={
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <LoginContent />
            </Suspense>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Protected by industry-standard encryption
          </p>
        </div>
      </div>
    </main>
  );
}
