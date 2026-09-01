'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import styles from './courses.module.css';

type Course = { id: string; title: string; code: string | null; createdAt: string; _count?: { documents: number; notes: number; questions: number; quizAttempts: number } };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void fetch('/api/courses')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data) setCourses(data.courses ?? []); });
    return () => { active = false; };
  }, []);

  const createCourse = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/courses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'ไม่สามารถเพิ่มรายวิชาได้');
      setCourses((current) => [data.course, ...current]);
      setTitle(''); setCode('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'ไม่สามารถเพิ่มรายวิชาได้');
    } finally { setSaving(false); }
  };

  const removeCourse = async (id: string) => {
    if (!window.confirm('ลบรายวิชานี้หรือไม่?')) return;
    const response = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    if (response.ok) setCourses((current) => current.filter((course) => course.id !== id));
    else setError('ไม่สามารถลบรายวิชาได้');
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}><BookOpen size={16} /> พื้นที่เรียนของฉัน</p><h1>รายวิชา</h1><p>จัดเก็บรายวิชาที่กำลังเรียน เพื่อเตรียมเชื่อมเอกสารและกิจกรรมการเรียนในขั้นถัดไป</p></div>
        <Link href="/dashboard" className={styles.back}>กลับไป Dashboard</Link>
      </header>

      <section className={styles.panel}>
        <h2><Plus size={19} /> เพิ่มรายวิชา</h2>
        <form onSubmit={createCourse} className={styles.form}>
          <label>ชื่อรายวิชา<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="เช่น โครงสร้างข้อมูล" /></label>
          <label>รหัสวิชา <span>(ไม่บังคับ)</span><input value={code} onChange={(event) => setCode(event.target.value)} maxLength={32} placeholder="เช่น CS201" /></label>
          <button disabled={saving} type="submit">{saving ? 'กำลังบันทึก...' : 'เพิ่มรายวิชา'}</button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      <section className={styles.listSection} aria-live="polite">
        <div className={styles.listTitle}><h2>รายวิชาของฉัน</h2><span>{courses.length} รายวิชา</span></div>
        {courses.length === 0 ? <div className={styles.empty}><BookOpen size={32} /> ยังไม่มีรายวิชา เริ่มเพิ่มรายวิชาแรกของคุณได้เลย</div> : <div className={styles.grid}>
          {courses.map((course) => <article className={styles.card} key={course.id}>
            <div><span className={styles.code}>{course.code || 'ไม่มีรหัสวิชา'}</span><h3>{course.title}</h3><p>{course._count?.documents ?? 0} เอกสาร · {course._count?.notes ?? 0} บันทึก · {course._count?.quizAttempts ?? 0} Quiz</p></div>
            <button className={styles.delete} onClick={() => void removeCourse(course.id)} aria-label={`ลบรายวิชา ${course.title}`}><Trash2 size={17} /></button>
          </article>)}
        </div>}
      </section>
    </main>
  );
}
