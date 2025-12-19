
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Tabungin',
  description: 'Aplikasi tabungan siswa modern.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1E40AF" />
      </head>
      <body className={`font-sans antialiased ${inter.variable} bg-background`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
