export type ProofItem =
  | { kind: 'quote'; text?: string; cite?: string }
  | { kind: 'stat'; num?: string; suffix?: string; label?: string };

export function Proof({ items }: { items: ProofItem[] }) {
  if (!items.length) return null;
  const quote = items.find((i) => i.kind === 'quote') as Extract<ProofItem, { kind: 'quote' }> | undefined;
  const stats = items.filter((i): i is Extract<ProofItem, { kind: 'stat' }> => i.kind === 'stat');
  const statColors = ['var(--pv-magenta)', 'var(--pv-cyan)', 'var(--pv-yellow)', 'var(--pv-green)'];

  return (
    <section
      style={{
        background: 'var(--pv-ink)',
        color: '#fff',
        padding: '96px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(236,0,140,0.15) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,174,239,0.12) 0, transparent 40%)',
        }}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
        {quote?.text && (
          <>
            <h2
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(28px, 4vw, 56px)',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                margin: '24px 0',
              }}
            >
              &ldquo;{quote.text}&rdquo;
            </h2>
            {quote.cite && (
              <div
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                — {quote.cite}
              </div>
            )}
          </>
        )}
        {stats.length > 0 && (
          <div
            className="pv-proof-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
              gap: 28,
              marginTop: 56,
              paddingTop: 40,
              borderTop: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            {stats.map((s, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 60,
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    color: statColors[i % statColors.length],
                  }}
                >
                  {s.num}
                  {s.suffix && <sup style={{ fontSize: 22 }}>{s.suffix}</sup>}
                </div>
                {s.label && (
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.7)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginTop: 8,
                    }}
                  >
                    {s.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-proof-stats { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}
