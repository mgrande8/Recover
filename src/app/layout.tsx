import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ui';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { PushNotificationHandler } from '@/components/PushNotificationHandler';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Recover - Sleep Better, Perform Better',
    template: '%s | Recover',
  },
  description:
    'Track your sleep, understand your patterns, and wake up knowing exactly how ready you are for the day ahead.',
  keywords: ['sleep tracking', 'recovery score', 'sleep app', 'health', 'wellness'],
  authors: [{ name: 'Recover' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Recover',
  },
  openGraph: {
    title: 'Recover - Sleep Better, Perform Better',
    description: 'Track your sleep and optimize your recovery.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0E1A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ServiceWorkerRegistration />
        <PushNotificationHandler />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
