// "Here's what you're actually buying." — side-by-side honesty section.
// Replaces the interactive PaperChooser. Static layout, per-product
// overridable via product.extras.comparison (admin UI can come later —
// for now every product renders the sensible default inferred from its
// name).

type Panel = {
  label: string;
  title: string;
  title_strike?: string; // word to strike through on the bad panel
  subtitle: string;
  price: string;
  price_unit: string;
};

export type ComparisonData = {
  kicker?: string;
  title?: string;
  title_em?: string;
  intro?: string;
  bad: Panel;
  good: Panel;
  specs: Array<{ attr: string; bad: string; good: string }>;
  footer_note?: string;
  cta_label?: string;
};

export const DEFAULT_COMPARISON: ComparisonData = {
  kicker: 'Why it matters',
  title: "Here's what you're",
  title_em: 'actually buying.',
  intro:
    "Cheap cards don't just look cheaper — they feel cheaper, age faster, and get thrown away first. Here's the honest side-by-side.",
  bad: {
    label: 'Typical Budget Print',
    title: 'The cheap shortcut.',
    title_strike: 'cheap',
    subtitle: 'Thin digital print, no finish, overseas fulfilment.',
    price: 'S$18',
    price_unit: '/ 500 cards · 7–14 day shipping',
  },
  good: {
    label: 'PrintVolution Standard',
    title: 'The real thing.',
    subtitle: 'Offset, silk laminated, checked by humans in SG.',
    price: 'S$68',
    price_unit: '/ 500 cards · 3 days, SG',
  },
  specs: [
    { attr: 'Weight', bad: '260gsm or less, flimsy bend', good: '350gsm, feels substantial' },
    { attr: 'Print Method', bad: 'Digital print, ink sits on surface', good: 'Offset press, ink locked in paper' },
    { attr: 'Finish', bad: 'No finish, smudges when wet', good: 'Silk lamination, fingerprint-proof' },
    { attr: 'Colour Accuracy', bad: 'Colour drift, approximate CMYK', good: 'Pantone-matched, press-calibrated' },
    { attr: 'File Check', bad: 'No preflight, mistakes go to press', good: 'Human preflight within 2 hours' },
    { attr: 'Durability', bad: 'Edges fray within weeks', good: 'Holds up for years in a wallet' },
  ],
  footer_note: 'A card costs **4 cents more** than the cheap version. It also **lasts 5× longer.**',
  cta_label: 'Configure Yours',
};

function renderStrikeTitle(title: string, strike?: string) {
  if (!strike) return title;
  const i = title.toLowerCase().indexOf(strike.toLowerCase());
  if (i < 0) return title;
  return (
    <>
      {title.slice(0, i)}
      <s style={{ textDecorationColor: 'var(--pv-magenta)', textDecorationThickness: 4 }}>
        {title.slice(i, i + strike.length)}
      </s>
      {title.slice(i + strike.length)}
    </>
  );
}

function renderBoldSegments(text: string) {
  // **bold** spans rendered as <b> inline
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) {
      return <b key={i}>{p.slice(2, -2)}</b>;
    }
    return <span key={i}>{p}</span>;
  });
}

export function ProductComparison({ data }: { data?: ComparisonData | null }) {
  const d = data ?? DEFAULT_COMPARISON;
  return (
    <section style={{ background: 'var(--pv-cream)', padding: '72px 24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 56px' }}>
          {d.kicker && (
            <div
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--pv-magenta)',
                marginBottom: 14,
              }}
            >
              {d.kicker}
            </div>
          )}
          <h2
            style={{
              fontFamily: 'var(--pv-f-display)',
              fontSize: 'clamp(40px, 5vw, 72px)',
              lineHeight: 0.92,
              letterSpacing: '-0.03em',
              margin: 0,
              marginBottom: 12,
            }}
          >
            {d.title}
            {d.title_em && (
              <>
                <br />
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      left: '-2%',
                      width: '104%',
                      height: 16,
                      background: 'var(--pv-yellow)',
                      zIndex: -1,
                      transform: 'skew(-6deg)',
                    }}
                  />
                  {d.title_em}
                </span>
              </>
            )}
          </h2>
          {d.intro && (
            <p style={{ fontSize: 17, color: 'var(--pv-muted)', fontWeight: 500, lineHeight: 1.55, margin: 0 }}>
              {d.intro}
            </p>
          )}
        </div>

        {/* Comparison card */}
        <div
          className="pv-compare-wrap"
          style={{
            background: '#fff',
            border: '3px solid var(--pv-ink)',
            boxShadow: '10px 10px 0 var(--pv-ink)',
            overflow: 'hidden',
          }}
        >
          {/* Visual panels */}
          <div
            className="pv-compare-panels"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderBottom: '3px solid var(--pv-ink)',
            }}
          >
            <CmpPanel kind="bad" p={d.bad} />
            <CmpPanel kind="good" p={d.good} />
          </div>

          {/* Spec rows */}
          <div style={{ background: '#fff' }}>
            {d.specs.map((row, i) => (
              <div
                key={i}
                className="pv-compare-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px 1fr',
                  alignItems: 'center',
                  padding: '20px 40px',
                  borderBottom: i === d.specs.length - 1 ? 'none' : '1px solid var(--pv-rule)',
                  gap: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--pv-muted)',
                    textAlign: 'right',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 10,
                  }}
                >
                  <span>{row.bad}</span>
                  <span
                    aria-hidden
                    style={{
                      fontSize: 16,
                      color: 'var(--pv-muted)',
                      fontWeight: 400,
                    }}
                  >
                    ×
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    color: 'var(--pv-ink)',
                    padding: '8px 16px',
                    background: 'var(--pv-cream)',
                    border: '1px solid var(--pv-rule)',
                  }}
                >
                  {row.attr}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--pv-ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 18,
                      height: 18,
                      background: 'var(--pv-magenta)',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  <span>{row.good}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              background: 'var(--pv-ink)',
              color: '#fff',
              padding: '22px 40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            {d.footer_note && (
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {renderBoldSegments(d.footer_note)}
              </div>
            )}
            {d.cta_label && (
              <button
                type="button"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'var(--pv-magenta)',
                  color: '#fff',
                  border: 'none',
                  padding: '14px 24px',
                  fontFamily: 'var(--pv-f-body)',
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {d.cta_label} →
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .pv-compare-panels { grid-template-columns: 1fr !important; }
          .pv-compare-row { grid-template-columns: 1fr !important; padding: 16px 20px !important; }
        }
      `}</style>
    </section>
  );
}

function CmpPanel({ kind, p }: { kind: 'bad' | 'good'; p: Panel }) {
  const isGood = kind === 'good';
  const labelBg = isGood ? 'var(--pv-yellow)' : '#fff';
  const labelColor = isGood ? 'var(--pv-ink)' : 'var(--pv-muted)';
  const panelBg = isGood ? 'var(--pv-magenta)' : 'var(--pv-cream)';
  const textColor = isGood ? '#fff' : 'var(--pv-ink)';
  const titleColor = isGood ? '#fff' : 'var(--pv-muted)';
  const subColor = isGood ? 'rgba(255,255,255,0.8)' : 'var(--pv-muted)';
  const priceColor = isGood ? 'var(--pv-yellow)' : 'var(--pv-muted)';

  return (
    <div
      style={{
        padding: '48px 40px',
        minHeight: 380,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: panelBg,
        color: textColor,
        borderRight: isGood ? undefined : '3px solid var(--pv-ink)',
      }}
    >
      <div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '6px 12px',
            border: '2px solid var(--pv-ink)',
            marginBottom: 28,
            background: labelBg,
            color: labelColor,
          }}
        >
          {p.label}
        </span>
        <h3
          style={{
            fontFamily: 'var(--pv-f-display)',
            fontSize: 'clamp(28px, 3vw, 40px)',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            margin: 0,
            marginBottom: 16,
            color: titleColor,
          }}
        >
          {renderStrikeTitle(p.title, p.title_strike)}
        </h3>
        <p
          style={{
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 12,
            letterSpacing: '0.04em',
            margin: 0,
            marginBottom: 24,
            color: subColor,
          }}
        >
          {p.subtitle}
        </p>
        {/* Card visual */}
        <div
          aria-hidden
          style={{
            position: 'relative',
            aspectRatio: '90 / 54',
            maxWidth: 280,
            marginBottom: 24,
            alignSelf: 'flex-start',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '1px solid rgba(0,0,0,0.15)',
              background: isGood ? '#fff' : '#F5F5F0',
              transform: isGood ? undefined : 'rotate(-3deg) skew(-2deg)',
              boxShadow: isGood
                ? '0 20px 50px rgba(0,0,0,0.4), 0 2px 0 var(--pv-ink), 0 4px 0 var(--pv-ink), 0 6px 0 var(--pv-ink)'
                : '0 2px 4px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 14,
                right: 14,
                height: isGood ? 6 : 4,
                background: isGood ? 'var(--pv-magenta)' : 'rgba(236,0,140,0.35)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: isGood ? 28 : undefined,
                bottom: isGood ? undefined : 10,
                left: 14,
                right: '35%',
                height: 2,
                background: isGood ? 'var(--pv-ink)' : 'rgba(0,0,0,0.25)',
                boxShadow: isGood ? '0 6px 0 var(--pv-ink), 0 12px 0 var(--pv-ink)' : undefined,
              }}
            />
          </div>
        </div>
      </div>
      <div
        style={{
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 12,
          letterSpacing: '0.04em',
          fontWeight: 700,
          paddingTop: 18,
          borderTop: '2px dashed currentColor',
          color: priceColor,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--pv-f-display)',
            fontSize: 22,
            letterSpacing: '-0.02em',
            marginRight: 8,
            color: priceColor,
          }}
        >
          {p.price}
        </span>
        <span>{p.price_unit}</span>
      </div>
    </div>
  );
}
