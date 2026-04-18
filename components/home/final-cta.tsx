import Link from 'next/link';

export type FinalCtaItem = {
  headline?: string;
  headline_accent?: string;
  body?: string;
  cta_label?: string;
  cta_href?: string;
};

export function FinalCta({ item }: { item: FinalCtaItem | null }) {
  if (!item) return null;
  return (
    <section
      style={{
        background: 'var(--pv-magenta)',
        color: '#fff',
        padding: '96px 24px',
        textAlign: 'center',
        borderTop: '3px solid var(--pv-ink)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--pv-f-display)',
          fontSize: 'clamp(44px, 8vw, 104px)',
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          margin: '0 auto 20px',
          maxWidth: 1100,
          color: '#fff',
        }}
      >
        {item.headline}{' '}
        {item.headline_accent && <span style={{ color: 'var(--pv-yellow)' }}>{item.headline_accent}</span>}
      </h2>
      {item.body && (
        <p style={{ fontSize: 18, maxWidth: 560, margin: '0 auto 32px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
          {item.body}
        </p>
      )}
      {item.cta_label && item.cta_href && (
        <Link
          href={item.cta_href}
          className="pv-btn"
          style={{
            background: 'var(--pv-yellow)',
            color: 'var(--pv-ink)',
            fontSize: 16,
            padding: '20px 36px',
          }}
        >
          {item.cta_label} →
        </Link>
      )}
    </section>
  );
}
