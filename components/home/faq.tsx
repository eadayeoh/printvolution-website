export type FaqItem = { question?: string; answer?: string };

export function Faq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section
      style={{
        background: 'var(--pv-cream)',
        borderTop: '3px solid var(--pv-ink)',
        padding: '96px 24px',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--pv-ink)',
            color: '#fff',
            padding: '6px 14px',
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 24,
          }}
        >
          05 Questions
        </div>
        <h2
          style={{
            fontFamily: 'var(--pv-f-display)',
            fontSize: 'clamp(40px, 5vw, 64px)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            margin: 0,
            marginBottom: 40,
          }}
        >
          Things people <span style={{ color: 'var(--pv-cyan)' }}>ask us.</span>
        </h2>
        <div style={{ display: 'grid', gap: 14 }}>
          {items.map((f, i) => (
            <details
              key={i}
              className="pv-faq-item"
              style={{
                border: '3px solid var(--pv-ink)',
                background: '#fff',
                boxShadow: '4px 4px 0 var(--pv-ink)',
              }}
            >
              <summary
                style={{
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 20,
                  letterSpacing: '-0.01em',
                  padding: '18px 22px',
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                {f.question}
                <span
                  aria-hidden
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    background: 'var(--pv-magenta)',
                    color: '#fff',
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 22,
                  }}
                >
                  +
                </span>
              </summary>
              <div
                style={{
                  padding: '0 22px 22px',
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'var(--pv-ink-soft)',
                  fontWeight: 500,
                }}
              >
                {f.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
      <style>{`
        .pv-faq-item summary::-webkit-details-marker { display: none; }
      `}</style>
    </section>
  );
}
