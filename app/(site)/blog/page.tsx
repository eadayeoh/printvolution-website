import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { listPublishedPosts } from '@/lib/data/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Printing tips, product deep-dives, and business stationery guides from Printvolution Singapore.',
  alternates: { canonical: 'https://printvolution.sg/blog' },
};

export const revalidate = 600;

function formatDate(iso: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts(60);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 80px' }}>
      <header style={{ marginBottom: 48, maxWidth: 720 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 10 }}>
          Blog
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0, color: '#0a0a0a' }}>
          Print tips,<br />
          <em style={{ fontFamily: 'var(--serif, Cormorant Garamond, Georgia, serif)', fontStyle: 'italic', fontWeight: 500, color: '#E91E8C' }}>
            straight from the shop.
          </em>
        </h1>
        <p style={{ fontSize: 16, color: '#666', marginTop: 14, lineHeight: 1.6 }}>
          Guides, deep-dives, and practical advice on name cards, banners, packaging, and gifts — from the team that prints them every day.
        </p>
      </header>

      {posts.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', color: '#888', background: '#fafaf7', border: '1px solid #eee', borderRadius: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No posts yet</div>
          <div style={{ fontSize: 13 }}>Check back soon — we&apos;re moving our content over.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <article style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', aspectRatio: '16 / 10', background: '#fafaf7', overflow: 'hidden' }}>
                  {p.featured_image_url ? (
                    <Image
                      src={p.featured_image_url}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 40 }}>
                      ✍️
                    </div>
                  )}
                </div>
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 0.5, marginBottom: 8 }}>
                    {formatDate(p.published_at)}{p.author ? ` · ${p.author}` : ''}
                  </div>
                  <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em', margin: '0 0 10px', color: '#0a0a0a', lineHeight: 1.3 }}>
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p style={{ fontSize: 14, color: '#555', margin: 0, lineHeight: 1.6, flex: 1 }}>
                      {p.excerpt.length > 160 ? p.excerpt.slice(0, 157) + '…' : p.excerpt}
                    </p>
                  )}
                  {p.tags && p.tags.length > 0 && (
                    <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#fafaf7', color: '#666', letterSpacing: 0.3 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
