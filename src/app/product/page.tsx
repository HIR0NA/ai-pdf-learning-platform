'use client';

import React, { useEffect, useState } from 'react';
import styles from './product.module.css';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setProducts(data.products);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>{t('prod_title' as any)}</h1>
        <p className={styles.subtitle}>{t('prod_subtitle' as any)}</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>{t('loading' as any)}</div>
      ) : (
        <div className={styles.pricingGrid}>
          {products.map((product, index) => {
            const features = JSON.parse(product.features || '[]');
            const isPopular = product.name.includes('Pro');
            
            return (
              <div key={product.id} className={`${styles.pricingCard} ${isPopular ? styles.popular : ''}`}>
                {isPopular && <div className={styles.popularBadge}>{t('prod_popular' as any)}</div>}
                
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardName}>{product.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{product.description}</p>
                  <div className={styles.cardPrice}>
                    {product.price === 0 ? t('prod_free' as any) : `฿${product.price}`}
                    {product.price > 0 && <span> / {product.name.includes('ปี') ? 'ปี' : 'เดือน'}</span>}
                  </div>
                </div>

                <ul className={styles.featuresList}>
                  {features.map((feature: string, idx: number) => (
                    <li key={idx} className={styles.featureItem}>
                      <Check size={18} className={styles.featureIcon} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  href={product.price === 0 ? '/login' : `/checkout?plan=${product.id}`} 
                  className={`btn ${isPopular ? 'btn-primary' : ''}`}
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  {product.price === 0 ? t('prod_start_free' as any) : t('prod_select' as any)}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.reviewsSection}>
        <h2 className={styles.reviewsTitle}>{t('prod_reviews' as any)}</h2>
        <div className={styles.reviewsGrid}>
          {[
            { name: 'Korn', role: 'นักศึกษามหาวิทยาลัย', review: 'ช่วยประหยัดเวลาอ่านชีทสอบได้เยอะมาก สรุปเข้าใจง่ายและทดสอบความรู้ได้จริง' },
            { name: 'Sita', role: 'นักวิจัย', review: 'การดึงข้อมูลจากเอกสาร PDF ทำได้แม่นยำมาก ลดเวลาการทบทวนวรรณกรรมได้มหาศาล' },
            { name: 'Amnart', role: 'พนักงานบริษัท', review: 'สรุปรายงานการประชุมยาวๆ ได้ในไม่กี่นาที คุ้มค่ากับแพ็กเกจ Pro มากครับ' }
          ].map((r, i) => (
            <div key={i} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewAvatar}></div>
                <div>
                  <div className={styles.reviewName}>{r.name}</div>
                  <div className={styles.reviewRole}>{r.role}</div>
                </div>
              </div>
              <div className={styles.stars}>★★★★★</div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>"{r.review}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
