'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './Navbar.module.css';
import { useLanguage } from '@/context/LanguageContext';
import { GraduationCap, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { language, toggleLanguage, t } = useLanguage();
  const { data: session } = useSession();

  return (
    <div className={styles.navbarWrapper}>
      <nav className={styles.navbar}>
        <div className={styles.logoContainer}>
          <div className={styles.logoDot}></div>
          <Link href="/" className={styles.logo}>
            AgentAI {/* Replaced <AI_PDF_LEARN/> with clean text */}
          </Link>
        </div>
        
        <div className={styles.links}>
          <Link href="/" className={styles.link}>{t('nav_home')}</Link>
          <Link href="/about" className={styles.link}>{t('nav_about')}</Link>
          <Link href="/product" className={styles.link}>{t('nav_product' as any)}</Link>
          <Link href="/blog" className={styles.link}>{t('nav_blog' as any)}</Link>
          <Link href="/contact" className={styles.link}>{t('nav_contact' as any)}</Link>
          {session?.user.role === 'ADMIN' ? (
            <>
              <Link href="/admin" className={`${styles.link} ${styles.roleLink}`}><ShieldCheck size={15} /> Admin Console</Link>
              <Link href="/dashboard" className={styles.link}>{t('nav_chatai' as any)}</Link>
            </>
          ) : session?.user ? (
            <>
              <Link href="/dashboard/overview" className={`${styles.link} ${styles.roleLink}`}><GraduationCap size={15} /> Student Overview</Link>
              <Link href="/dashboard" className={styles.link}>{t('nav_chatai' as any)}</Link>
            </>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button 
            onClick={toggleLanguage} 
            className={styles.langBtn} 
          >
            {language === 'th' ? 'EN' : 'TH'}
          </button>
          
          {session && session.user ? (
            <div className={styles.authenticatedActions}>
              <span className={styles.userName}>
                [{session.user.name || session.user.email}]
              </span>
              <span className={`${styles.roleBadge} ${session.user.role === 'ADMIN' ? styles.adminBadge : styles.studentBadge}`}>
                {session.user.role}
              </span>
              <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.menuBtn}>
                Logout
              </button>
            </div>
          ) : (
            <div className={styles.guestActions}>
              <Link href="/login" className={styles.loginLink}>{t('nav_login')}</Link>
              <Link href="/register" className={styles.menuBtn}>สมัครฟรี</Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
