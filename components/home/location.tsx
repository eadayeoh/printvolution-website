import { SectionLabel } from './section-label';

export type LocationItem = {
  kind?: string;
  label?: string;
  detail?: string;
  href?: string;
};

export function Location({ items }: { items: LocationItem[] }) {
  if (!items.length) return null;
  return (
    <section
      style={{
        padding: '96px 24px',
        borderTop: '3px solid var(--pv-ink)',
      }}
    >
      <div
        className="pv-location-grid"
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div>
          <SectionLabel text="06 Visit Us" />
          <h2
            style={{
              fontFamily: 'var(--pv-f-display)',
              fontSize: 'clamp(34px, 4.5vw, 56px)',
              lineHeight: 0.9,
              letterSpacing: '-0.03em',
              margin: 0,
              marginBottom: 20,
            }}
          >
            Paya Lebar
            <br />
            Square, <span style={{ color: 'var(--pv-magenta)' }}>SG.</span>
          </h2>
          <div style={{ marginTop: 24 }}>
            {items.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr',
                  padding: '12px 0',
                  borderBottom: '2px dashed var(--pv-rule)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    color: 'var(--pv-muted)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  {row.label}
                </span>
                {row.href ? (
                  <a
                    href={row.href}
                    target={row.href.startsWith('http') ? '_blank' : undefined}
                    rel={row.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    style={{ color: 'var(--pv-ink)' }}
                  >
                    {row.detail}
                  </a>
                ) : (
                  <span>{row.detail}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            minHeight: 480,
            border: '3px solid var(--pv-ink)',
            boxShadow: '8px 8px 0 var(--pv-ink)',
            overflow: 'hidden',
            background: 'var(--pv-cream)',
          }}
        >
          <iframe
            title="Printvolution storefront at Paya Lebar Square"
            src="https://www.google.com/maps?q=60+Paya+Lebar+Road+%23B1-35+Singapore+409051&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ width: '100%', height: '100%', minHeight: 480, border: 0, display: 'block' }}
          />
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-location-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}
