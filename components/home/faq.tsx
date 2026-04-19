import { SectionLabel } from './section-label';

export type FaqItem = { question?: string; answer?: string };
export type FaqHeader = { label?: string; title?: string; title_accent?: string };

const FAQ_DEFAULTS = {
  label: '05 Questions',
  title: 'Things people',
  title_accent: 'ask us.',
};

export function Faq({ items, header }: { items: FaqItem[]; header?: FaqHeader | null }) {
  if (!items.length) return null;
  const label = header?.label || FAQ_DEFAULTS.label;
  const title = header?.title || FAQ_DEFAULTS.title;
  const title_accent = header?.title_accent || FAQ_DEFAULTS.title_accent;
  return (
    <section
      style={{
        background: 'var(--pv-cream)',
        borderTop: '3px solid var(--pv-ink)',
        padding: '96px 24px',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SectionLabel text={label} />
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
          {title} <span style={{ color: 'var(--pv-cyan)' }}>{title_accent}</span>
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
