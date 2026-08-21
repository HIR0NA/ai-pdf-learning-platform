'use client';

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with settings suitable for the cyberpunk theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

let idCounter = 0;

export default function MermaidViewer({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Date.now()}-${idCounter++}`);

  useEffect(() => {
    if (containerRef.current && chart) {
      try {
        mermaid.render(idRef.current, chart)
          .then((result) => {
            if (containerRef.current) {
              containerRef.current.innerHTML = result.svg;
            }
          })
          .catch((e) => {
            console.error("Mermaid rendering async error", e);
            if (containerRef.current) {
              containerRef.current.innerHTML = `<div style="color:#ff003c; padding: 10px; border: 1px dashed #ff003c; font-size: 0.8rem;">ERR: MIND_MAP_RENDER_FAILED<br/>(AI may have generated invalid syntax)</div>`;
            }
          });
      } catch (e: any) {
        console.error("Mermaid rendering sync error", e);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div style="color:#ff003c; padding: 10px; border: 1px dashed #ff003c; font-size: 0.8rem;">ERR: INVALID_MERMAID_SYNTAX<br/>(AI generated invalid diagram code)</div>`;
        }
      }
    }
  }, [chart]);

  return (
    <div 
      className="mermaid-wrapper" 
      ref={containerRef}
      style={{ 
        overflowX: 'auto', 
        padding: '1.5rem', 
        margin: '1rem 0',
        background: 'rgba(10, 15, 30, 0.6)', 
        borderRadius: '12px',
        border: '1px solid rgba(0, 255, 255, 0.2)',
        boxShadow: '0 0 15px rgba(0, 255, 255, 0.05)'
      }}
    />
  );
}
