'use client';

import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import styles from './contact.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: false });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ loading: false, error: '', success: true });
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus({ loading: false, error: data.error, success: false });
      }
    } catch (error) {
      setStatus({ loading: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', success: false });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('contact_title' as any)}</h1>
        <p className={styles.subtitle}>{t('contact_subtitle' as any)}</p>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.contactInfo}>
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}><MapPin size={24} /></div>
            <div className={styles.infoDetails}>
              <h3>{t('contact_address' as any)}</h3>
              <p>อาคารวิทยบริการ มหาวิทยาลัยสวนดุสิต<br/>ถ.ราชสีมา แขวงดุสิต เขตดุสิต กทม. 10300</p>
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}><Mail size={24} /></div>
            <div className={styles.infoDetails}>
              <h3>{t('contact_email' as any)}</h3>
              <p>support@aipdflearn.com<br/>contact@aipdflearn.com</p>
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}><Phone size={24} /></div>
            <div className={styles.infoDetails}>
              <h3>{t('contact_phone' as any)}</h3>
              <p>02-244-xxxx<br/>เปิดทำการ จันทร์-ศุกร์ (9.00 - 17.00 น.)</p>
            </div>
          </div>
        </div>

        <div className={styles.formWrapper}>
          <h2 style={{ marginBottom: '2rem' }}>{t('contact_form_title' as any)}</h2>
          
          {status.success && <div style={{ padding: '1rem', background: 'rgba(0, 255, 0, 0.1)', color: '#4ade80', borderRadius: '8px', marginBottom: '1.5rem' }}>ส่งข้อความสำเร็จ! ทีมงานจะติดต่อกลับโดยเร็วที่สุด</div>}
          {status.error && <div style={{ padding: '1rem', background: 'rgba(255, 0, 0, 0.1)', color: '#ff4d4f', borderRadius: '8px', marginBottom: '1.5rem' }}>{status.error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>ชื่อ - นามสกุล</label>
              <input 
                type="text" 
                required
                className={styles.input} 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>อีเมล</label>
              <input 
                type="email" 
                required
                className={styles.input} 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>ข้อความของคุณ</label>
              <textarea 
                required
                className={styles.textarea}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '10px' }} disabled={status.loading}>
              <Send size={20} /> {status.loading ? t('loading' as any) : t('contact_send' as any)}
            </button>
          </form>
        </div>
      </div>

      <div className={styles.faqSection}>
        <h2 className={styles.faqTitle}>{t('contact_faq' as any)}</h2>
        <div className={styles.faqGrid}>
          {[
            { q: 'ใช้งาน AgentAI ได้ฟรีหรือไม่?', a: 'เรามีแพ็กเกจ Basic ให้ทดลองใช้งานฟรี โดยระบบรองรับไฟล์ PDF ขนาดไม่เกิน 10MB ต่อไฟล์' },
            { q: 'ข้อมูลของฉันจะปลอดภัยไหม?', a: 'ไฟล์ถูกแยกตามบัญชีและลบได้ทุกเวลา เมื่อสั่งงาน AI ระบบจะส่งข้อความที่จำเป็นไปยังผู้ให้บริการที่คุณเลือก โดยการเก็บรักษาและการใช้ข้อมูลเป็นไปตามเงื่อนไข API ของผู้ให้บริการนั้น' },
            { q: 'รองรับไฟล์ภาษาไทยได้ดีแค่ไหน?', a: 'ระบบเรารองรับภาษาไทยอย่างสมบูรณ์แบบ ทั้งการอ่าน สรุปเนื้อหา และถามตอบครับ' }
          ].map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <div className={styles.faqQuestion}>{faq.q}</div>
              <div className={styles.faqAnswer}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
