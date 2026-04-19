import Link from 'next/link';

export type SplitHeroItem = {
  side?: 'print' | 'gifts' | string;
  kicker?: string;
  headline?: string;
  headline_accent?: string;
  body?: string;
  cta_label?: string;
  cta_href?: string;
  image_url?: string;
};

export function SplitHero({ items }: { items: SplitHeroItem[] }) {
  if (!items.length) return null;
  return (
    <section style={{ borderBottom: '3px solid var(--pv-ink)', position: 'relative' }}>
      <div
        className="pv-split-hero-inner"
        style={{
          maxWidth: 1560,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: items.length > 1 ? '1fr 1fr' : '1fr',
          position: 'relative',
        }}
      >
        {items.length > 1 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-6deg)',
              zIndex: 10,
              width: 88,
              height: 88,
              background: 'var(--pv-yellow)',
              border: '3px solid var(--pv-ink)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--pv-f-display)',
              fontSize: 42,
              color: 'var(--pv-ink)',
              boxShadow: '5px 5px 0 var(--pv-ink)',
            }}
          >
            &amp;
          </div>
        )}
        {items.map((item, i) => {
          const accent = item.side === 'gifts' ? 'var(--pv-cyan)' : 'var(--pv-magenta)';
          const bg = item.side === 'gifts' ? 'var(--pv-cream)' : '#fff';
          return (
            <div
              key={i}
              className="pv-split-side"
              style={{
                background: bg,
                borderRight: i === 0 && items.length > 1 ? '3px solid var(--pv-ink)' : 'none',
                padding: '64px 48px',
                display: 'flex',
                flexDirection: 'column',
                gap: 32,
                overflow: 'hidden',
              }}
            >
              <div>
                {item.kicker && (
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: accent,
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ width: 24, height: 2, background: accent }} />
                    {item.kicker}
                  </div>
                )}
                <h1
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 'clamp(40px, 5.5vw, 72px)',
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    margin: 0,
                    marginBottom: 14,
                    color: 'var(--pv-ink)',
                  }}
                >
                  {item.headline}
                  {item.headline_accent && (
                    <>
                      <br />
                      <span style={{ color: accent }}>{item.headline_accent}</span>
                    </>
                  )}
                </h1>
                {item.body && (
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.45,
                      maxWidth: 420,
                      color: 'var(--pv-muted)',
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {item.body}
                  </p>
                )}
                {item.cta_label && item.cta_href && (
                  <Link
                    href={item.cta_href}
                    className="pv-btn"
                    style={{
                      marginTop: 22,
                      display: 'inline-flex',
                      background: item.side === 'gifts' ? 'var(--pv-ink)' : 'var(--pv-magenta)',
                      color: '#fff',
                      boxShadow: item.side === 'gifts' ? '6px 6px 0 var(--pv-cyan)' : '6px 6px 0 var(--pv-ink)',
                    }}
                  >
                    {item.cta_label} →
                  </Link>
                )}
              </div>

              <div
                style={{
                  width: '100%',
                  aspectRatio: '2 / 1',
                  border: '3px solid var(--pv-ink)',
                  boxShadow: item.side === 'gifts' ? '8px 8px 0 var(--pv-cyan)' : '8px 8px 0 var(--pv-ink)',
                  backgroundImage: item.image_url ? `url(${item.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  background: item.image_url ? undefined : 'var(--pv-cream)',
                }}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .pv-split-hero-inner { grid-template-columns: 1fr !important; }
          .pv-split-side { padding: 48px 24px !important; border-right: none !important; }
          .pv-split-side:first-child { border-bottom: 3px solid var(--pv-ink); }
        }
      `}</style>
    </section>
  );
}
