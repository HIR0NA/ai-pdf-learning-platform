'use client';
import React, { useState, useEffect } from 'react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    // Check saved preference
    const savedTheme = localStorage.getItem('reading-mode');
    if (savedTheme === 'true') {
      setIsLightMode(true);
      document.body.classList.add('light-reading-mode');
    }
  }, []);

  const handlePull = () => {
    setIsPulling(true);
    
    // Play a click sound
    try {
      const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3');
      audio.volume = 0.3;
      audio.play();
    } catch (e) {}

    setTimeout(() => {
      setIsLightMode(prev => {
        const newValue = !prev;
        if (newValue) {
          document.body.classList.add('light-reading-mode');
        } else {
          document.body.classList.remove('light-reading-mode');
        }
        localStorage.setItem('reading-mode', String(newValue));
        return newValue;
      });
      setIsPulling(false);
    }, 300); // Wait for the pull down animation before toggling
  };

  return (
    <div className={styles.pullStringContainer}>
      <div 
        className={${styles.string} }
        onClick={handlePull}
      >
        <div className={styles.line}></div>
        <div className={styles.handle}></div>
      </div>
      {isLightMode && <div className={styles.spotlight}></div>}
    </div>
  );
}
