'use client';

import React, { useState } from 'react';

type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export default function QuizApp({ data }: { data: QuizQuestion[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  if (!data || data.length === 0) return <div>No quiz data available.</div>;

  const question = data[currentIndex];
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === question.answerIndex;

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    if (index === question.answerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
        <h2 style={{ color: 'var(--primary-color)' }}>🎉 Quiz Completed!</h2>
        <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>You scored {score} out of {data.length}</p>
        <button 
          onClick={handleRestart}
          style={{ padding: '10px 20px', background: 'var(--primary-color)', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(10, 15, 30, 0.6)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0, 255, 255, 0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
        <span>Question {currentIndex + 1} of {data.length}</span>
        <span>Score: {score}</span>
      </div>
      
      <h3 style={{ marginBottom: '1.5rem', lineHeight: '1.4' }}>{question.question}</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {question.options.map((opt, idx) => {
          let bgColor = 'rgba(255, 255, 255, 0.05)';
          let borderColor = 'rgba(255, 255, 255, 0.1)';
          if (isAnswered) {
            if (idx === question.answerIndex) {
              bgColor = 'rgba(0, 255, 128, 0.2)';
              borderColor = '#00ff80';
            } else if (idx === selectedOption) {
              bgColor = 'rgba(255, 0, 60, 0.2)';
              borderColor = '#ff003c';
            }
          }
          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={isAnswered}
              style={{
                padding: '12px',
                textAlign: 'left',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                color: 'var(--text-color)',
                cursor: isAnswered ? 'default' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: `4px solid ${isCorrect ? '#00ff80' : '#ff003c'}` }}>
          <h4 style={{ color: isCorrect ? '#00ff80' : '#ff003c', marginBottom: '0.5rem' }}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {question.explanation}
          </p>
          <button 
            onClick={handleNext}
            style={{ marginTop: '1rem', padding: '8px 16px', background: 'rgba(0, 255, 255, 0.1)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '5px', cursor: 'pointer' }}
          >
            {currentIndex < data.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}
