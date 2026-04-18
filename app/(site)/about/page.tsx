import Link from 'next/link';
import { getPageContent } from '@/lib/data/page_content';

export const metadata = {
  title: 'About Printvolution | Singapore Print House at Paya Lebar',
  description:
    'Printvolution is a Singapore print house at Paya Lebar Square. Since 2014 we\'ve printed for 400+ SG businesses with real humans checking every file.',
  alternates: { canonical: 'https://printvolution.sg/about' },
};

type Item = Record<string, any>;
function first<T = Item>(section: { items?: T[] } | undefined): T | null {
  const items = section?.items;
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
}
function items<T = Item>(section: { items?: T[] } | undefined): T[] {
  return Array.isArray(section?.items) ? (section!.items as T[]) : [];
}

// Minimal ** bold ** inline formatter so migration copy can highlight spans
// without us having to ship a markdown parser.
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <em
          key={i}
          style={{ fontStyle: 'normal', background: 'var(--pv-yellow)', padding: '1px 4px', fontWeight: 700 }}
        >
          {p.slice(2, -2)}
        </em>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

const TONE_BG: Record<string, string> = {
  magenta: 'var(--pv-magenta)',
  cyan: 'var(--pv-cyan)',
  yellow: 'var(--pv-yellow)',
  green: 'var(--pv-green)',
  ink: 'var(--pv-ink)',
};
const TONE_FG: Record<string, string> = {
  magenta: '#fff',
  cyan: '#fff',
  yellow: 'var(--pv-ink)',
  green: 'var(--pv-ink)',
  ink: 'var(--pv-yellow)',
};

export default async function AboutPage() {
  const content = await getPageContent('about');
  const hero = first<Item>(content['hero.v6']);
  const storyHeader = first<Item>(content['story.header']);
  const storyParas = items<Item>(content['story.paras']);
  const statsHeader = first<Item>(content['stats.header']);
  const statsItems = items<Item>(content['stats.items']);
  const beliefsHeader = first<Item>(content['beliefs.header']);
  const beliefsCards = items<Item>(content['beliefs.cards']);
  const shopHeader = first<Item>(content['shop.header']);
  const shopTiles = items<Item>(content['shop.tiles']);
  const promisesHeader = first<Item>(content['promises.header']);
  const promisesItems = items<Item>(content['promises.items']);
  const finalCta = first<Item>(content['final_cta.main']);

  return (
    <article>
      {/* HERO */}
      {hero && (
        <section
          style={{
            background: '#fff',
            padding: '72px 24px 56px',
            borderBottom: '3px solid var(--pv-ink)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            className="pv-about-hero"
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr',
              gap: 48,
              alignItems: 'end',
            }}
          >
            <div>
              {hero.kicker && (
                <div
                  style={{
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--pv-magenta)',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ width: 24, height: 2, background: 'var(--pv-magenta)' }} />
                  {hero.kicker}
                </div>
              )}
              <h1
                style={{
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 'clamp(52px, 7.5vw, 108px)',
                  lineHeight: 0.88,
                  letterSpacing: '-0.04em',
                  margin: 0,
                  marginBottom: 22,
                }}
              >
                {hero.headline}
                {hero.headline_em && (
                  <>
                    {' '}
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                      <span
                        aria-hidden
                        style={{
                          content: '""',
                          position: 'absolute',
                          bottom: 6,
                          left: '-2%',
                          width: '104%',
                          height: 16,
                          background: 'var(--pv-yellow)',
                          zIndex: -1,
                          transform: 'skew(-6deg)',
                          display: 'inline-block',
                        }}
                      />
                      {hero.headline_em}
                    </span>
                  </>
                )}
                {hero.headline_pink && (
                  <>
                    {' '}
                    <span style={{ color: 'var(--pv-magenta)' }}>{hero.headline_pink}</span>
                  </>
                )}
              </h1>
              {hero.body && (
                <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--pv-muted)', fontWeight: 500, maxWidth: 560 }}>
                  {hero.body}
                </p>
              )}
            </div>
            <div
              style={{
                aspectRatio: 1,
                background: 'var(--pv-magenta)',
                border: '3px solid var(--pv-ink)',
                boxShadow: '8px 8px 0 var(--pv-ink)',
                maxWidth: 360,
                justifySelf: 'end',
                transform: 'rotate(-2deg)',
                overflow: 'hidden',
                backgroundImage: hero.image_url ? `url(${hero.image_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              aria-label="Printvolution shopfront"
              role="img"
            />
          </div>
          <style>{`
            @media (max-width: 900px) {
              .pv-about-hero { grid-template-columns: 1fr !important; gap: 28px !important; }
              .pv-about-hero > div:last-child { justify-self: center !important; max-width: 280px !important; }
            }
          `}</style>
        </section>
      )}

      {/* STORY */}
      {(storyHeader || storyParas.length > 0) && (
        <section style={{ padding: '80px 24px', background: 'var(--pv-cream)', borderBottom: '3px solid var(--pv-ink)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {storyHeader && (
              <>
                <SectionLabel num={storyHeader.label_num} label={storyHeader.label} />
                <SectionTitle text={storyHeader.title} em={storyHeader.title_em} />
                {storyHeader.intro && (
                  <p style={{ fontSize: 17, color: 'var(--pv-muted)', maxWidth: 640, lineHeight: 1.55, fontWeight: 500, margin: 0 }}>
                    {storyHeader.intro}
                  </p>
                )}
              </>
            )}
            <div
              className="pv-story-grid"
              style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, marginTop: 40, alignItems: 'start' }}
            >
              <div>
                {storyParas.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 17,
                      lineHeight: 1.6,
                      color: 'var(--pv-ink-soft)',
                      marginBottom: 14,
                      fontWeight: 500,
                      ...(i === 0 ? ({ ['--pv-drop-cap' as string]: 'inline-block' }) : {}),
                    }}
                    className={i === 0 ? 'pv-story-first-para' : undefined}
                  >
                    {renderInline(String(p.text ?? ''))}
                  </p>
                ))}
              </div>
              <div
                role="img"
                aria-label="Founder / shop photo"
                style={{
                  aspectRatio: '3/4',
                  border: '3px solid var(--pv-ink)',
                  boxShadow: '10px 10px 0 var(--pv-magenta)',
                  transform: 'rotate(1deg)',
                  backgroundImage: storyHeader?.image_url ? `url(${storyHeader.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  background: storyHeader?.image_url ? undefined : 'var(--pv-cream)',
                }}
              />
            </div>
          </div>
          <style>{`
            .pv-story-first-para::first-letter {
              font-family: var(--pv-f-display);
              font-size: 80px;
              float: left;
              line-height: 0.85;
              padding: 6px 12px 0 0;
              color: var(--pv-magenta);
            }
            @media (max-width: 900px) {
              .pv-story-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
            }
          `}</style>
        </section>
      )}

      {/* STATS STRIP */}
      {(statsHeader || statsItems.length > 0) && (
        <section
          style={{
            background: 'var(--pv-ink)',
            color: '#fff',
            padding: '72px 24px',
            borderBottom: '3px solid var(--pv-ink)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 300,
              height: 300,
              background: 'var(--pv-magenta)',
              transform: 'rotate(12deg)',
              opacity: 0.15,
            }}
          />
          <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
            {statsHeader && (
              <>
                <div
                  style={{
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--pv-yellow)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                  }}
                >
                  § {statsHeader.label}
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 'clamp(36px, 4vw, 56px)',
                    lineHeight: 0.95,
                    letterSpacing: '-0.03em',
                    marginBottom: 40,
                    maxWidth: 700,
                    color: '#fff',
                  }}
                >
                  {statsHeader.title}
                  {statsHeader.title_yellow && (
                    <>
                      <br />
                      <span style={{ color: 'var(--pv-yellow)' }}>{statsHeader.title_yellow}</span>
                    </>
                  )}
                </h2>
              </>
            )}
            <div className="pv-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
              {statsItems.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: 22,
                    border: '2px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.03)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 'clamp(42px, 5vw, 72px)',
                      lineHeight: 0.9,
                      letterSpacing: '-0.04em',
                      marginBottom: 10,
                      color: i % 2 === 0 ? 'var(--pv-yellow)' : 'var(--pv-magenta)',
                    }}
                  >
                    {s.num}
                    {s.suffix && <sup style={{ fontSize: '0.4em', marginLeft: 3, color: '#fff' }}>{s.suffix}</sup>}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <style>{`
            @media (max-width: 900px) {
              .pv-stats-grid { grid-template-columns: 1fr 1fr !important; }
            }
          `}</style>
        </section>
      )}

      {/* BELIEFS */}
      {(beliefsHeader || beliefsCards.length > 0) && (
        <section style={{ padding: '80px 24px', borderBottom: '3px solid var(--pv-ink)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {beliefsHeader && (
              <>
                <SectionLabel num={beliefsHeader.label_num} label={beliefsHeader.label} />
                <h2
                  style={{
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 'clamp(40px, 5.5vw, 72px)',
                    lineHeight: 0.92,
                    letterSpacing: '-0.03em',
                    margin: 0,
                    marginBottom: 16,
                  }}
                >
                  {beliefsHeader.title}{' '}
                  {beliefsHeader.title_pink && <span style={{ color: 'var(--pv-magenta)' }}>{beliefsHeader.title_pink}</span>}{' '}
                  {beliefsHeader.title_suffix}
                </h2>
                {beliefsHeader.intro && (
                  <p style={{ fontSize: 17, color: 'var(--pv-muted)', maxWidth: 640, lineHeight: 1.55, fontWeight: 500 }}>
                    {beliefsHeader.intro}
                  </p>
                )}
              </>
            )}
            <div className="pv-beliefs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 40 }}>
              {beliefsCards.map((c, i) => {
                const colors = ['var(--pv-magenta)', 'var(--pv-cyan)', 'var(--pv-purple)'];
                const rotations = ['rotate(-1deg)', 'rotate(0.5deg)', 'rotate(-0.5deg)'];
                const margins = [0, 20, 0];
                return (
                  <div
                    key={i}
                    className="pv-belief-card"
                    style={{
                      background: '#fff',
                      border: '3px solid var(--pv-ink)',
                      boxShadow: '8px 8px 0 var(--pv-ink)',
                      padding: '28px 26px',
                      transition: 'all 0.2s',
                      transform: rotations[i % 3],
                      marginTop: margins[i % 3],
                    }}
                  >
                    {c.num && (
                      <div
                        style={{
                          fontFamily: 'var(--pv-f-display)',
                          fontSize: 64,
                          lineHeight: 0.9,
                          letterSpacing: '-0.04em',
                          marginBottom: 14,
                          color: colors[i % 3],
                        }}
                      >
                        {c.num}
                      </div>
                    )}
                    {c.title && (
                      <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0, marginBottom: 10 }}>
                        {c.title}
                      </h3>
                    )}
                    {c.body && (
                      <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--pv-ink-soft)', fontWeight: 500, margin: 0 }}>
                        {renderInline(String(c.body))}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <style>{`
            .pv-belief-card:hover { transform: rotate(0deg) translateY(-4px) !important; box-shadow: 10px 10px 0 var(--pv-ink) !important; }
            @media (max-width: 900px) {
              .pv-beliefs-grid { grid-template-columns: 1fr !important; }
              .pv-belief-card { transform: rotate(0) !important; margin-top: 0 !important; }
            }
          `}</style>
        </section>
      )}

      {/* SHOP GRID */}
      {(shopHeader || shopTiles.length > 0) && (
        <section style={{ padding: '80px 24px', background: 'var(--pv-cream)', borderBottom: '3px solid var(--pv-ink)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {shopHeader && (
              <>
                <SectionLabel num={shopHeader.label_num} label={shopHeader.label} />
                <SectionTitle text={shopHeader.title} em={shopHeader.title_em} />
                {shopHeader.intro && (
                  <p style={{ fontSize: 17, color: 'var(--pv-muted)', maxWidth: 640, lineHeight: 1.55, fontWeight: 500 }}>
                    {shopHeader.intro}
                  </p>
                )}
              </>
            )}
            <div
              className="pv-shop-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 32 }}
            >
              {shopTiles.map((t, i) => (
                <div
                  key={i}
                  aria-label={t.caption}
                  role="img"
                  className="pv-shop-tile"
                  style={{
                    aspectRatio: '4/3',
                    border: '3px solid var(--pv-ink)',
                    boxShadow: '6px 6px 0 var(--pv-ink)',
                    overflow: 'hidden',
                    backgroundImage: t.image_url ? `url(${t.image_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    background: t.image_url ? undefined : 'var(--pv-cream)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: 12,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                >
                  {!t.image_url && (
                    <span
                      style={{
                        background: 'var(--pv-magenta)',
                        color: '#fff',
                        padding: '4px 10px',
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t.caption}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <style>{`
            .pv-shop-tile:hover { transform: translate(-3px, -3px); box-shadow: 9px 9px 0 var(--pv-ink) !important; }
            @media (max-width: 900px) { .pv-shop-grid { grid-template-columns: 1fr 1fr !important; } }
            @media (max-width: 560px) { .pv-shop-grid { grid-template-columns: 1fr !important; } }
          `}</style>
        </section>
      )}

      {/* PROMISES */}
      {(promisesHeader || promisesItems.length > 0) && (
        <section style={{ padding: '80px 24px', borderBottom: '3px solid var(--pv-ink)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {promisesHeader && (
              <>
                <SectionLabel num={promisesHeader.label_num} label={promisesHeader.label} />
                <SectionTitle text={promisesHeader.title} em={promisesHeader.title_em} />
                {promisesHeader.intro && (
                  <p style={{ fontSize: 17, color: 'var(--pv-muted)', maxWidth: 640, lineHeight: 1.55, fontWeight: 500 }}>
                    {promisesHeader.intro}
                  </p>
                )}
              </>
            )}
            <div style={{ marginTop: 32, borderTop: '2px solid var(--pv-ink)' }}>
              {promisesItems.map((p, i) => {
                const tone = String(p.tone ?? 'magenta');
                const numColors = ['var(--pv-magenta)', 'var(--pv-cyan)', 'var(--pv-purple)', 'var(--pv-green)'];
                return (
                  <div
                    key={i}
                    className="pv-promise-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 200px',
                      gap: 28,
                      padding: '28px 0',
                      borderBottom: '2px solid var(--pv-ink)',
                      alignItems: 'start',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 48, lineHeight: 0.9, letterSpacing: '-0.04em', color: numColors[i % 4] }}>
                      {p.num}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, letterSpacing: '-0.02em', margin: 0, marginBottom: 8 }}>{p.title}</h3>
                      <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--pv-ink-soft)', fontWeight: 500, margin: 0 }}>{p.body}</p>
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 10,
                        padding: '6px 12px',
                        border: `2px solid ${TONE_BG[tone] ?? 'var(--pv-ink)'}`,
                        background: TONE_BG[tone] ?? '#fff',
                        color: TONE_FG[tone] ?? 'var(--pv-ink)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        alignSelf: 'center',
                        justifySelf: 'start',
                      }}
                    >
                      {p.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <style>{`
            @media (max-width: 900px) {
              .pv-promise-row { grid-template-columns: 60px 1fr !important; gap: 18px !important; }
              .pv-promise-row span:last-child { grid-column: 1 / -1 !important; }
            }
          `}</style>
        </section>
      )}

      {/* FINAL CTA */}
      {finalCta && (
        <section
          style={{
            background: 'var(--pv-magenta)',
            color: '#fff',
            padding: '96px 24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -60,
              left: -60,
              width: 220,
              height: 220,
              background: 'var(--pv-yellow)',
              transform: 'rotate(-15deg)',
              opacity: 0.25,
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              bottom: -80,
              right: -80,
              width: 260,
              height: 260,
              background: 'var(--pv-ink)',
              transform: 'rotate(12deg)',
              opacity: 0.15,
            }}
          />
          <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(44px, 7vw, 88px)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                margin: 0,
                marginBottom: 20,
              }}
            >
              {finalCta.headline}
              {finalCta.headline_yellow && (
                <>
                  <br />
                  <span style={{ color: 'var(--pv-yellow)' }}>{finalCta.headline_yellow}</span>
                </>
              )}
            </h2>
            {finalCta.body && (
              <p style={{ fontSize: 18, marginBottom: 28, color: 'rgba(255,255,255,0.9)', fontWeight: 500, maxWidth: 520, margin: '0 auto 28px' }}>
                {finalCta.body}
              </p>
            )}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              {finalCta.cta1_label && finalCta.cta1_href && (
                <Link
                  href={finalCta.cta1_href}
                  className="pv-btn"
                  style={{
                    background: 'var(--pv-yellow)',
                    color: 'var(--pv-ink)',
                    border: '3px solid var(--pv-ink)',
                    boxShadow: '5px 5px 0 var(--pv-ink)',
                    fontSize: 14,
                    padding: '16px 26px',
                  }}
                >
                  {finalCta.cta1_label} →
                </Link>
              )}
              {finalCta.cta2_label && finalCta.cta2_href && (
                <Link
                  href={finalCta.cta2_href}
                  className="pv-btn"
                  style={{
                    background: '#fff',
                    color: 'var(--pv-ink)',
                    border: '3px solid var(--pv-ink)',
                    fontSize: 14,
                    padding: '16px 26px',
                  }}
                >
                  {finalCta.cta2_label}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

function SectionLabel({ num, label }: { num?: string; label?: string }) {
  if (!num && !label) return null;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'var(--pv-f-mono)',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        background: 'var(--pv-ink)',
        color: '#fff',
        padding: '6px 14px',
        marginBottom: 20,
      }}
    >
      {num && <span style={{ color: 'var(--pv-yellow)' }}>{num}</span>}
      {label}
    </div>
  );
}

function SectionTitle({ text, em }: { text?: string; em?: string }) {
  if (!text && !em) return null;
  return (
    <h2
      style={{
        fontFamily: 'var(--pv-f-display)',
        fontSize: 'clamp(40px, 5.5vw, 72px)',
        lineHeight: 0.92,
        letterSpacing: '-0.03em',
        margin: 0,
        marginBottom: 14,
      }}
    >
      {text}
      {em && (
        <>
          {' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: 4,
                left: '-2%',
                width: '104%',
                height: 14,
                background: 'var(--pv-yellow)',
                zIndex: -1,
                transform: 'skew(-6deg)',
              }}
            />
            {em}
          </span>
        </>
      )}
    </h2>
  );
}
