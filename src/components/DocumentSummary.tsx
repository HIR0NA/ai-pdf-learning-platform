'use client';

type Summary = {
  title: string;
  overview: string;
  keyPoints: string[];
  sections: { heading: string; summary: string }[];
};

export default function DocumentSummary({ data }: { data: Summary }) {
  if (!data) return <div>ไม่พบข้อมูลสรุป</div>;

  return (
    <article style={{ padding: '0.5rem', lineHeight: 1.7 }}>
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>{data.title}</h2>
      <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-color)' }}>{data.overview}</p>

      {data.keyPoints?.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>ประเด็นสำคัญ</h3>
          <ul style={{ paddingLeft: '1.25rem' }}>
            {data.keyPoints.map((point, index) => <li key={index}>{point}</li>)}
          </ul>
        </section>
      )}

      {data.sections?.length > 0 && (
        <section style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
          {data.sections.map((section, index) => (
            <div key={index} style={{ padding: '1rem', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,255,255,0.18)', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '0.4rem', color: '#fff' }}>{section.heading}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{section.summary}</p>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
