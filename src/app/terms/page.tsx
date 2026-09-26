import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import styles from '@/styles/legal.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service | Bump Book',
  description:
    'Terms of Service and Medical Disclaimer for Bump Book — Pregnancy Journey Tracker.',
};

export default function TermsOfServicePage() {
  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.headerNav}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div className={styles.brandBadge}>
            <Image
              src="/bump-book-icon.png"
              alt="Bump Book Logo"
              width={26}
              height={26}
              className={styles.brandLogoImg}
            />
            <span>Bump Book</span>
          </div>
        </div>

        <main className={styles.card}>
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <Image
                src="/bump-book-icon.png"
                alt="Bump Book Logo"
                width={56}
                height={56}
                priority
                className={styles.pageHeaderLogo}
              />
              <div>
                <h1 className={styles.title}>Terms of Service</h1>
                <p className={styles.lastUpdated}>Bump Book • Last Updated: September 2026</p>
              </div>
            </div>
          </header>

          <section className={styles.section}>
            <div className={styles.warningBox}>
              <div className={styles.warningBoxTitle}>⚠️ Critical Medical Disclaimer</div>
              <div className={styles.warningBoxText}>
                <strong>Bump Book is not a medical device, nor does it provide medical advice, diagnosis, or treatment.</strong>{' '}
                The information, calculations (such as gestational age and estimated due dates), and charts provided within this app are solely for personal organizational and journaling purposes. Always seek the advice of your obstetrician, gynecologist, midwife, or other qualified healthcare provider regarding any pregnancy questions or medical conditions. Never disregard professional medical advice or delay seeking it because of something recorded in this application.
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
            <p className={styles.paragraph}>
              By accessing or using <strong>Bump Book</strong> (&ldquo;the Service&rdquo;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the application.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Description of Service</h2>
            <p className={styles.paragraph}>
              Bump Book is a web application designed to help expecting parents track, organize, and visualize their pregnancy journey—including appointments, vitals (blood pressure, weight), baby growth milestones, kicks, scans, and notes. The application connects directly to your Google account to create and manage spreadsheets in your Google Drive.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. User Accounts & Google Authentication</h2>
            <p className={styles.paragraph}>
              To use the Service, you must sign in with a valid Google account. You are responsible for:
            </p>
            <ul className={styles.list}>
              <li>Maintaining the security of your Google account credentials.</li>
              <li>Ensuring sufficient available storage space in your Google Drive for your data and file uploads.</li>
              <li>All activities and data logged under your authenticated session.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Data Ownership & Storage</h2>
            <p className={styles.paragraph}>
              You retain 100% ownership of all records, notes, photos, and health metrics entered into the application. We claim no intellectual property or ownership rights over your personal content. Because all data is stored directly in your own Google Drive and Google Sheets, you are solely responsible for creating any additional backups or archives you deem necessary.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Acceptable Use</h2>
            <p className={styles.paragraph}>
              You agree not to misuse the Service or attempt to interfere with its normal operation, reverse engineer its source code, or attempt to bypass security measures or Google API quotas.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Disclaimer of Warranties</h2>
            <p className={styles.paragraph}>
              The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or uninterrupted availability. We make no warranty that calculations (e.g. estimated delivery dates) will be error-free.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Limitation of Liability</h2>
            <p className={styles.paragraph}>
              To the fullest extent permitted by applicable law, the creator and contributors of Bump Book shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data or medical complications arising out of or related to your use of or inability to use the Service.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Changes to Terms</h2>
            <p className={styles.paragraph}>
              We reserve the right to modify these Terms of Service at any time. Any changes will be posted to this page with an updated revision date. Your continued use of the application following the posting of revised Terms constitutes your acceptance of the changes.
            </p>
          </section>

          <footer className={styles.footerNav}>
            <span>&copy; {new Date().getFullYear()} Bump Book — Pregnancy Journey Tracker</span>
            <div className={styles.footerLinks}>
              <Link href="/privacy" className={styles.link}>
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/" className={styles.link}>
                Home
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
