'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, QrCode, Building, CheckCircle2, Lock } from 'lucide-react';
import styles from './checkout.module.css';
import { useLanguage } from '@/context/LanguageContext';

function CheckoutContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const planId = searchParams.get('plan') || 'pro';
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'promptpay' | 'bank'>('card');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  // Mock product details
  const planName = planId.toLowerCase().includes('pro') ? 'Pro Package' : 'Basic Package';
  const planPrice = planId.toLowerCase().includes('pro') ? 199 : 0;
  const multiplier = billingCycle === 'yearly' ? 10 : 1; // 2 months free for yearly
  const total = planPrice * multiplier;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        router.push('/dashboard/overview');
      }, 2000);
    }, 2000);
  };

  if (status === 'success') {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CheckCircle2 size={80} color="#4ade80" style={{ marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t('checkout_success' as any)}</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('checkout_title' as any)}</h1>
        <p className={styles.subtitle}>{t('checkout_subtitle' as any)}</p>
      </div>

      <form onSubmit={handlePayment} className={styles.checkoutWrapper}>
        
        {/* Left Column */}
        <div>
          {/* Billing Info */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>{t('checkout_billing_info' as any)}</h2>
            <div className={styles.inputGroup}>
              <label>{t('checkout_name' as any)}</label>
              <input type="text" className={styles.input} required placeholder={language === 'th' ? 'สมชาย ใจดี' : 'John Doe'} />
            </div>
            <div className={styles.inputGroup}>
              <label>{t('login_email' as any)}</label>
              <input type="email" className={styles.input} required placeholder="name@example.com" />
            </div>
            <div className={styles.inputGroup}>
              <label>{t('checkout_address' as any)}</label>
              <textarea className={styles.input} rows={3} required placeholder={language === 'th' ? 'ที่อยู่สำหรับออกใบเสร็จ...' : 'Billing address...'}></textarea>
            </div>
          </div>

          {/* Payment Method */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>{t('checkout_payment_method' as any)}</h2>
            <div className={styles.paymentMethods}>
              <div 
                className={`${styles.paymentCard} ${paymentMethod === 'card' ? styles.active : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={24} className={styles.paymentIcon} />
                <span>{t('checkout_card' as any)}</span>
              </div>
              <div 
                className={`${styles.paymentCard} ${paymentMethod === 'promptpay' ? styles.active : ''}`}
                onClick={() => setPaymentMethod('promptpay')}
              >
                <QrCode size={24} className={styles.paymentIcon} />
                <span>{t('checkout_promptpay' as any)}</span>
              </div>
              <div 
                className={`${styles.paymentCard} ${paymentMethod === 'bank' ? styles.active : ''}`}
                onClick={() => setPaymentMethod('bank')}
              >
                <Building size={24} className={styles.paymentIcon} />
                <span>{t('checkout_bank' as any)}</span>
              </div>
            </div>

            {/* Dynamic Payment Details */}
            {paymentMethod === 'card' && (
              <div style={{ marginTop: '1.5rem' }}>
                <div className={styles.inputGroup}>
                  <label>Card Number</label>
                  <input type="text" className={styles.input} placeholder="0000 0000 0000 0000" required={paymentMethod === 'card'} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.inputGroup}>
                    <label>Expiry Date</label>
                    <input type="text" className={styles.input} placeholder="MM/YY" required={paymentMethod === 'card'} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>CVC</label>
                    <input type="text" className={styles.input} placeholder="123" required={paymentMethod === 'card'} />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'promptpay' && (
              <div className={styles.qrContainer}>
                <div className={styles.qrImage}>
                  <QrCode size={100} color="#666" />
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>Scan with any mobile banking app</p>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className={styles.bankDetails}>
                <div className={styles.bankRow}>
                  <span style={{ color: 'var(--text-secondary)' }}>Bank Name</span>
                  <span style={{ color: 'white' }}>Kasikorn Bank</span>
                </div>
                <div className={styles.bankRow}>
                  <span style={{ color: 'var(--text-secondary)' }}>Account Name</span>
                  <span style={{ color: 'white' }}>AgentAI Co., Ltd.</span>
                </div>
                <div className={styles.bankRow} style={{ marginBottom: 0 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Account No.</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>123-4-56789-0</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Summary */}
        <div className={styles.summarySection}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: '2rem' }}>{t('checkout_summary_title' as any)}</h2>
          
          <div className={styles.summaryRow}>
            <span>{t('checkout_plan' as any)}</span>
            <span className={styles.summaryValue}>{planName}</span>
          </div>

          <div className={styles.summaryRow} style={{ alignItems: 'center' }}>
            <span>{t('checkout_billing' as any)}</span>
            <select 
              className={styles.input} 
              style={{ width: 'auto', padding: '5px 10px' }}
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as any)}
            >
              <option value="monthly">{t('checkout_monthly' as any)}</option>
              <option value="yearly">{t('checkout_yearly' as any)}</option>
            </select>
          </div>

          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>{t('checkout_total' as any)}</span>
            <span>฿{total.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', justifyContent: 'center' }}>
            <Lock size={14} /> <span>Secure 256-bit SSL Encryption</span>
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary ${styles.payButton}`}
            disabled={status === 'processing'}
          >
            {status === 'processing' ? t('checkout_processing' as any) : t('checkout_pay_now' as any)}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
