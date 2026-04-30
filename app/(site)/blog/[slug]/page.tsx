import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPostBySlug, listPublishedPosts } from '@/lib/data/blog';
import { sanitizeHtml } from '@/lib/security/sanitize';

export const revalidate = 600;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.seo_title || post.title,
    description: post.seo_desc || post.excerpt || undefined,
    alternates: { canonical: `https://printvolution.sg/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.featured_image_url
        ? [post.featured_image_url]
        : [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Printvolution' }],
      type: 'article',
    },
  };
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  // 3 latest related posts (exclude self)
  const related = (await listPublishedPosts(6)).filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.featured_image_url || undefined,
    datePublished: post.published_at || undefined,
    author: post.author ? { '@type': 'Person', name: post.author } : { '@type': 'Organization', name: 'Printvolution' },
    publisher: { '@type': 'Organization', name: 'Printvolution' },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 64px' }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <Link href="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</Link>
        </nav>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 12 }}>
          {formatDate(post.published_at)}
          {post.author ? ` · ${post.author}` : ''}
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 20px', color: '#0a0a0a' }}>
          {post.title}
        </h1>

        {post.excerpt && (
          <p style={{ fontSize: 18, color: '#555', lineHeight: 1.6, margin: '0 0 32px' }}>
            {post.excerpt}
          </p>
        )}

        {post.featured_image_url && (
          <div style={{ position: 'relative', margin: '0 -24px 32px', aspectRatio: '16 / 9', background: '#fafaf7', overflow: 'hidden', borderRadius: 8 }}>
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 800px"
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <div
          className="blog-content"
          style={{ fontSize: 17, lineHeight: 1.75, color: '#222' }}
          // Blog HTML comes from WordPress XML imports + admin-pasted
          // content. Sanitise at render so stored XSS (script tags,
          // onerror attrs, javascript: URIs) can't fire in viewers'
          // browsers even if the DB row was injected upstream.
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content_html) }}
        />

        {post.tags && post.tags.length > 0 && (
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {post.tags.map((t) => (
              <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: '#fafaf7', color: '#666' }}>
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section style={{ background: '#fafaf7', padding: '56px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 18 }}>
              Keep reading
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
                    {r.featured_image_url && (
                      <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden' }}>
                        <Image
                          src={r.featured_image_url}
                          alt={r.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 280px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div style={{ padding: 18 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.35 }}>{r.title}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <style>{`
        .blog-content h2 { font-size: 28px; font-weight: 800; letter-spacing: -0.015em; margin: 40px 0 14px; color: #0a0a0a; }
        .blog-content h3 { font-size: 22px; font-weight: 700; margin: 32px 0 10px; color: #0a0a0a; }
        .blog-content p { margin: 0 0 18px; }
        .blog-content a { color: #E91E8C; text-decoration: underline; }
        .blog-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 18px 0; }
        .blog-content ul, .blog-content ol { margin: 0 0 18px; padding-left: 24px; }
        .blog-content li { margin: 6px 0; }
        .blog-content blockquote { border-left: 4px solid #E91E8C; padding: 6px 0 6px 18px; margin: 22px 0; color: #555; font-style: italic; }
        .blog-content pre, .blog-content code { background: #fafaf7; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.92em; }
        .blog-content pre { padding: 14px 18px; overflow-x: auto; }
      `}</style>
    </main>
  );
}
