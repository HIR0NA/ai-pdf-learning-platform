'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Check, ExternalLink } from 'lucide-react';

type Summary = {
  title: string;
  overview: string;
  keyPoints: string[];
  sections: { heading: string; summary: string }[];
};

export default function DocumentSummary({ data }: { data: Summary }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!data) return <div>ไม่พบข้อมูลสรุป</div>;

  const handleSaveToNotes = async () => {
    if (isSaving || isSaved) return;
    setIsSaving(true);
    try {
      const formattedContent = `${data.overview}\n\n### ประเด็นสำคัญ:\n${data.keyPoints?.map((p) => `- ${p}`).join('\n') || ''}\n\n${data.sections?.map((s) => `#### ${s.heading}\n${s.summary}`).join('\n\n') || ''}`;
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `สรุป: ${data.title || 'เอกสาร'}`,
          content: formattedContent,
        }),
      });
      if (res.ok) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to save summary as note', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article style={{ padding: '0.5rem', lineHeight: 1.7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--primary-color)', margin: 0, fontSize: '1.25rem' }}>{data.title}</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleSaveToNotes}
            disabled={isSaving || isSaved}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: isSaved ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(223, 182, 178, 0.3)',
              backgroundColor: isSaved ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              color: isSaved ? '#4ade80' : 'var(--text-primary)',
              cursor: isSaved ? 'default' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            {isSaved ? <><Check size={15} /> บันทึกลงสมุดโน้ตแล้ว</> : <><Bookmark size={15} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกลงสมุดโน้ต'}</>}
          </button>
          {isSaved && (
            <Link
              href="/dashboard/notes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                fontSize: '0.85rem',
                textDecoration: 'none',
              }}
            >
              เปิดดูโน้ต <ExternalLink size={13} />
            </Link>
          )}
        </div>
      </div>

      <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-color)' }}>{data.overview}</p>

      {data.keyPoints?.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>ประเด็นสำคัญ</h3>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
            {data.keyPoints.map((point, index) => <li key={index} style={{ marginBottom: '4px' }}>{point}</li>)}
          </ul>
        </section>
      )}

      {data.sections?.length > 0 && (
        <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
          {data.sections.map((section, index) => (
            <div key={index} style={{ padding: '1rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(223, 182, 178, 0.18)', borderRadius: '10px' }}>
              <h3 style={{ marginBottom: '0.4rem', color: '#fff', fontSize: '1rem' }}>{section.heading}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{section.summary}</p>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
