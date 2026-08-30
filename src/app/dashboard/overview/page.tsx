'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, MessageSquare, FileText, Settings, LogOut, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import styles from './overview.module.css';
import { useLanguage } from '@/context/LanguageContext';

const usageData = [
  { name: 'Mon', queries: 40, documents: 2 },
  { name: 'Tue', queries: 30, documents: 1 },
  { name: 'Wed', queries: 20, documents: 0 },
  { name: 'Thu', queries: 27, documents: 3 },
  { name: 'Fri', queries: 18, documents: 1 },
  { name: 'Sat', queries: 23, documents: 2 },
  { name: 'Sun', queries: 34, documents: 4 },
];

export default function DashboardOverview() {
  const { t } = useLanguage();
  const { data: session } = useSession();

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
            <div className={styles.kpiValue}>24 {t('overview_docs_unit' as any)}</div>
            <div className={styles.kpiTrend}><ArrowUpRight size={14} style={{ display: 'inline' }} /> {t('overview_trend_docs' as any)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>{t('overview_chats' as any)}</span>
              <MessageSquare size={20} color="var(--primary-color)" />
            </div>
            <div className={styles.kpiValue}>1,284</div>
            <div className={styles.kpiTrend}><ArrowUpRight size={14} style={{ display: 'inline' }} /> {t('overview_trend_chats' as any)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span>{t('overview_time' as any)}</span>
              <LayoutDashboard size={20} color="var(--primary-color)" />
            </div>
            <div className={styles.kpiValue}>{t('overview_time_unit' as any)}</div>
            <div className={styles.kpiTrend}><ArrowUpRight size={14} style={{ display: 'inline' }} /> {t('overview_trend_time' as any)}</div>
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
                <tr>
                  <td>Machine_Learning_Intro.pdf</td>
                  <td>24 มิ.ย. 2026</td>
                  <td>2.4 MB</td>
                  <td><span className={styles.statusBadge}>{t('overview_status_done' as any)}</span></td>
                </tr>
                <tr>
                  <td>Database_Systems_Ch5.pdf</td>
                  <td>22 มิ.ย. 2026</td>
                  <td>1.1 MB</td>
                  <td><span className={styles.statusBadge}>{t('overview_status_done' as any)}</span></td>
                </tr>
                <tr>
                  <td>Project_Requirements_v2.pdf</td>
                  <td>20 มิ.ย. 2026</td>
                  <td>0.8 MB</td>
                  <td><span className={styles.statusBadge}>{t('overview_status_done' as any)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
