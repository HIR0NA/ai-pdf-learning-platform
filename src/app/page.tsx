'use client';

import Link from "next/link";
import styles from "./page.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { Zap, Shield, Brain } from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className={styles.main}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span> {t('home_badge')}
          </div>
          <h1 className={styles.title}>
            {t('home_title_1')} <br />
            <span className={styles.titleHighlight}>{t('home_title_highlight_new')}</span><br />
            {t('home_title_2')}
          </h1>
          <p className={styles.subtitle}>
            {t('home_subtitle_new')}
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '14px 32px' }}>
              {t('home_btn_start')}
            </Link>
            <Link href="#features" className="btn" style={{ padding: '14px 32px' }}>
              {t('home_btn_explore')}
            </Link>
          </div>
        </div>
        
        <div className={styles.heroGraphic}>
          {/* Abstract glowing orb to replace jellyfish */}
          <div className={styles.orb}></div>
          <div className={styles.orbCore}></div>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('stat_1_label')}</div>
          <div className={styles.statValue}>{t('stat_1_val')}</div>
          <div className={styles.statSub}>{t('stat_1_sub')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('stat_2_label')}</div>
          <div className={styles.statValue}>{t('stat_2_val')}</div>
          <div className={styles.statSub}>{t('stat_2_sub')}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{t('stat_3_label')}</div>
          <div className={styles.statValue}>{t('stat_3_val')}</div>
          <div className={styles.statSub}>{t('stat_3_sub')}</div>
        </div>
        <div className={styles.statCardFeature}>
          <div className={styles.statValue}>{t('stat_4_val')}</div>
          <div className={styles.statLabel}>{t('stat_4_label')}</div>
          <div className={styles.statSub}>{t('stat_4_sub')}</div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefitsSection}>
        <h2 className={styles.benefitsTitle}>ทำไมต้องเลือก AgentAI?</h2>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Zap size={24} /></div>
            <h3>วิเคราะห์รวดเร็ว</h3>
            <p>ประหยัดเวลาอ่านเอกสารเป็นชั่วโมง ให้ AI ช่วยสรุปใจความสำคัญและดึงข้อมูลที่คุณต้องการได้ในไม่กี่วินาที</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Brain size={24} /></div>
            <h3>ผู้ช่วยส่วนตัวอัจฉริยะ</h3>
            <p>ไม่เพียงแค่สรุป แต่สามารถสนทนาและโต้ตอบกับเอกสารของคุณได้เสมือนมีผู้เชี่ยวชาญอยู่เคียงข้าง</p>
          </div>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}><Shield size={24} /></div>
            <h3>ปลอดภัยและเป็นส่วนตัว</h3>
            <p>ข้อมูลและเอกสารของคุณจะถูกจัดเก็บอย่างปลอดภัย เราให้ความสำคัญกับความเป็นส่วนตัวสูงสุด</p>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className={styles.trustSection}>
        <h3 className={styles.trustTitle}>ระบบเทคโนโลยีที่ได้รับความไว้วางใจ</h3>
        <div className={styles.partnerLogos}>
          <span className={styles.partnerLogo}>Google Cloud</span>
          <span className={styles.partnerLogo}>Prisma</span>
          <span className={styles.partnerLogo}>Next.js</span>
          <span className={styles.partnerLogo}>Gemini</span>
        </div>
      </section>

      {/* Statement Section */}
      <section className={styles.statementSection}>
        <h2 className={styles.statementText}>
          {t('statement_1')} <span className={styles.textAccent}>{t('statement_hl_1')}</span> {t('statement_2')} <span className={styles.textAccent}>{t('statement_hl_2')}</span> {t('statement_3')}
        </h2>
      </section>

      {/* Lower Bento Grid */}
      <section className={styles.lowerBento} id="features">
        <div className={styles.bentoLarge}>
          <div className={styles.badge} style={{marginBottom: '1rem'}}>
            <span className={styles.badgeDot}></span> {t('bento_badge')}
          </div>
          <h3>{t('bento_title_1')}</h3>
          <p className="text-secondary" style={{marginTop: '0.5rem', marginBottom: '2rem'}}>{t('bento_desc_1')}</p>
          <div className={styles.bentoImagePlaceholder}>
             <div className={styles.mockupUI}></div>
          </div>
        </div>
        <div className={styles.bentoSmallGroup}>
          <div className={styles.bentoSmall}>
            <p className="text-secondary" style={{fontSize: '0.9rem', marginBottom: '1rem'}}>{t('bento_title_2')}</p>
            <div className={styles.statValue} style={{fontSize: '3.5rem'}}>Gemini</div>
            <p style={{marginTop: '0.5rem'}}>{t('bento_desc_2')}</p>
          </div>
          <div className={styles.bentoSmall}>
             <p className="text-secondary" style={{fontSize: '0.9rem', marginBottom: '1rem'}}>{t('testimonial_text')}</p>
             <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'auto'}}>
               <div className={styles.avatar}></div>
               <div>
                 <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>Alex Chen</div>
                 <div className="text-secondary" style={{fontSize: '0.8rem'}}>{t('testimonial_role')}</div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>{t('faq_title' as any)}</h2>
        
        <details className={styles.faqItem}>
          <summary>{t('faq_q1' as any)}</summary>
          <div className={styles.faqAnswer}>{t('faq_a1' as any)}</div>
        </details>
        
        <details className={styles.faqItem}>
          <summary>{t('faq_q2' as any)}</summary>
          <div className={styles.faqAnswer}>{t('faq_a2' as any)}</div>
        </details>
        
        <details className={styles.faqItem}>
          <summary>{t('faq_q3' as any)}</summary>
          <div className={styles.faqAnswer}>{t('faq_a3' as any)}</div>
        </details>
        
        <details className={styles.faqItem}>
          <summary>{t('faq_q4' as any)}</summary>
          <div className={styles.faqAnswer}>{t('faq_a4' as any)}</div>
        </details>
      </section>

    </div>
  );
}
