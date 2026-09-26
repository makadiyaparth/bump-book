import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
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
    <html lang="en" className={inter.variable}>
      <body>
          <AuthProvider>{children}</AuthProvider>
        </body>
    </html>
  );
}
