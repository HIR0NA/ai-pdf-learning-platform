'use client';

import React from 'react';
import { Target } from 'lucide-react';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);
import styles from './about.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
  const { t, language } = useLanguage();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('about_title' as any)}</h1>
        <p className={styles.subtitle}>{t('about_subtitle_page' as any)}</p>
      </div>

      <div className={styles.missionSection}>
        <Target size={48} color="var(--primary-color)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 className={styles.missionTitle}>{t('about_mission_title' as any)}</h2>
        <p className={styles.missionDesc}>{t('about_mission_desc' as any)}</p>
      </div>

      <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem' }}>{t('about_team_title' as any)}</h2>
      
      <div className={styles.teamGrid}>
        {/* Member 1 */}
        <div className={styles.teamCard}>
          <div className={styles.avatar}>
             <span style={{fontSize: '3rem'}}>K</span>
          </div>
          <h3 className={styles.memberName} style={{ fontSize: '1.2rem' }}>{language === 'th' ? 'นายกาณฑ์ ยอดเกวียน' : 'Karn Yodkwian'}</h3>
          <p className={styles.memberRole}>{t('about_team_dev' as any)}</p>
          <div className={styles.socialLinks}>
            <GithubIcon className={styles.socialIcon} />
            <LinkedinIcon className={styles.socialIcon} />
            <TwitterIcon className={styles.socialIcon} />
          </div>
        </div>

        {/* Member 2 */}
        <div className={styles.teamCard}>
          <div className={styles.avatar} style={{ background: 'linear-gradient(135deg, #4ade80, #3b82f6)' }}>
             <span style={{fontSize: '3rem'}}>W</span>
          </div>
          <h3 className={styles.memberName} style={{ fontSize: '1.2rem' }}>{language === 'th' ? 'นางสาววริศรา ชูเรืองสกุล' : 'Warisara Churuangsakul'}</h3>
          <p className={styles.memberRole}>{t('about_team_design' as any)}</p>
          <div className={styles.socialLinks}>
            <GithubIcon className={styles.socialIcon} />
            <LinkedinIcon className={styles.socialIcon} />
          </div>
        </div>

        {/* Member 3 */}
        <div className={styles.teamCard}>
          <div className={styles.avatar} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
             <span style={{fontSize: '3rem'}}>S</span>
          </div>
          <h3 className={styles.memberName} style={{ fontSize: '1.2rem' }}>{language === 'th' ? 'นายสิรภัทร พัวเผ่า' : 'Siraphat Puaphao'}</h3>
          <p className={styles.memberRole}>{t('about_team_research' as any)}</p>
          <div className={styles.socialLinks}>
            <LinkedinIcon className={styles.socialIcon} />
            <TwitterIcon className={styles.socialIcon} />
          </div>
        </div>
      </div>
    </div>
  );
}
