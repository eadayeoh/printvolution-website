import { renderHighlight } from './highlight';

export type ProofItem =
  | { kind: 'quote'; text?: string; cite?: string }
  | { kind: 'stat'; num?: string; suffix?: string; label?: string };

export type ProofHeader = { label?: string };

const PROOF_DEFAULT_LABEL = '03 Trusted since 2014';

export function Proof({
  items,
  header,
}: {
  items: ProofItem[];
  header?: ProofHeader | null;
}) {
  if (!items.length) return null;
  const label = header?.label || PROOF_DEFAULT_LABEL;
  const quote = items.find((i) => i.kind === 'quote') as Extract<ProofItem, { kind: 'quote' }> | undefined;
  const stats = items.filter((i): i is Extract<ProofItem, { kind: 'stat' }> => i.kind === 'stat');
  const statColors = ['var(--pv-magenta)', 'var(--pv-cyan)', 'var(--pv-yellow)', 'var(--pv-green)'];

  // Split the leading number off the label so it renders inside a dark chip
  // on the magenta pill (matches v4: label bg magenta, n bg ink with yellow number).
  const labelMatch = label.match(/^(\d+)\s+(.+)$/);
  const labelNum = labelMatch?.[1];
  const labelText = labelMatch?.[2] ?? label;

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
            'radial-gradient(circle at 20% 30%, rgba(236,0,140,0.08) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,174,239,0.06) 0, transparent 40%)',
        }}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--pv-magenta)',
            color: '#fff',
            padding: '6px 14px',
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          {labelNum && (
            <span
              style={{
                background: 'var(--pv-ink)',
                color: 'var(--pv-yellow)',
                padding: '2px 6px',
                fontWeight: 900,
              }}
            >
              {labelNum}
            </span>
          )}
          {labelText}
        </div>
        {quote?.text && (
          <>
            <h2
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(28px, 4vw, 56px)',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                margin: '24px 0',
                color: '#fff',
              }}
            >
              &ldquo;{renderHighlight(quote.text, { mode: 'yellow-text' })}&rdquo;
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
