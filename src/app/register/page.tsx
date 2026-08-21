'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, CheckCircle2, User } from 'lucide-react';
import styles from '../login/login.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function RegisterPage() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('register_err' as any));
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      
      router.push('/login');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Side - Trust Text */}
      <div className={styles.leftPanel}>
        <h1 className={styles.title} style={{ whiteSpace: 'pre-line' }}>{t('register_title' as any)}</h1>
        <p className={styles.subtitle}>
          {t('register_subtitle' as any)}
        </p>
        <ul className={styles.benefitsList}>
          <li className={styles.benefitItem}><CheckCircle2 size={20} color="var(--primary-color)" /> {t('login_benefit_1' as any)}</li>
          <li className={styles.benefitItem}><CheckCircle2 size={20} color="var(--primary-color)" /> {t('login_benefit_2' as any)}</li>
          <li className={styles.benefitItem}><CheckCircle2 size={20} color="var(--primary-color)" /> {t('login_benefit_3' as any)}</li>
        </ul>
      </div>

      {/* Right Side - Form */}
      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center', color: 'white' }}>{t('register_title' as any)}</h2>
          
          {error && <p style={{ color: '#ff4d4f', marginBottom: '1rem', textAlign: 'center', background: 'rgba(255,77,79,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem' }}>{error}</p>}
          
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('register_name' as any)}</label>
              <div className={styles.inputGroup}>
                <User size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={styles.input}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('register_email' as any)}</label>
              <div className={styles.inputGroup}>
                <Mail size={18} className={styles.inputIcon} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('register_password' as any)}</label>
              <div className={styles.inputGroup}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.toggleBtn}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('register_confirm_password' as any)}</label>
              <div className={styles.inputGroup}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '12px' }}>{t('register_btn' as any)}</button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: 'var(--text-secondary)' }}>
            <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            <span style={{ padding: '0 10px', fontSize: '0.85rem' }}>{t('login_or' as any)}</span>
            <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.socialBtn} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> GitHub
            </button>
            <button className={styles.socialBtn} type="button">
              G Google
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {t('register_already' as any)} <a href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>{t('register_login' as any)}</a>
          </p>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
            {t('login_terms' as any)} <a href="#" style={{textDecoration: 'underline', color: 'inherit'}}>{t('login_tos' as any)}</a> {t('login_and' as any)} <a href="#" style={{textDecoration: 'underline', color: 'inherit'}}>{t('login_privacy' as any)}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
