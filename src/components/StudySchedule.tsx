'use client';

import React from 'react';

type Schedule = {
  title: string;
  days: {
    day: number;
    topic: string;
    description: string;
  }[];
};

export default function StudySchedule({ data }: { data: Schedule }) {
  if (!data || !data.days) return <div>No schedule data available.</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '2rem', textAlign: 'center' }}>
        {data.title}
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {data.days.map((d, idx) => (
          <div 
            key={idx} 
            style={{ 
              display: 'flex', 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '12px', 
              border: '1px solid rgba(0, 255, 128, 0.2)',
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              background: 'rgba(0, 255, 128, 0.1)', 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              borderRight: '1px solid rgba(0, 255, 128, 0.2)',
              minWidth: '100px'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#00ff80', textTransform: 'uppercase', letterSpacing: '1px' }}>Day</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', lineHeight: '1' }}>{d.day}</span>
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1 }}>
              <h3 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.2rem' }}>{d.topic}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{d.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
