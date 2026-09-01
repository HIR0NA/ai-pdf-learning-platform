'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, BrainCircuit, FileText, History, Trash2 } from 'lucide-react';
import styles from './quiz-history.module.css';

type Attempt = { id: string; score: number; total: number; filename: string | null; source: string; createdAt: string; course: { title: string; code: string | null } | null };

export default function QuizHistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  useEffect(() => { let active = true; void fetch('/api/quiz-attempts').then((response) => response.ok ? response.json() : null).then((data) => { if (active && data) setAttempts(data.attempts ?? []); }); return () => { active = false; }; }, []);
  const average = useMemo(() => attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.score / attempt.total) * 100, 0) / attempts.length) : 0, [attempts]);
  const remove = async (id: string) => {
    if (!window.confirm('ลบประวัติผลการทำ Quiz นี้หรือไม่?')) return;
    const response = await fetch(`/api/quiz-attempts/${id}`, { method: 'DELETE' });
    if (response.ok) setAttempts((current) => current.filter((attempt) => attempt.id !== id));
  };
  return <main className={styles.container}><header className={styles.header}><div><Link href="/dashboard" className={styles.back}>&larr; กลับไป Dashboard</Link><p className={styles.eyebrow}><History size={16} /> Learning analytics</p><h1>ประวัติการทำ Quiz</h1><p>ดูผลการเรียนรู้จาก AI Quiz และ Quiz ที่สร้างจากคลังคำถามของคุณ</p></div><div className={styles.average}><BarChart3 size={19} /><strong>{average}%</strong><span>คะแนนเฉลี่ย</span></div></header><section className={styles.metrics}><div><BrainCircuit size={20} /><span>ทำแล้ว</span><strong>{attempts.length} ครั้ง</strong></div><div><FileText size={20} /><span>แหล่งคำถาม</span><strong>AI และคลังคำถาม</strong></div></section>{attempts.length === 0 ? <section className={styles.empty}><div className={styles.emptyIcon}><History size={30} /></div><h2>ยังไม่มีประวัติการทำ Quiz</h2><p>เริ่มทำ Quiz จากเอกสารหรือคลังคำถาม แล้วผลลัพธ์จะถูกบันทึกไว้ที่นี่</p><Link href="/dashboard/questions" className={styles.primaryLink}>ไปที่คลังคำถาม</Link></section> : <section className={styles.list}><div className={styles.listHeading}><h2>ผลการทำล่าสุด</h2><span>{attempts.length} รายการ</span></div>{attempts.map((attempt) => { const percentage = Math.round((attempt.score / attempt.total) * 100); const isManual = attempt.source === 'MANUAL'; return <article key={attempt.id} className={styles.card}><div className={styles.typeIcon}>{isManual ? <BrainCircuit size={20} /> : <FileText size={20} />}</div><div className={styles.cardMain}><div className={styles.cardTitle}><h3>{isManual ? 'Quiz จากคลังคำถาม' : attempt.filename || 'AI Quiz'}</h3><span className={isManual ? styles.manualBadge : styles.aiBadge}>{isManual ? 'Manual' : 'AI'}</span></div>{attempt.course && <p className={styles.course}>{attempt.course.code || attempt.course.title}</p>}<p className={styles.date}>{new Date(attempt.createdAt).toLocaleString('th-TH')}</p></div><div className={styles.score}><strong>{percentage}%</strong><span>{attempt.score}/{attempt.total} คะแนน</span></div><button className={styles.deleteButton} onClick={() => void remove(attempt.id)} aria-label="ลบประวัติ Quiz"><Trash2 size={17} /></button></article>; })}</section>}</main>;
}
