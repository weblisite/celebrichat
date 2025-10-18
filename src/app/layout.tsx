import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Next App Router Starter',
    template: '%s | Next App Router Starter',
  },
  description: 'A minimal Next.js 14 App Router starter with TypeScript, TailwindCSS, ESLint, Prettier, and testing setup.',
  applicationName: 'Next App Router Starter',
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Next App Router Starter',
    description:
      'A minimal Next.js 14 App Router starter with TypeScript, TailwindCSS, ESLint, Prettier, and testing setup.',
    siteName: 'Next App Router Starter',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next App Router Starter',
    description:
      'A minimal Next.js 14 App Router starter with TypeScript, TailwindCSS, ESLint, Prettier, and testing setup.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#111827' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
