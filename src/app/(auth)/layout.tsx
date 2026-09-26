'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  Plus,
  Settings,
  LogOut,
} from 'lucide-react';
import JourneyLoader from '@/components/JourneyLoader';
import styles from './layout.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/charts', label: 'Charts', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className={styles.authLayout}>
        <main className={styles.mainContent} style={{ marginLeft: 0 }}>
          <JourneyLoader
            message="Connecting to your pregnancy journal..."
            subMessage="Securing session with Google Drive & Sheets"
            cycle
            size="fullPage"
          />
        </main>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className={styles.authLayout}>
      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.sidebarLogo}>
          <Image
            src="/bump-book-icon.png"
            alt="Bump Book Logo"
            width={40}
            height={40}
            className={styles.sidebarLogoImg}
          />
          <div>
            <span className={styles.logoText}>Bump Book</span>
            <span className={styles.logoTextAccent}>Journey Tracker</span>
          </div>
        </Link>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${
                isActive(item.href) ? styles.navLinkActive : ''
              }`}
            >
              <item.icon className={styles.navIcon} />
              {item.label}
            </Link>
          ))}

          <div className={styles.navDivider} />

          <Link
            href="/add"
            className={`${styles.navLink} ${
              isActive('/add') ? styles.navLinkActive : ''
            }`}
          >
            <Plus className={styles.navIcon} />
            Add Record
          </Link>

          <div className={styles.navDivider} />

          <Link
            href="/settings"
            className={`${styles.navLink} ${
              isActive('/settings') ? styles.navLinkActive : ''
            }`}
          >
            <Settings className={styles.navIcon} />
            Settings
          </Link>
        </nav>

        <div className={styles.sidebarUser}>
          {session.user?.image && (
            <img
              src={session.user.image}
              alt=""
              className={styles.userAvatar}
              referrerPolicy="no-referrer"
            />
          )}
          <div className={styles.userInfo}>
            <p className={styles.userName}>{session.user?.name}</p>
            <p className={styles.userEmail}>{session.user?.email}</p>
          </div>
          <button
            className={styles.signOutButton}
            onClick={() => signOut({ callbackUrl: '/' })}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <Link href="/dashboard" className={styles.mobileLogoLink}>
          <Image
            src="/bump-book-icon.png"
            alt="Bump Book Logo"
            width={32}
            height={32}
            className={styles.mobileLogoImg}
          />
          <span className={styles.mobileLogoText}>Bump Book</span>
        </Link>
        {session.user?.image && (
          <Link href="/settings">
            <img
              src={session.user.image}
              alt=""
              className={styles.mobileAvatar}
              referrerPolicy="no-referrer"
            />
          </Link>
        )}
      </header>

      {/* Main content */}
      <main className={styles.mainContent}>{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <div className={styles.bottomNavInner}>
          <Link
            href="/dashboard"
            className={`${styles.bottomNavLink} ${
              isActive('/dashboard') ? styles.bottomNavLinkActive : ''
            }`}
          >
            <LayoutDashboard className={styles.bottomNavIcon} />
            Dashboard
          </Link>
          <Link
            href="/timeline"
            className={`${styles.bottomNavLink} ${
              isActive('/timeline') ? styles.bottomNavLinkActive : ''
            }`}
          >
            <Clock className={styles.bottomNavIcon} />
            Timeline
          </Link>

          {/* Elevated Center Add Button */}
          <Link
            href="/add"
            className={`${styles.bottomNavAddBtn} ${
              isActive('/add') ? styles.bottomNavAddBtnActive : ''
            }`}
            title="Add Record"
          >
            <Plus size={22} />
          </Link>

          <Link
            href="/charts"
            className={`${styles.bottomNavLink} ${
              isActive('/charts') ? styles.bottomNavLinkActive : ''
            }`}
          >
            <BarChart3 className={styles.bottomNavIcon} />
            Charts
          </Link>
          <Link
            href="/settings"
            className={`${styles.bottomNavLink} ${
              isActive('/settings') ? styles.bottomNavLinkActive : ''
            }`}
          >
            <Settings className={styles.bottomNavIcon} />
            Settings
          </Link>
        </div>
      </nav>
    </div>
  );
}
