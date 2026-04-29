import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { listActiveGiftProducts } from '@/lib/gifts/data';
import { GIFT_MODE_LABEL, giftFromPrice } from '@/lib/gifts/types';
import { formatSGD } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Personalised Gifts',
  description: 'Personalised photo gifts in Singapore — laser engraving, UV print, embroidery, and custom photo prints. Upload a photo and we handle the rest.',
  alternates: { canonical: 'https://printvolution.sg/gifts' },
};

export const revalidate = 600;

const MODE_ORDER = ['uv', 'laser', 'embroidery', 'photo-resize'] as const;

const MODE_SUBTITLE: Record<string, string> = {
  'uv': 'UV printed keepsakes with vibrant colour',
  'laser': 'Laser engraved on metal, wood, acrylic',
  'embroidery': 'Thread-stitched apparel & accessories',
  'photo-resize': 'Your photo, prepared for production',
};

export default async function GiftsLandingPage() {
  const all = await listActiveGiftProducts();
  const grouped = MODE_ORDER.map((mode) => ({
    mode,
    label: GIFT_MODE_LABEL[mode],
    subtitle: MODE_SUBTITLE[mode],
    items: all.filter((p) => p.mode === mode),
  })).filter((g) => g.items.length > 0);

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px 80px' }}>
      <header style={{ maxWidth: 720, marginBottom: 48 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 10 }}>
          Personalised Gifts
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0, color: '#0a0a0a' }}>
          Upload a photo.<br />
          <em style={{ fontFamily: 'var(--serif, Cormorant Garamond, Georgia, serif)', fontStyle: 'italic', fontWeight: 500, color: '#E91E8C' }}>
            We handle the craft.
          </em>
        </h1>
        <p style={{ fontSize: 16, color: '#666', marginTop: 14, lineHeight: 1.6 }}>
          Every gift is made one-at-a-time from the photo you upload. Pick a product, drop your image, preview it in seconds, checkout. We transform, print or stitch — you pick it up.
        </p>
      </header>

      {grouped.map((group) => (
        <section key={group.mode} style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C' }}>
                {group.label}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', margin: '2px 0 0', color: '#0a0a0a' }}>
                {group.subtitle}
              </h2>
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>{group.items.length} item{group.items.length === 1 ? '' : 's'}</div>
          </div>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {group.items.map((p) => (
              <Link key={p.id} href={`/gift/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'border-color .15s' }}>
                  <div style={{ position: 'relative', aspectRatio: '1/1', background: '#fafaf7', overflow: 'hidden' }}>
                    {p.thumbnail_url ? (
                      <Image
                        src={p.thumbnail_url}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>🎁</div>
                    )}
                  </div>
                  <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', marginBottom: 4, lineHeight: 1.3 }}>
                      {p.name}
                    </div>
                    {p.tagline && (
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 10, flex: 1, lineHeight: 1.5 }}>
                        {p.tagline.length > 80 ? p.tagline.slice(0, 77) + '…' : p.tagline}
                      </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#E91E8C', marginTop: 'auto' }}>
                      From {formatSGD(giftFromPrice(p))}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {all.length === 0 && (
        <div style={{ padding: '80px 24px', textAlign: 'center', color: '#888' }}>
          No gift products yet. Check back soon!
        </div>
      )}
    </main>
  );
}
