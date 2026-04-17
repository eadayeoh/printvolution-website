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

/**
 * Import posts from a WordPress WXR (eXtended RSS) export XML file.
 * The admin downloads this file from WP → Tools → Export → Posts, then
 * uploads it here. No public API access required.
 */
export async function importFromWxr(
  formData: FormData,
  opts: { status: 'draft' | 'published' }
): Promise<{ ok: boolean; imported: number; skipped: number; errors: string[]; totalFound: number }> {
  try { await requireAdmin(); }
  catch (e: any) { return { ok: false, imported: 0, skipped: 0, totalFound: 0, errors: [e.message ?? 'auth'] }; }

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, imported: 0, skipped: 0, totalFound: 0, errors: ['No file'] };
  if (file.size === 0) return { ok: false, imported: 0, skipped: 0, totalFound: 0, errors: ['Empty file'] };
  if (file.size > 50 * 1024 * 1024) return { ok: false, imported: 0, skipped: 0, totalFound: 0, errors: ['File too large (max 50MB)'] };

  let xmlText: string;
  try { xmlText = await file.text(); }
  catch { return { ok: false, imported: 0, skipped: 0, totalFound: 0, errors: ['Could not read file'] }; }

  const { XMLParser } = await import('fast-xml-parser');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
    removeNSPrefix: false,
  });

  let parsed: any;
  try { parsed = parser.parse(xmlText); }
  catch (e: any) { return { ok: false, imported: 0, skipped: 0, totalFound: 0, errors: [`XML parse failed: ${e?.message ?? 'invalid XML'}`] }; }

  const channel = parsed?.rss?.channel;
  if (!channel) return { ok: false, imported: 0, skipped: 0, totalFound: 0, errors: ['Not a WordPress WXR file (no <rss><channel>)'] };

  const siteUrl = String(channel['wp:base_site_url'] ?? channel.link ?? '').trim();
  const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

  const sb = serviceClient();
  let imported = 0, skipped = 0;
  const errors: string[] = [];
  let totalFound = 0;

  function pickText(field: any): string {
    if (field === undefined || field === null) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      if (field.__cdata) return String(field.__cdata);
      if ('#text' in field) return String(field['#text']);
    }
    return String(field);
  }

  for (const item of items as any[]) {
    const postType = pickText(item['wp:post_type']);
    if (postType && postType !== 'post') continue;
    const postStatus = pickText(item['wp:status']);
    if (postStatus === 'trash' || postStatus === 'auto-draft') continue;
    totalFound++;

    try {
      const title = stripHtml(pickText(item.title) || 'Untitled');
      const slug = (pickText(item['wp:post_name']) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).slice(0, 120);
      const wpId = parseInt(pickText(item['wp:post_id']) || '0', 10) || null;
      const contentHtml = pickText(item['content:encoded']) || '';
      const excerptHtml = pickText(item['excerpt:encoded']) || '';
      const excerpt = stripHtml(excerptHtml).slice(0, 400);
      const author = stripHtml(pickText(item['dc:creator']) || '') || null;
      const date = pickText(item['wp:post_date_gmt']) || pickText(item.pubDate) || null;

      // Tags + categories
      const categories = Array.isArray(item.category) ? item.category : item.category ? [item.category] : [];
      const tags = (categories as any[])
        .map((c) => typeof c === 'object' ? pickText(c) : String(c))
        .filter(Boolean)
        .slice(0, 10);

      // Featured image is a separate <item> with post_type='attachment' referencing _thumbnail_id
      // For simplicity v1: pull the first <img> src from content_encoded
      let featuredUrl: string | null = null;
      const imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) featuredUrl = imgMatch[1];

      // Dedup: source + wp_post_id
      if (wpId) {
        const { data: existing } = await sb
          .from('blog_posts').select('id').eq('wp_source_url', siteUrl).eq('wp_post_id', wpId).maybeSingle();
        if (existing) { skipped++; continue; }
      } else {
        const { data: existing } = await sb
          .from('blog_posts').select('id').eq('slug', slug).maybeSingle();
        if (existing) { skipped++; continue; }
      }

      // Ensure slug unique
      let finalSlug = slug;
      const { data: slugExists } = await sb.from('blog_posts').select('id').eq('slug', finalSlug).maybeSingle();
      if (slugExists) finalSlug = `${slug}-${wpId ?? Date.now()}`;

      const { error: insErr } = await sb.from('blog_posts').insert({
        slug: finalSlug,
        title,
        excerpt: excerpt || null,
        content_html: contentHtml,
        featured_image_url: featuredUrl,
        author,
        tags,
        status: postStatus === 'publish' ? opts.status : 'draft',
        published_at: date ? new Date(date).toISOString() : null,
        wp_source_url: siteUrl || null,
        wp_post_id: wpId,
      });
      if (insErr) errors.push(`${title}: ${insErr.message}`);
      else imported++;
    } catch (e: any) {
      errors.push(`Item failed: ${e?.message ?? 'unknown'}`);
    }
  }

  revalidatePath('/admin/blog');
  revalidatePath('/blog');

  return { ok: true, imported, skipped, totalFound, errors };
}

export async function deletePost(id: string) {
  const sb = await requireAdmin();
  const { error } = await sb.from('blog_posts').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { ok: true as const };
}

/** Delete many posts in one call. Returns the number actually deleted. */
export async function deletePosts(ids: string[]): Promise<{ ok: boolean; deleted?: number; error?: string }> {
  const sb = await requireAdmin();
  if (ids.length === 0) return { ok: true, deleted: 0 };
  const { error, count } = await sb.from('blog_posts').delete({ count: 'exact' }).in('id', ids);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { ok: true, deleted: count ?? ids.length };
}
