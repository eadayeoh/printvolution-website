'use server';

import { revalidatePath } from 'next/cache';
import { createClient as admClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const BLOG_BUCKET = 'blog-images';

function serviceClient() {
  return admClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function requireAdmin() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    throw new Error('Admin/staff only');
  }
  return sb;
}

/** -----------------------------------------------------------------
 *  WordPress / WooCommerce import
 *  ----------------------------------------------------------------- */

type WPPost = {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string; media_details?: { sizes?: Record<string, { source_url?: string }> } }>;
    author?: Array<{ name?: string }>;
    'wp:term'?: Array<Array<{ taxonomy: string; name: string }>>;
  };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#8217;/gi, "'")
    .replace(/\s+/g, ' ').trim();
}

function normaliseSiteUrl(raw: string): string {
  let u = raw.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

/** Re-host a remote image in our Supabase Storage so old WP URLs don't break. */
async function mirrorImage(remoteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(remoteUrl, { redirect: 'follow' });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || 'image/jpeg';
    const ext = (remoteUrl.split('.').pop() || 'jpg').split('?')[0].split('#')[0].slice(0, 5).toLowerCase();
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';
    const name = `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    const sb = serviceClient();
    const { error } = await sb.storage.from(BLOG_BUCKET).upload(name, buf, {
      contentType: ct,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) return null;
    const { data } = sb.storage.from(BLOG_BUCKET).getPublicUrl(name);
    return data.publicUrl;
  } catch {
    return null;
  }
}

/**
 * Import all posts from a WordPress site's public REST API.
 * Works with any WP install (WooCommerce sites include the WP REST API by default).
 *
 * @param siteUrlRaw e.g. "https://oldsite.com" — no path, no trailing slash
 * @param opts.mirrorImages if true, downloads featured images and inline <img> srcs into our Supabase Storage
 * @param opts.status 'draft' | 'published' — what to save imported posts as
 */
export async function importFromWordPress(
  siteUrlRaw: string,
  opts: { mirrorImages: boolean; status: 'draft' | 'published' }
): Promise<{ ok: boolean; imported: number; skipped: number; errors: string[]; totalFound: number }> {
  try {
    await requireAdmin();
  } catch (e: any) {
    return { ok: false, imported: 0, skipped: 0, totalFound: 0, errors: [e.message ?? 'auth failed'] };
  }

  const siteUrl = normaliseSiteUrl(siteUrlRaw);
  const perPage = 50;
  let page = 1;
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  let totalFound = 0;

  const sb = serviceClient();

  while (true) {
    const endpoint = `${siteUrl}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_embed=1&orderby=date&order=desc`;
    let res: Response;
    try {
      res = await fetch(endpoint, { redirect: 'follow' });
    } catch (e: any) {
      errors.push(`Fetch page ${page} failed: ${e.message ?? 'network error'}`);
      break;
    }
    if (!res.ok) {
      if (res.status === 400 && page > 1) break; // WP returns 400 past last page
      errors.push(`Page ${page} returned HTTP ${res.status}`);
      break;
    }
    const posts = (await res.json()) as WPPost[];
    if (!Array.isArray(posts) || posts.length === 0) break;

    if (page === 1) {
      const total = Number(res.headers.get('X-WP-Total') || posts.length);
      totalFound = total;
    }

    for (const p of posts) {
      try {
        // Dedup: same source + wp id → skip
        const { data: existing } = await sb
          .from('blog_posts')
          .select('id')
          .eq('wp_source_url', siteUrl)
          .eq('wp_post_id', p.id)
          .maybeSingle();
        if (existing) {
          skipped++;
          continue;
        }

        // Extract featured image
        let featuredUrl: string | null = null;
        const media = p._embedded?.['wp:featuredmedia']?.[0];
        if (media) {
          featuredUrl =
            media.media_details?.sizes?.large?.source_url
            || media.media_details?.sizes?.full?.source_url
            || media.source_url
            || null;
        }
        if (featuredUrl && opts.mirrorImages) {
          featuredUrl = (await mirrorImage(featuredUrl)) || featuredUrl;
        }

        // Rewrite inline <img src=...> if mirroring is on
        let contentHtml = p.content?.rendered ?? '';
        if (opts.mirrorImages && contentHtml) {
          const srcs = Array.from(contentHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map((m) => m[1]);
          const uniq = Array.from(new Set(srcs));
          const map: Record<string, string> = {};
          for (const s of uniq) {
            const mirrored = await mirrorImage(s);
            if (mirrored) map[s] = mirrored;
          }
          for (const [src, mirrored] of Object.entries(map)) {
            contentHtml = contentHtml.split(src).join(mirrored);
          }
        }

        const author = p._embedded?.author?.[0]?.name ?? null;
        const tags = (p._embedded?.['wp:term'] ?? [])
          .flat()
          .filter((t) => t.taxonomy === 'post_tag' || t.taxonomy === 'category')
          .map((t) => t.name)
          .filter(Boolean)
          .slice(0, 10);

        const title = stripHtml(p.title?.rendered || 'Untitled');
        const excerpt = stripHtml(p.excerpt?.rendered || '').slice(0, 400);

        // Ensure slug is unique in our DB
        let slug = p.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || `post-${p.id}`;
        const { data: slugExists } = await sb.from('blog_posts').select('id').eq('slug', slug).maybeSingle();
        if (slugExists) slug = `${slug}-${p.id}`;

        const { error: insErr } = await sb.from('blog_posts').insert({
          slug,
          title,
          excerpt: excerpt || null,
          content_html: contentHtml,
          featured_image_url: featuredUrl,
          author,
          tags,
          status: opts.status,
          published_at: p.date || null,
          wp_source_url: siteUrl,
          wp_post_id: p.id,
        });
        if (insErr) {
          errors.push(`Post ${p.id} (${title}): ${insErr.message}`);
        } else {
          imported++;
        }
      } catch (e: any) {
        errors.push(`Post ${p.id}: ${e?.message ?? 'unknown error'}`);
      }
    }

    if (posts.length < perPage) break;
    page++;
    if (page > 40) {
      errors.push('Stopped after 40 pages (2000 posts max per run).');
      break;
    }
  }

  revalidatePath('/admin/blog');
  revalidatePath('/blog');

  return { ok: true, imported, skipped, totalFound, errors };
}

/** -----------------------------------------------------------------
 *  CRUD
 *  ----------------------------------------------------------------- */

export async function createPost(input: {
  slug: string; title: string; excerpt?: string | null; content_html: string;
  featured_image_url?: string | null; author?: string | null;
  status: 'draft' | 'published'; tags?: string[];
  seo_title?: string | null; seo_desc?: string | null;
  published_at?: string | null;
}) {
  const sb = await requireAdmin();
  const { data, error } = await sb.from('blog_posts').insert({
    ...input,
    tags: input.tags ?? [],
  }).select('id').single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { ok: true as const, id: data.id };
}

export async function updatePost(id: string, input: {
  slug?: string; title?: string; excerpt?: string | null; content_html?: string;
  featured_image_url?: string | null; author?: string | null;
  status?: 'draft' | 'published'; tags?: string[];
  seo_title?: string | null; seo_desc?: string | null;
  published_at?: string | null;
}) {
  const sb = await requireAdmin();
  const { error } = await sb.from('blog_posts').update(input).eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePath(`/blog/${input.slug}`);
  return { ok: true as const };
}

export async function deletePost(id: string) {
  const sb = await requireAdmin();
  const { error } = await sb.from('blog_posts').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { ok: true as const };
}
