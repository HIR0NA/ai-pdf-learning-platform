'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, MessageSquare, FileText, LogOut, Clock3, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import styles from './overview.module.css';
import { useLanguage } from '@/context/LanguageContext';

type OverviewData = {
  stats: { documentCount: number; messageCount: number; quizAverage: number | null; quizAttempts: number; studySeconds: number };
  usage: { name: string; queries: number; documents: number }[];
  documents: { id: string; title: string; size: number; createdAt: string; course: { title: string; code: string | null } | null }[];
};

const formatDuration = (seconds: number) => `${Math.floor(seconds / 3600)} ชม. ${Math.floor((seconds % 3600) / 60)} นาที`;

export default function DashboardOverview() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetch('/api/dashboard/overview')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setOverview(data); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = overview?.stats;
  const usageData = overview?.usage ?? [];

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.brand}>
            <div style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--primary-color)', marginRight: 8, boxShadow: '0 0 10px var(--primary-color)' }}></div>
            AgentAI
          </Link>
        </div>
        <nav className={styles.sidebarMenu}>
          <Link href="/dashboard/overview" className={`${styles.menuItem} ${styles.active}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/dashboard" className={styles.menuItem}>
            <MessageSquare size={20} /> ChatAI
          </Link>
          <div style={{ marginTop: 'auto' }}>
            <Link href="/" className={styles.menuItem}>
              <LogOut size={20} /> {t('overview_back_home' as any)}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('overview_welcome' as any)} {session?.user?.name || 'User'}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{t('overview_subtitle' as any)}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>{t('overview_docs' as any)}</span>
              <FileText size={20} color="var(--primary-color)" />
            </div>
            <div className={styles.kpiValue}>{isLoading ? '—' : stats?.documentCount ?? 0} {t('overview_docs_unit' as any)}</div>
            <div className={styles.kpiTrend}>ไฟล์ในบัญชีของคุณ</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>{t('overview_chats' as any)}</span>
              <MessageSquare size={20} color="var(--primary-color)" />
            </div>
            <div className={styles.kpiValue}>{isLoading ? '—' : stats?.messageCount ?? 0}</div>
            <div className={styles.kpiTrend}>ข้อความที่สนทนาจริง</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>{t('overview_time' as any)}</span>
              <Clock3 size={20} color="var(--primary-color)" />
            </div>
            <div className={styles.kpiValue}>{isLoading ? '—' : formatDuration(stats?.studySeconds ?? 0)}</div>
            <div className={styles.kpiTrend}>บันทึกเมื่อเปิดเรียนจากเอกสาร</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>คะแนน Quiz เฉลี่ย</span>
              <Trophy size={20} color="var(--primary-color)" />
            </div>
            <div className={styles.kpiValue}>{isLoading ? '—' : stats?.quizAverage === null || stats?.quizAverage === undefined ? '—' : `${stats.quizAverage}%`}</div>
            <div className={styles.kpiTrend}>{stats?.quizAttempts ? `จาก ${stats.quizAttempts} ครั้งที่ทำ` : 'ยังไม่มีผลการทำ Quiz'}</div>
          </div>
        </div>

        {/* Charts */}
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{t('overview_chart_chat' as any)}</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Line type="monotone" dataKey="queries" stroke="var(--primary-color)" strokeWidth={2} name={t('overview_chart_queries' as any)} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{t('overview_chart_doc' as any)}</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="documents" fill="var(--secondary-color)" name={t('overview_chart_files' as any)} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className={styles.tableSection}>
          <h3 className={styles.chartTitle}>{t('overview_table_title' as any)}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('overview_table_name' as any)}</th>
                  <th>{t('overview_table_date' as any)}</th>
                  <th>{t('overview_table_size' as any)}</th>
                  <th>{t('overview_table_status' as any)}</th>
                </tr>
              </thead>
              <tbody>
                {overview?.documents.map((document) => <tr key={document.id}>
                  <td>{document.title}</td>
                  <td>{new Date(document.createdAt).toLocaleDateString('th-TH')}</td>
                  <td>{(document.size / (1024 * 1024)).toFixed(1)} MB</td>
                  <td><span className={styles.statusBadge}>{document.course ? `${document.course.code ? `${document.course.code} · ` : ''}${document.course.title}` : t('overview_status_done' as any)}</span></td>
                </tr>)}
                {!isLoading && overview?.documents.length === 0 && <tr><td colSpan={4}>ยังไม่มีเอกสารที่อัปโหลด</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
