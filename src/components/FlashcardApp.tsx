'use client';

import React, { useState } from 'react';

type Flashcard = {
  front: string;
  back: string;
};

export default function FlashcardApp({ data }: { data: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!data || data.length === 0) return <div>No flashcard data available.</div>;

  const card = data[currentIndex];

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c - 1), 150);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '1rem 0' }}>
      <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
        Card {currentIndex + 1} of {data.length}
      </div>

      {/* 3D Flip Container */}
      <div 
        style={{ perspective: '1000px', width: '100%', maxWidth: '500px', height: '300px', cursor: 'pointer' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          textAlign: 'center',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* Front */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(145deg, rgba(20,25,45,1) 0%, rgba(10,15,30,1) 100%)',
            border: '2px solid rgba(255, 0, 255, 0.3)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', lineHeight: '1.4' }}>{card.front}</h2>
            <div style={{ position: 'absolute', bottom: '15px', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Click to flip</div>
          </div>

          {/* Back */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(145deg, rgba(30,15,30,1) 0%, rgba(15,5,15,1) 100%)',
            border: '2px solid rgba(255, 0, 255, 0.6)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            transform: 'rotateY(180deg)',
            boxShadow: '0 10px 30px rgba(255,0,255,0.1)',
          }}>
            <p style={{ color: '#fff', fontSize: '1.1rem', lineHeight: '1.6' }}>{card.back}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '2rem' }}>
        <button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          style={{ padding: '10px 20px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '8px', color: currentIndex === 0 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: currentIndex === 0 ? 'default' : 'pointer' }}
        >
          &larr; Prev
        </button>
        <button 
          onClick={handleNext} 
          disabled={currentIndex === data.length - 1}
          style={{ padding: '10px 20px', background: 'rgba(255, 0, 255, 0.2)', border: '1px solid #ff00ff', borderRadius: '8px', color: currentIndex === data.length - 1 ? 'rgba(255,255,255,0.2)' : '#ff00ff', cursor: currentIndex === data.length - 1 ? 'default' : 'pointer' }}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
