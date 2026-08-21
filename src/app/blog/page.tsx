'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Clock, User, Calendar } from 'lucide-react';
import styles from './blog.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function BlogPage() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category)))].filter(Boolean);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          setPosts(data.posts);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || post.excerpt?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('blog_title' as any)}</h1>
        <p className={styles.subtitle}>{t('blog_subtitle' as any)}</p>
        
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder={t('blog_search' as any)} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button 
              key={cat as string} 
              onClick={() => setSelectedCategory(cat as string)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: selectedCategory === cat ? 'var(--primary-color)' : 'rgba(0,0,0,0.2)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {cat === 'All' ? t('blog_filter_all' as any) : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>{t('loading' as any)}</div>
      ) : (
        <div className={styles.blogGrid}>
          {filteredPosts.map(post => (
            <article key={post.id} className={styles.blogCard}>
              <div className={styles.imagePlaceholder} style={post.imageUrl ? { background: `url(${post.imageUrl}) center/cover no-repeat` } : {}}>
                {!post.imageUrl && <span style={{opacity: 0.5}}>&lt;IMAGE/&gt;</span>}
              </div>
              <div className={styles.cardContent}>
                <div className={styles.category}>{post.category}</div>
                <Link href={`/blog/${post.slug}`} className={styles.cardTitle}>
                  {post.title}
                </Link>
                <p className={styles.excerpt}>{post.excerpt}</p>
                
                <div className={styles.cardFooter}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} />
                    {new Date(post.createdAt).toLocaleDateString('th-TH')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} />
                    {post.readTime} {t('blog_read_time' as any)}
                  </span>
                </div>
              </div>
            </article>
          ))}
          {filteredPosts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
              {t('not_found' as any)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
