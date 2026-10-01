'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import JourneyLoader from '@/components/JourneyLoader';
import styles from './page.module.css';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await signIn('demo', { callbackUrl: '/dashboard' });
    } catch (err) {
      console.error('Demo sign-in failed:', err);
      setDemoLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className={styles.landing}>
        <div className={styles.hero}>
          <JourneyLoader
            message="Checking your session..."
            subMessage="Connecting to your pregnancy journey journal"
            cycle
            size="card"
          />
        </div>
      </main>
    );
  }

  if (session) {
    return null; // Redirecting
  }

  return (
    <main className={styles.landing}>
      <div className={styles.hero}>
        <div className={styles.heroLogoWrapper}>
          <Image
            src="/bump-book.png"
            alt="Bump Book — Your Pregnancy Journey, Beautifully Recorded"
            width={240}
            height={240}
            priority
            className={styles.heroLogoImage}
          />
        </div>
        <p className={styles.heroHandwritten}>a cozy, personal keepsake 🌸</p>
        <h1 className={styles.heroTitle}>
          Your{' '}
          <span className={styles.heroTitleAccent}>Pregnancy Journey</span>
          <br />
          Beautifully Recorded
        </h1>
        <p className={styles.heroSubtitle}>
          A calm, personal journal to record every moment — from first heartbeat
          to delivery day. Your data stays in your own Google Sheet.
        </p>
        <div className={styles.ctaGroup}>
          <button
            className={styles.signInButton}
            onClick={() => signIn('google')}
            id="sign-in-button"
            disabled={demoLoading}
          >
            <svg className={styles.googleIcon} viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <button
            className={styles.demoButton}
            onClick={handleDemoLogin}
            id="demo-button"
            disabled={demoLoading}
            type="button"
          >
            <span className={styles.demoSparkle}>✨</span>
            {demoLoading ? 'Starting Tour...' : 'Explore Live Demo'}
            <span className={styles.demoBadge}>No Sign-In</span>
          </button>
        </div>

        <p className={styles.demoHint}>
          Experience the full journal with pre-filled sample Indian pregnancy records.
        </p>
      </div>

      <div className={styles.features}>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>📊</span>
          <div>
            <p className={styles.featureLabel}>Dashboard</p>
            <p className={styles.featureDesc}>
              Week progress, health stats at a glance
            </p>
          </div>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>📅</span>
          <div>
            <p className={styles.featureLabel}>Timeline</p>
            <p className={styles.featureDesc}>
              Every visit, test, and milestone on one timeline
            </p>
          </div>
        </div>
        <div className={styles.featureCard}>
          <span className={styles.featureIcon}>📈</span>
          <div>
            <p className={styles.featureLabel}>Charts</p>
            <p className={styles.featureDesc}>
              Weight, BP, baby growth trends
            </p>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>Your data stays in your own Google Sheet — always accessible, always yours.</p>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className={styles.footerLink}>
            Terms of Service
          </Link>
        </div>
      </footer>
    </main>
  );
}
