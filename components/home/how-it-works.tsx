import Link from 'next/link';
import { SectionLabel } from './section-label';

export type HowHeader = {
  headline?: string;
  headline_accent?: string;
  body?: string;
  cta_label?: string;
  cta_href?: string;
};

export type HowStep = {
  num?: string;
  title?: string;
  body?: string;
  time?: string;
};

const STEP_COLORS = ['var(--pv-magenta)', 'var(--pv-cyan)', 'var(--pv-purple)', 'var(--pv-green)'];

export function HowItWorks({ header, steps }: { header: HowHeader | null; steps: HowStep[] }) {
  if (!header && steps.length === 0) return null;
  return (
    <section style={{ padding: '96px 24px' }}>
      <div
        className="pv-how-grid"
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: 64,
          alignItems: 'start',
        }}
      >
        {header && (
          <div>
            <SectionLabel text="04 How it works" />
            <h2
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(40px, 6vw, 72px)',
                lineHeight: 0.9,
                letterSpacing: '-0.03em',
                margin: 0,
                marginBottom: 20,
              }}
            >
              {header.headline}{' '}
              {header.headline_accent && (
                <span style={{ color: 'var(--pv-magenta)' }}>{header.headline_accent}</span>
              )}
            </h2>
            {header.body && (
              <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--pv-ink-soft)', marginBottom: 28, fontWeight: 500 }}>
                {header.body}
              </p>
            )}
            {header.cta_label && header.cta_href && (
              <Link href={header.cta_href} className="pv-btn pv-btn-primary">
                {header.cta_label} →
              </Link>
            )}
          </div>
        )}

        {steps.length > 0 && (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
            {steps.map((s, i) => (
              <li
                key={i}
                style={{
                  background: '#fff',
                  border: '3px solid var(--pv-ink)',
                  padding: '22px 24px',
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr auto',
                  gap: 18,
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 40,
                    color: STEP_COLORS[i % STEP_COLORS.length],
                    lineHeight: 1,
                  }}
                >
                  {s.num}
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 20, letterSpacing: '-0.01em', marginBottom: 2 }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--pv-muted)', fontWeight: 500 }}>{s.body}</div>
                </div>
                {s.time && (
                  <span
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      background: 'var(--pv-ink)',
                      color: '#fff',
                      padding: '3px 9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {s.time}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-how-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}
