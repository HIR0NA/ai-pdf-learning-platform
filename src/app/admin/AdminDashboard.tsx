'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowUpRight, Bot, FileDown, LayoutDashboard, LogOut, Search, ShieldAlert, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import styles from './admin.module.css';

type Counts = {
  users: number;
  documents: number;
  messages: number;
  learningTools: number;
  failedLogins: number;
  lockedUsers: number;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  _count: { documents: number; messages: number; tools: number };
};

type LoginLog = {
  id: string;
  email: string | null;
  ipAddress: string | null;
  success: boolean;
  createdAt: string;
};

type Props = { adminName: string; counts: Counts; users: AdminUser[]; loginLogs: LoginLog[] };

const shortDate = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
const fullDate = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export default function AdminDashboard({ adminName, counts, users, loginLogs }: Props) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'STUDENT'>('ALL');

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesQuery = !normalizedQuery || `${user.name ?? ''} ${user.email ?? ''}`.toLowerCase().includes(normalizedQuery);
      return matchesRole && matchesQuery;
    });
  }, [query, roleFilter, users]);

  const loginSeries = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return { key: date.toISOString().slice(0, 10), name: shortDate.format(date), logins: 0 };
    });
    const byDay = new Map(days.map((day) => [day.key, day]));
    loginLogs.forEach((log) => {
      const day = byDay.get(new Date(log.createdAt).toISOString().slice(0, 10));
      if (day) day.logins += 1;
    });
    return days;
  }, [loginLogs]);

  const roleSeries = useMemo(() => [
    { name: 'Student', total: users.filter((user) => user.role === 'STUDENT').length },
    { name: 'Admin', total: users.filter((user) => user.role === 'ADMIN').length },
  ], [users]);

  function exportUsers() {
    const header = ['Name', 'Email', 'Role', 'Documents', 'Messages', 'Created At'];
    const rows = filteredUsers.map((user) => [
      user.name ?? '-', user.email ?? '-', user.role, user._count.documents, user._count.messages,
      fullDate.format(new Date(user.createdAt)),
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-users-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.brand}>&lt;AI_PDF_LEARN/&gt;</Link>
        </div>
        <nav className={styles.sidebarMenu} aria-label="Admin navigation">
          <a href="#overview" className={`${styles.menuItem} ${styles.active}`}><LayoutDashboard size={20} /> Dashboard</a>
          <a href="#users" className={styles.menuItem}><Users size={20} /> ผู้ใช้งาน</a>
          <a href="#security" className={styles.menuItem}><ShieldAlert size={20} /> Security Logs</a>
          <a href="#ai-usage" className={styles.menuItem}><Bot size={20} /> AI Usage</a>
          <div className={styles.menuBottom}>
            <Link href="/" className={styles.menuItem}><LogOut size={20} /> กลับหน้าแรก</Link>
          </div>
        </nav>
      </aside>

      <main className={styles.mainContent} id="overview">
        <header className={styles.header}>
          <div>
            <div className={styles.titleLine}>
              <h1 className={styles.title}>ยินดีต้อนรับ, {adminName}</h1>
              <span className={styles.adminBadge}>ADMIN</span>
            </div>
            <p className={styles.subtitle}>ภาพรวมผู้ใช้งาน ความปลอดภัย และการใช้ AI ภายในระบบ</p>
          </div>
          <button type="button" className={styles.exportButton} onClick={exportUsers}><FileDown size={18} /> Export Report</button>
        </header>

        <section className={styles.kpiGrid} aria-label="Admin overview">
          <article className={styles.kpiCard}>
            <div className={styles.kpiHeader}><span>ผู้ใช้งานทั้งหมด</span><Users size={20} /></div>
            <strong className={styles.kpiValue}>{counts.users.toLocaleString('th-TH')} คน</strong>
            <span className={styles.kpiTrend}><ArrowUpRight size={14} /> {counts.lockedUsers} บัญชีถูกล็อก</span>
          </article>
          <article className={styles.kpiCard} id="ai-usage">
            <div className={styles.kpiHeader}><span>ข้อความที่ใช้ AI</span><Bot size={20} /></div>
            <strong className={styles.kpiValue}>{counts.messages.toLocaleString('th-TH')}</strong>
            <span className={styles.kpiTrend}><ArrowUpRight size={14} /> {counts.documents} เอกสารในระบบ</span>
          </article>
          <article className={styles.kpiCard}>
            <div className={styles.kpiHeader}><span>เหตุการณ์ที่ต้องตรวจสอบ</span><ShieldAlert size={20} /></div>
            <strong className={styles.kpiValue}>{counts.failedLogins.toLocaleString('th-TH')} รายการ</strong>
            <span className={counts.failedLogins > 0 ? styles.kpiWarning : styles.kpiTrend}>
              <Activity size={14} /> {counts.failedLogins > 0 ? 'มี Login ไม่สำเร็จ' : 'ระบบทำงานปกติ'}
            </span>
          </article>
        </section>

        <section className={styles.chartsGrid}>
          <article className={styles.chartCard}>
            <h2 className={styles.chartTitle}>สถิติการเข้าสู่ระบบ (7 วันย้อนหลัง)</h2>
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loginSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis allowDecimals={false} stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Line type="monotone" dataKey="logins" stroke="var(--primary-color)" strokeWidth={2} name="จำนวนครั้ง" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className={styles.chartCard}>
            <h2 className={styles.chartTitle}>ผู้ใช้งานแยกตาม Role</h2>
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis allowDecimals={false} stroke="var(--text-secondary)" />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="total" fill="var(--secondary-color)" name="ผู้ใช้" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className={styles.tableSection} id="users">
          <div className={styles.tableHeader}>
            <div><h2 className={styles.chartTitle}>บัญชีผู้ใช้งานล่าสุด</h2><p>ค้นหา ตรวจสอบ Role และกิจกรรมของบัญชีในระบบ</p></div>
            <div className={styles.tableTools}>
              <label className={styles.searchBox}><Search size={17} /><span className={styles.srOnly}>ค้นหาผู้ใช้</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อหรืออีเมล" /></label>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)} aria-label="กรองตาม Role">
                <option value="ALL">ทุก Role</option><option value="STUDENT">Student</option><option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>ผู้ใช้งาน</th><th>Role</th><th>เอกสาร</th><th>ข้อความ</th><th>สร้างเมื่อ</th></tr></thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name || '-'}</strong><small>{user.email || '-'}</small></td>
                    <td><span className={user.role === 'ADMIN' ? styles.adminRole : styles.studentRole}>{user.role}</span></td>
                    <td>{user._count.documents}</td><td>{user._count.messages}</td><td>{fullDate.format(new Date(user.createdAt))}</td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && <tr><td colSpan={5} className={styles.empty}>ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.tableSection} id="security">
          <div className={styles.tableHeader}><div><h2 className={styles.chartTitle}>Security Logs ล่าสุด</h2><p>เหตุการณ์เข้าสู่ระบบที่ Admin ควรตรวจสอบ</p></div></div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>เวลา</th><th>Email</th><th>IP Address</th><th>ผลลัพธ์</th></tr></thead>
              <tbody>
                {loginLogs.slice(0, 8).map((log) => (
                  <tr key={log.id}><td>{fullDate.format(new Date(log.createdAt))}</td><td>{log.email || '-'}</td><td>{log.ipAddress || '-'}</td><td><span className={log.success ? styles.success : styles.failure}>{log.success ? 'สำเร็จ' : 'ไม่สำเร็จ'}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
