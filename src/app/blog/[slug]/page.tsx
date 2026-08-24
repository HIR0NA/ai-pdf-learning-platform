'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import styles from '../blog.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function BlogPostPage() {
  const { t } = useLanguage();
  const params = useParams();
  const { slug } = params;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.post) {
          setPost(data.post);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>{t('loading' as any)}</div>;
  if (!post) return <div style={{ textAlign: 'center', padding: '4rem' }}>{t('not_found' as any)}</div>;

  return (
    <div className={styles.container}>
      <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', textDecoration: 'none', marginBottom: '2rem' }}>
        <ArrowLeft size={18} /> {t('blog_back' as any)}
      </Link>

      <article>
        <header className={styles.postHeader}>
          <div style={{ color: 'var(--primary-color)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {post.category}
          </div>
          <h1 className={styles.postTitle}>{post.title}</h1>
          <div className={styles.postMeta}>
            <span className={styles.postMetaItem}>
              <User size={16} /> {post.authorName}
            </span>
            <span className={styles.postMetaItem}>
              <Calendar size={16} /> {new Date(post.createdAt).toLocaleDateString('th-TH')}
            </span>
            <span className={styles.postMetaItem}>
              <Clock size={16} /> {post.readTime} {t('blog_read_time' as any)}
            </span>
          </div>
        </header>

        <div style={{ width: '100%', height: '400px', background: post.imageUrl ? `url(${post.imageUrl}) center/cover no-repeat` : 'rgba(255,255,255,0.05)', borderRadius: '16px', marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!post.imageUrl && <span style={{opacity: 0.5}}>&lt;IMAGE_COVER/&gt;</span>}
        </div>

        <div className={styles.postContent} style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
        
      </article>
    </div>
  );
}
