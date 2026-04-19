import { SectionLabel } from './section-label';
import { renderHighlight } from './highlight';

export type WhyItem = { num?: string; title?: string; body?: string };
export type WhyHeader = { label?: string; title?: string; title_accent?: string; intro?: string };

const NUM_COLORS = ['var(--pv-magenta)', 'var(--pv-cyan)', 'var(--pv-purple)'];

const WHY_DEFAULTS = {
  label: '01 Why Printvolution',
  title: 'Three reasons',
  title_accent: "we *don't suck.*",
  intro: 'Most printing companies in Singapore treat your file like a transaction — upload, pay, hope for the best. We treat it like a job with your name on it.',
};

export function WhyCards({
  items,
  header,
}: {
  items: WhyItem[];
  header?: WhyHeader | null;
}) {
  const label = header?.label || WHY_DEFAULTS.label;
  const title = header?.title || WHY_DEFAULTS.title;
  const title_accent = header?.title_accent || WHY_DEFAULTS.title_accent;
  const intro = header?.intro || WHY_DEFAULTS.intro;
  if (!items.length) return null;
  return (
    <section
      style={{
        background: 'var(--pv-cream)',
        borderTop: '3px solid var(--pv-ink)',
        borderBottom: '3px solid var(--pv-ink)',
        padding: '96px 24px',
      }}
    >
      <div style={{ maxWidth: 1560, margin: '0 auto' }}>
        <SectionLabel text={label} />

        <h2
          style={{
            fontFamily: 'var(--pv-f-display)',
            fontSize: 'clamp(40px, 6vw, 80px)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            margin: 0,
            marginBottom: 24,
            color: 'var(--pv-purple)',
            maxWidth: 1100,
          }}
        >
          {title}
          <br />
          <span style={{ color: 'var(--pv-ink)' }}>{renderHighlight(title_accent, { underlineHeight: 16 })}</span>
        </h2>
        <p
          style={{
            maxWidth: 720,
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--pv-ink-soft)',
            marginBottom: 48,
            fontWeight: 500,
          }}
        >
          {intro}
        </p>
        <div
          className="pv-why-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 28,
          }}
        >
          {items.map((c, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                border: '3px solid var(--pv-ink)',
                boxShadow: '6px 6px 0 var(--pv-ink)',
                padding: 28,
              }}
            >
              {c.num && (
                <div
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 72,
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    marginBottom: 16,
                    color: NUM_COLORS[i % NUM_COLORS.length],
                  }}
                >
                  {c.num}
                </div>
              )}
              {c.title && (
                <h3
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 22,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    marginBottom: 10,
                  }}
                >
                  {c.title}
                </h3>
              )}
              {c.body && (
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--pv-ink-soft)', margin: 0, fontWeight: 500 }}>{c.body}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-why-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>
    </section>
  );
}
