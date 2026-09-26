import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces, Caveat } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const handwriting = Caveat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-handwriting',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Pregnancy Journey Tracker',
  description:
    'A beautiful personal pregnancy journal to track your health, baby milestones, doctor visits, and more — all stored in your own Google Sheet.',
  keywords: [
    'pregnancy tracker',
    'pregnancy journal',
    'baby tracker',
    'health tracker',
    'prenatal care',
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${handwriting.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
