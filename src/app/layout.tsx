import type { Metadata } from 'next';
import { Inter, Fraunces, Fredoka, Caveat } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

const playful = Fredoka({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fredoka',
  weight: ['400', '500', '600', '700'],
});

const handwriting = Caveat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://pregnancy-journey-tracker.vercel.app'),
  title: {
    default: 'Bump Book — Pregnancy Journey Tracker',
    template: '%s | Bump Book',
  },
  description:
    'A beautiful personal pregnancy journal to track your health, baby milestones, doctor visits, and more — all stored in your own Google Sheet.',
  keywords: [
    'Bump Book',
    'BumpBook',
    'pregnancy tracker',
    'pregnancy journal',
    'baby tracker',
    'health tracker',
    'prenatal care',
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Bump Book — Your Pregnancy Journey, Beautifully Recorded',
    description:
      'A calm, personal journal to record every moment — from first heartbeat to delivery day. Your data stays in your own Google Sheet.',
    images: [{ url: '/bump-book.png', width: 1254, height: 1254, alt: 'Bump Book — Pregnancy Journey Tracker' }],
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${playful.variable} ${handwriting.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
