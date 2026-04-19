// "Tell us the job, we'll tell you the pick." — if/then matcher section.
// Replaces the interactive PaperChooser + the static comparison. Five
// actionable scenarios, each with a target paper/finish combo and a
// "Use this" button that scrolls to the configurator. Admin can
// override per product via product.extras.matcher (jsonb) — for now
// every product renders the curated name-card default.

type MatcherRow = {
  /** The scenario statement. Use *word* (single asterisks) to highlight
   *  a phrase with the yellow underline treatment — e.g.
   *  "You need cards by *tomorrow*". */
  need: string;
  /** The recommended combo headline, e.g. "Digital, Matt Art 300gsm". */
  pick_title: string;
  /** Second line of detail under the pick title. */
  pick_detail: string;
  /** Optional preset key — legacy, kept for data compatibility. */
  preset?: string;
  /** Pre-configuration payload. Keys are configurator step_ids
   *  (e.g. "size", "view"), values are option slugs or a quantity
   *  number for the qty step. Clicking "Use this" applies this over
   *  the current cfgState and scrolls to the pricing section. */
  apply?: Record<string, string | number>;
  cta_label?: string;
};

export type MatcherData = {
  kicker?: string;
  title?: string;
  title_em?: string; // yellow-highlighted tail of the h2
  right_note_title?: string;
  right_note_body?: string;
  rows: MatcherRow[];
};

export const DEFAULT_MATCHER: MatcherData = {
  kicker: 'Quick guide',
  title: "Tell us the job,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'No wrong answer.',
  right_note_body: 'All jobs get printed on our presses, checked by our team.',
  rows: [
    {
      need: 'You need cards by *tomorrow*',
      pick_title: 'Digital, Matt Art 300gsm',
      pick_detail: 'From S$22 · same-day collection if before 4pm',
      preset: 'digital-fast',
    },
    {
      need: "You're ordering *250+* and colour accuracy matters",
      pick_title: 'Offset, Matt Art Premium 350gsm',
      pick_detail: 'From S$58 · 3-day turnaround · Pantone available',
      preset: 'offset-standard',
    },
    {
      need: 'Cards will sit in wallets *for years*',
      pick_title: 'Offset + Silk Lamination',
      pick_detail: 'From S$68 · fingerprint-proof · our most-ordered combo',
      preset: 'offset-silk',
    },
    {
      need: 'First impressions *have to land hard*',
      pick_title: 'Premium: Spot UV or Foil Stamp',
      pick_detail: 'From S$96 · 4–5 days · catches light, feels heavy',
      preset: 'premium-statement',
    },
    {
      need: "You're on a *tight budget*",
      pick_title: 'Digital, Matt Art 260gsm',
      pick_detail: 'From S$22 · still checked by humans · no shame in the game',
      preset: 'digital-budget',
    },
  ],
};

function renderNeed(text: string) {
  // Wrap *phrase* as <em> with yellow underline
  return text.split(/(\*[^*]+\*)/g).map((p, i) => {
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
      return (
        <em
          key={i}
          style={{
            fontStyle: 'normal',
            position: 'relative',
            display: 'inline-block',
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              bottom: 2,
              left: '-2%',
              width: '104%',
              height: 12,
              background: 'var(--pv-yellow)',
              zIndex: -1,
              transform: 'skew(-6deg)',
            }}
          />
          {p.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export function ProductMatcher({
  data,
  onUse,
}: {
  data?: MatcherData | null;
  /** Called when a "Use this" button is clicked. Receives the row's
   *  `apply` payload (step_id → option slug / qty). Parent should merge
   *  it into configurator state. */
  onUse?: (apply: Record<string, string | number>) => void;
}) {
  const d = data ?? DEFAULT_MATCHER;
  const titleLines = (d.title ?? '').split('\n');

  return (
    <section style={{ background: 'var(--pv-cream)', padding: '72px 32px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header row */}
        <div
          className="pv-matcher-head"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 48,
            alignItems: 'end',
            marginBottom: 48,
            paddingBottom: 32,
            borderBottom: '2px solid var(--pv-ink)',
          }}
        >
          <div>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 24, height: 2, background: 'var(--pv-magenta)', display: 'inline-block' }}
                />
                {d.kicker}
              </div>
            )}
            <h2
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(40px, 5vw, 72px)',
                lineHeight: 0.9,
                letterSpacing: '-0.03em',
                margin: 0,
                maxWidth: 780,
              }}
            >
              {titleLines.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                  {i === titleLines.length - 1 && d.title_em && (
                    <>
                      {' '}
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
                </span>
              ))}
            </h2>
          </div>
          {(d.right_note_title || d.right_note_body) && (
            <div
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--pv-muted)',
                maxWidth: 220,
                textAlign: 'right',
                lineHeight: 1.6,
                paddingBottom: 8,
              }}
            >
              {d.right_note_title && (
                <b
                  style={{
                    color: 'var(--pv-ink)',
                    display: 'block',
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 16,
                    letterSpacing: '-0.01em',
                    marginBottom: 4,
                    textTransform: 'none',
                    fontWeight: 400,
                  }}
                >
                  {d.right_note_title}
                </b>
              )}
              {d.right_note_body}
            </div>
          )}
        </div>

        {/* If / Then rows */}
        <div
          className="pv-matcher-grid"
          style={{
            borderTop: '1px solid var(--pv-ink)',
            borderBottom: '1px solid var(--pv-ink)',
          }}
        >
          {d.rows.map((row, i) => (
            <div
              key={i}
              className="pv-matcher-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.3fr 40px 1.2fr auto',
                gap: 32,
                padding: '28px 0',
                borderBottom: i === d.rows.length - 1 ? 'none' : '1px solid var(--pv-ink)',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 'clamp(20px, 2vw, 26px)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                }}
              >
                {renderNeed(row.need)}
              </div>
              <div
                aria-hidden
                style={{
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 36,
                  color: 'var(--pv-magenta)',
                  textAlign: 'center',
                  lineHeight: 1,
                }}
              >
                →
              </div>
              <div
                style={{
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--pv-muted)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.45,
                }}
              >
                <b
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 17,
                    display: 'block',
                    marginBottom: 4,
                    letterSpacing: '-0.01em',
                    color: 'var(--pv-ink)',
                    fontWeight: 400,
                  }}
                >
                  {row.pick_title}
                </b>
                {row.pick_detail}
              </div>
              <button
                type="button"
                className="pv-matcher-goto"
                onClick={() => {
                  if (row.apply && onUse) onUse(row.apply);
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                style={{
                  padding: '12px 18px',
                  background: 'var(--pv-ink)',
                  color: '#fff',
                  fontFamily: 'var(--pv-f-body)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: '2px solid var(--pv-ink)',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.cta_label ?? 'Use this'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .pv-matcher-row:hover { background: #fff; }
        .pv-matcher-goto:hover {
          background: var(--pv-magenta) !important;
          border-color: var(--pv-magenta) !important;
          transform: translate(-2px, -2px);
          box-shadow: 3px 3px 0 var(--pv-ink);
        }
        @media (max-width: 900px) {
          .pv-matcher-head { grid-template-columns: 1fr !important; gap: 20px !important; }
          .pv-matcher-row { grid-template-columns: 1fr !important; gap: 10px !important; padding: 24px 0 !important; }
          .pv-matcher-row > *:nth-child(2) { display: none !important; }
        }
      `}</style>
    </section>
  );
}
