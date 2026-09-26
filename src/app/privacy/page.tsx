import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import styles from '@/styles/legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy | Bump Book',
  description:
    'Learn how Bump Book protects your privacy. All your pregnancy health data is stored strictly in your own Google Drive and Google Sheets.',
};

export default function PrivacyPolicyPage() {
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
                <h1 className={styles.title}>Privacy Policy</h1>
                <p className={styles.lastUpdated}>Bump Book • Last Updated: September 2026</p>
              </div>
            </div>
          </header>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Introduction & Overview</h2>
            <p className={styles.paragraph}>
              At <strong>Bump Book</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the app&rdquo;),
              your privacy and personal health data confidentiality are our top priorities. This Privacy Policy explains how
              our application interacts with your Google account, what data is accessed, and how your information is handled.
            </p>
            <p className={styles.paragraph}>
              Bump Book operates on a strict <strong>&ldquo;Bring Your Own Data&rdquo; (BYOD)</strong> model:
              we do <em>not</em> run or maintain an external database storing your medical records, health vitals, ultrasound images,
              or journal notes. Everything you log is stored directly and exclusively inside <strong>your own Google account</strong>
              (in your Google Drive and Google Sheets).
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Google User Data We Access</h2>
            <p className={styles.paragraph}>
              When you sign in using Google OAuth, our application requests access only to the scopes necessary for its core features:
            </p>
            <ul className={styles.list}>
              <li>
                <strong>Basic Profile and Identity (openid, email, profile):</strong> Used exclusively to authenticate your session
                and display your name and profile avatar inside the app.
              </li>
              <li>
                <strong>Google Drive (drive.file scope):</strong> Allows the application to create and manage <em>only</em> the files
                and folders created by Bump Book (such as your dedicated pregnancy spreadsheet and any ultrasound/report
                files you upload). This scope does <strong>not</strong> grant access to any other files or folders in your Google Drive.
              </li>
              <li>
                <strong>Google Sheets (spreadsheets scope):</strong> Allows the application to create, read, and write entries
                (vitals, appointments, fetal measurements, symptoms, and milestones) within your dedicated pregnancy journal spreadsheet.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <div className={styles.calloutBox}>
              <div className={styles.calloutBoxTitle}>Google API Limited Use Disclosure</div>
              <div className={styles.calloutBoxText}>
                Bump Book&rsquo;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. How Your Data Is Stored & Used</h2>
            <ul className={styles.list}>
              <li>
                <strong>Storage:</strong> All pregnancy-related health data (gestational week, blood pressure, weight, kicks,
                doctor appointments, notes, medications) is saved directly into a spreadsheet titled <em>Bump Book</em> in your personal Google Drive.
              </li>
              <li>
                <strong>No Remote Application Database:</strong> Our application servers operate statelessly. We do not store, copy, or
                replicate your health records onto any third-party database or server.
              </li>
              <li>
                <strong>No Sale or Sharing of Data:</strong> We never sell, rent, monetize, or share your personal or health data with
                advertisers, data brokers, or third-party marketing entities.
              </li>
              <li>
                <strong>No AI Training on Your Records:</strong> Your personal logs, pregnancy timeline, and health metrics are never used to train generalized artificial intelligence models.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Data Retention, Control, and Deletion</h2>
            <p className={styles.paragraph}>
              Because all data resides in your personal Google account, you retain complete and absolute ownership and control over it at all times:
            </p>
            <ul className={styles.list}>
              <li>
                <strong>To Delete Your Data:</strong> You can delete your <em>Bump Book</em> spreadsheet and any uploaded scan files directly from your{' '}
                <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Google Drive
                </a>{' '}
                at any time.
              </li>
              <li>
                <strong>To Revoke Application Access:</strong> You can revoke Bump Book&rsquo;s access to your Google account at any moment via your{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  Google Account Third-Party Access Settings
                </a>.
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Security</h2>
            <p className={styles.paragraph}>
              All communication between your browser, our application, and Google APIs is encrypted in transit using industry-standard
              Transport Layer Security (TLS/HTTPS). Session tokens are cryptographically signed and stored in secure, encrypted HTTP cookies.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Contact Us</h2>
            <p className={styles.paragraph}>
              If you have any questions, feedback, or concerns regarding this Privacy Policy or your data, please contact the developer via our{' '}
              <a
                href="https://github.com/makadiyaparth/pregnancy-journey-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                GitHub Repository
              </a>{' '}
              or by opening an issue.
            </p>
          </section>

          <footer className={styles.footerNav}>
            <span>&copy; {new Date().getFullYear()} Bump Book — Pregnancy Journey Tracker</span>
            <div className={styles.footerLinks}>
              <Link href="/terms" className={styles.link}>
                Terms of Service
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
