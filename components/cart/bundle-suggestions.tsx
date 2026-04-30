import Link from 'next/link';
import { listBundles } from '@/lib/data/bundles';
import { formatSGD } from '@/lib/utils';

export async function BundleSuggestions() {
  const bundles = await listBundles();
  // Show bundles that actually save the customer money first.
  const eligible = bundles
    .filter((b) => b.discount_cents > 0 && b.subtotal_cents > 0)
    .slice(0, 3);

  if (eligible.length === 0) return null;

  return (
    <section style={{ marginTop: 40 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 6 }}>
        Save more
      </div>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, margin: '0 0 18px', color: '#0a0a0a' }}>
        Pair it with a bundle
      </h2>
      <div style={{
        display: 'grid', gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      }}>
        {eligible.map((b) => {
          const savePct = Math.round((b.discount_cents / b.subtotal_cents) * 100);
          return (
            <Link
              key={b.id}
              href={`/bundle/${b.slug}`}
              style={{
                display: 'block', padding: 18,
                background: '#fff', border: '1.5px solid #0a0a0a',
                borderRadius: 12, textDecoration: 'none', color: 'inherit',
                transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e',
                }}>
                  Save {savePct}%
                </span>
                {b.type_badge && (
                  <span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {b.type_badge}
                  </span>
                )}
              </div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: '#0a0a0a' }}>
                {b.name}
              </h3>
              {b.tagline && (
                <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {b.tagline}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700, color: '#E91E8C' }}>
                  {formatSGD(b.price_cents)}
                </span>
                <span style={{ fontSize: 12, color: '#aaa', textDecoration: 'line-through' }}>
                  {formatSGD(b.subtotal_cents)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
