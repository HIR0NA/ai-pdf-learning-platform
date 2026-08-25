'use client';

import React, { useState, useEffect } from 'react';
import styles from './notes.module.css';
import Link from 'next/link';

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const res = await fetch('/api/notes');
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        setTitle('');
        setContent('');
        fetchNotes();
      } else {
        alert('Failed to save note');
      }
    } catch (err) {
      alert('Error saving note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>บันทึกการเรียน (Study Notes)</h1>
        <Link href="/dashboard" className={styles.backBtn}>&larr; กลับไป Dashboard</Link>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="title">หัวข้อ</label>
          <input 
            id="title"
            type="text" 
            className={styles.input} 
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="เช่น สรุปบทที่ 1..."
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="content">เนื้อหา</label>
          <textarea 
            id="content"
            className={styles.textarea} 
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            placeholder="จดบันทึกสิ่งที่คุณเรียนรู้ที่นี่..."
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </form>

      <div className={styles.notesList}>
        <h2>บันทึกทั้งหมด ({notes.length})</h2>
        {notes.length === 0 ? (
          <p>ยังไม่มีบันทึกการเรียน</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className={styles.noteCard}>
              <div className={styles.noteTitle}>{note.title}</div>
              <div className={styles.noteDate}>
                {new Date(note.createdAt).toLocaleString('th-TH')}
              </div>
              <div className={styles.noteContent}>{note.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
