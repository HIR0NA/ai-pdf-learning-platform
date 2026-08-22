'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const team = [
    {
      name: 'นายกาณฑ์ ยอดเกวียน',
      role: 'Developer / Security Engineer',
      emoji: '👨‍💻'
    },
    {
      name: 'นางสาววริศรา ชูเรืองสกุล',
      role: 'UI/UX Designer / Frontend Developer',
      emoji: '👩‍🎨'
    },
    {
      name: 'นายสิรภัทร พัวเผ่า',
      role: 'AI / Backend Engineer',
      emoji: '👨‍🔬'
    }
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <h3 className="text-gradient">&lt;AI_PDF_LEARN/&gt;</h3>
          <p className={styles.tagline}>{t('about_subtitle') || 'Secure AI-powered platform for PDF learning and analysis.'}</p>
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>เมนูลัด</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><Link href="/product" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>บริการและราคา</Link></li>
              <li><Link href="/blog" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>บทความความรู้</Link></li>
              <li><Link href="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>ติดต่อเรา</Link></li>
              <li><Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>แดชบอร์ดแชท</Link></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.teamSection}>
          <h4 className={styles.teamTitle}>[ SYSTEM_CREATORS ]</h4>
          <div className={styles.teamGrid}>
            {team.map((member, index) => (
              <div key={index} className={styles.member}>
                <span className={styles.emoji}>{member.emoji}</span>
                <div className={styles.details}>
                  <span className={styles.name}>{member.name}</span>
                  <span className={styles.role}>{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <p>&copy; {new Date().getFullYear()} AI PDF Learn. All rights reserved.</p>
        <p className="text-cyan">SYSTEM.STATUS: ONLINE</p>
      </div>
    </footer>
  );
}
