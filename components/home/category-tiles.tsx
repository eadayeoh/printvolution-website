'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SectionLabel } from './section-label';

export type CategoryTile = {
  slug: string;
  name: string;
  image_url: string | null;
  tagline: string | null;
  min_price_cents: number | null;
  href: string;
  badge?: string | null;
};

export type CategoryTab = {
  tab_key: string;
  tab_label: string;
  tiles: CategoryTile[];
};

export type CategoryTilesHeader = {
  label?: string;
  title?: string;
  title_accent?: string;
  intro?: string;
};

const CAT_DEFAULTS = {
  label: '02 Product Catalogue',
  title: 'Everything we',
  title_accent: 'make.',
  intro: 'From silk-laminated business cards to custom photo mugs — pick a side, pick a product, configure live, order in under 5 minutes.',
};

function formatSGD(cents: number): string {
  return `S$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function badgeColor(badge: string): string {
  const b = badge.toLowerCase();
  if (b.includes('best')) return 'var(--pv-yellow)';
  if (b.includes('hot')) return 'var(--pv-magenta)';
  if (b.includes('new')) return 'var(--pv-cyan)';
  return 'var(--pv-ink)';
}
function badgeText(badge: string): string {
  const b = badge.toLowerCase();
  if (b.includes('hot') || b.includes('new')) return '#fff';
  if (b.includes('best')) return 'var(--pv-ink)';
  return '#fff';
}

export function CategoryTiles({ tabs, header }: { tabs: CategoryTab[]; header?: CategoryTilesHeader | null }) {
  const visible = tabs.filter((t) => t.tiles.length > 0);
  const [activeKey, setActiveKey] = useState(visible[0]?.tab_key ?? '');
  if (!visible.length) return null;
  const active = visible.find((t) => t.tab_key === activeKey) ?? visible[0];

  const label = header?.label || CAT_DEFAULTS.label;
  const title = header?.title || CAT_DEFAULTS.title;
  const title_accent = header?.title_accent || CAT_DEFAULTS.title_accent;
  const intro = header?.intro || CAT_DEFAULTS.intro;

  return (
    <section style={{ padding: '96px 24px' }}>
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
          }}
        >
          {title} <span style={{ color: 'var(--pv-magenta)' }}>{title_accent}</span>
        </h2>
        <p style={{ maxWidth: 720, fontSize: 17, lineHeight: 1.55, color: 'var(--pv-ink-soft)', marginBottom: 32, fontWeight: 500 }}>
          {intro}
        </p>

        {visible.length > 1 && (
          <div
            style={{
              display: 'inline-flex',
              background: '#fff',
              border: '2px solid var(--pv-ink)',
              boxShadow: '4px 4px 0 var(--pv-ink)',
              marginBottom: 32,
              padding: 4,
            }}
          >
            {visible.map((t) => {
              const isActive = t.tab_key === active.tab_key;
              return (
                <button
                  key={t.tab_key}
                  type="button"
                  onClick={() => setActiveKey(t.tab_key)}
                  style={{
                    background: isActive ? 'var(--pv-ink)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--pv-ink)',
                    padding: '10px 20px',
                    border: 'none',
                    fontFamily: 'var(--pv-f-body)',
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {t.tab_label}
                  <span
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 10,
                      background: isActive ? 'var(--pv-yellow)' : 'var(--pv-cream)',
                      color: 'var(--pv-ink)',
                      padding: '2px 6px',
                      fontWeight: 600,
                      letterSpacing: 0,
                    }}
                  >
                    {t.tiles.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div
          className="pv-cat-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 18,
          }}
        >
          {active.tiles.map((t) => (
            <Link
              key={t.slug}
              href={t.href}
              className="pv-cat-tile"
              style={{
                background: '#fff',
                border: '3px solid var(--pv-ink)',
                boxShadow: '6px 6px 0 var(--pv-ink)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 360,
                transition: 'transform 0.15s, box-shadow 0.15s',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minHeight: 200,
                  borderBottom: '3px solid var(--pv-ink)',
                  backgroundImage: t.image_url ? `url(${t.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  background: t.image_url ? undefined : 'var(--pv-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--pv-muted)',
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 11,
                }}
              >
                {!t.image_url && t.name}
              </div>
              <div style={{ padding: '18px 20px' }}>
                {t.badge && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '3px 8px',
                      marginBottom: 8,
                      background: badgeColor(t.badge),
                      color: badgeText(t.badge),
                    }}
                  >
                    {t.badge}
                  </span>
                )}
                <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em', margin: 0, marginBottom: 6 }}>
                  {t.name}
                </h3>
                {t.tagline && (
                  <p style={{ fontSize: 13, color: 'var(--pv-muted)', lineHeight: 1.4, margin: 0, marginBottom: 12, fontWeight: 500 }}>
                    {t.tagline}
                  </p>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingTop: 10,
                    borderTop: '2px dashed var(--pv-rule)',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: 'var(--pv-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      From
                    </div>
                    <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, color: 'var(--pv-magenta)' }}>
                      {t.min_price_cents != null ? formatSGD(t.min_price_cents) : 'Quote'}
                    </div>
                  </div>
                  <div
                    aria-hidden
                    style={{
                      background: 'var(--pv-ink)',
                      color: '#fff',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                    }}
                  >
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        .pv-cat-tile:hover {
          transform: translate(-4px, -4px);
          box-shadow: 10px 10px 0 var(--pv-ink) !important;
        }
        @media (max-width: 1100px) {
          .pv-cat-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 820px) {
          .pv-cat-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          .pv-cat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
