'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './Navbar.module.css';
import { useLanguage } from '@/context/LanguageContext';

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
          <Link href="/dashboard/overview" className={styles.link}>{t('nav_dashboard_overview' as any)}</Link>
          <Link href="/dashboard" className={styles.link}>{t('nav_chatai' as any)}</Link>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={toggleLanguage} 
            className={styles.langBtn} 
          >
            {language === 'th' ? 'EN' : 'TH'}
          </button>
          
          {session && session.user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: 'var(--primary-color)', fontSize: '0.9rem' }}>
                [{session.user.name || session.user.email}]
              </span>
              <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.menuBtn}>
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.menuBtn}>{t('nav_login')}</Link>
          )}
        </div>
      </nav>
    </div>
  );
}
