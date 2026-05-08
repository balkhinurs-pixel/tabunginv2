
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import SplashScreen from '@/components/layout/SplashScreen';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const APP_NAME = "Tabungin";
const APP_DESCRIPTION = "Aplikasi tabungan siswa modern untuk pengelolaan keuangan yang lebih mudah dan transparan.";
const APP_URL = process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:9002';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [
      { url: '/logo192.png', sizes: '192x192', type: 'image/png' }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_NAME,
      template: `%s - ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [`${APP_URL}/logo192.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_NAME,
      template: `%s - ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/logo192.png`],
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.variable} bg-background`}>
        <SplashScreen />
        {children}
        <Toaster />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
