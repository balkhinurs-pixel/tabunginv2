
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const APP_NAME = "Tabungin";
const APP_DESCRIPTION = "Aplikasi tabungan siswa modern untuk pengelolaan keuangan yang lebih mudah dan transparan.";
const APP_URL = "https://tabungin.com"; // Ganti dengan URL produksi Anda nanti

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
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
    images: [`${APP_URL}/opengraph-image.png`], // Tautan absolut ke gambar
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_NAME,
      template: `%s - ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: [`${APP_URL}/opengraph-image.png`], // Tautan absolut ke gambar
  },
};

export const viewport: Viewport = {
  themeColor: "#1E40AF",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`font-sans antialiased ${inter.variable} bg-background`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
