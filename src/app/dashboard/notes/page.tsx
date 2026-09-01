'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import styles from './notes.module.css';

type Course = { id: string; title: string; code: string | null };
type Note = { id: string; title: string; content: string; courseId: string | null; createdAt: string; updatedAt: string; course: Course | null };

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [courseId, setCourseId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([fetch('/api/notes'), fetch('/api/courses')])
      .then(async ([notesResponse, coursesResponse]) => {
        const [notesData, coursesData] = await Promise.all([
          notesResponse.ok ? notesResponse.json() : null,
          coursesResponse.ok ? coursesResponse.json() : null,
        ]);
        if (!active) return;
        if (notesData) setNotes(notesData.notes ?? []);
        if (coursesData) setCourses(coursesData.courses ?? []);
      });
    return () => { active = false; };
  }, []);

  const resetForm = () => { setTitle(''); setContent(''); setCourseId(''); setEditingId(null); setError(''); };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await fetch(editingId ? `/api/notes/${editingId}` : '/api/notes', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, courseId: courseId || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'ไม่สามารถบันทึกบันทึกการเรียนได้');
      if (editingId) setNotes((current) => current.map((note) => note.id === editingId ? data.note : note));
      else setNotes((current) => [data.note, ...current]);
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'ไม่สามารถบันทึกบันทึกการเรียนได้');
    } finally { setLoading(false); }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id); setTitle(note.title); setContent(note.content); setCourseId(note.courseId ?? ''); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeNote = async (id: string) => {
    if (!window.confirm('ลบบันทึกการเรียนนี้หรือไม่?')) return;
    const response = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setNotes((current) => current.filter((note) => note.id !== id));
      if (editingId === id) resetForm();
    } else setError('ไม่สามารถลบบันทึกการเรียนได้');
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div><h1>{editingId ? 'แก้ไขบันทึกการเรียน' : 'บันทึกการเรียน (Study Notes)'}</h1><p>จดสิ่งที่เรียนรู้และจัดกลุ่มตามรายวิชาได้ในที่เดียว</p></div>
        <Link href="/dashboard" className={styles.backBtn}>&larr; กลับไป Dashboard</Link>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}><label htmlFor="title">หัวข้อ</label><input id="title" type="text" className={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required placeholder="เช่น สรุปบทที่ 1" /></div>
          <div className={styles.inputGroup}><label htmlFor="course">รายวิชา <span>(ไม่บังคับ)</span></label><select id="course" className={styles.input} value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">ไม่ระบุรายวิชา</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code ? `${course.code} - ` : ''}{course.title}</option>)}</select></div>
        </div>
        <div className={styles.inputGroup}><label htmlFor="content">เนื้อหา</label><textarea id="content" className={styles.textarea} value={content} onChange={(event) => setContent(event.target.value)} maxLength={20000} required placeholder="จดบันทึกสิ่งที่คุณเรียนรู้ที่นี่..." /></div>
        <div className={styles.actions}><button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</button>{editingId && <button type="button" className={styles.cancelBtn} onClick={resetForm}><X size={16} /> ยกเลิก</button>}</div>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </form>

      <section className={styles.notesList} aria-live="polite">
        <h2>บันทึกทั้งหมด ({notes.length})</h2>
        {notes.length === 0 ? <p className={styles.empty}>ยังไม่มีบันทึกการเรียน</p> : notes.map((note) => <article key={note.id} className={styles.noteCard}>
          <div className={styles.noteHeading}>
            <div><div className={styles.noteTitle}>{note.title}</div>{note.course && <span className={styles.courseBadge}>{note.course.code || note.course.title}</span>}</div>
            <div className={styles.noteActions}><button type="button" onClick={() => startEdit(note)} aria-label={`แก้ไข ${note.title}`}><Pencil size={16} /></button><button type="button" onClick={() => void removeNote(note.id)} aria-label={`ลบ ${note.title}`}><Trash2 size={16} /></button></div>
          </div>
          <div className={styles.noteDate}>อัปเดต {new Date(note.updatedAt).toLocaleString('th-TH')}</div>
          <div className={styles.noteContent}>{note.content}</div>
        </article>)}
      </section>
    </main>
  );
}
