import React from "react";
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Providers } from './providers';
import './globals.css';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Blackbird Tattoo Management System',
  description: 'Premium tattoo shop management system with WhatsApp automation',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/bblogolightmode.png',
        media: '(prefers-color-scheme: light)',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/bblogodarkmode.png',
        media: '(prefers-color-scheme: dark)',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    shortcut: [
      {
        url: '/bblogolightmode.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/bblogodarkmode.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: [
      {
        url: '/bblogolightmode.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/bblogodarkmode.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
