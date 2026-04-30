import { createClient } from '@/lib/supabase/server';

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author: string | null;
  published_at: string | null;
  tags: string[];
};

export type BlogPost = BlogPostSummary & {
  content_html: string;
  seo_title: string | null;
  seo_desc: string | null;
  status: 'draft' | 'published';
};

export async function listPublishedPosts(limit = 50): Promise<BlogPostSummary[]> {
  const sb = createClient();
  const { data } = await sb
    .from('blog_posts')
    .select('id, slug, title, excerpt, featured_image_url, author, published_at, tags')
    .eq('status', 'published')
    // WordPress imports flag soft-deleted posts by prefixing the slug with
    // `__trashed` while leaving status='published' — hide them from the index.
    .not('slug', 'like', '\\_\\_trashed%')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as BlogPostSummary[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  // Block direct `/blog/__trashed*` URLs as well — they render real content
  // because of the WP-imported status, but they're not posts the team wants
  // public.
  if (slug.startsWith('__trashed')) return null;
  const sb = createClient();
  const { data } = await sb
    .from('blog_posts')
    .select('id, slug, title, excerpt, content_html, featured_image_url, author, published_at, tags, seo_title, seo_desc, status')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  // Non-admin readers only see published posts
  if (data.status !== 'published') return null;
  return data as BlogPost;
}

/** Admin list — returns everything including drafts. Caller must auth-check. */
export async function listAllPostsAdmin() {
  const sb = createClient();
  const { data } = await sb
    .from('blog_posts')
    .select('id, slug, title, excerpt, featured_image_url, status, published_at, updated_at, wp_source_url, tags')
    .order('updated_at', { ascending: false })
    .limit(500);
  return data ?? [];
}

export type AdminPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  updated_at: string;
  wp_source_url: string | null;
  tags: string[] | null;
};

export type ListPostsAdminArgs = {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: 'all' | 'published' | 'draft';
};

export type ListPostsAdminResult = {
  rows: AdminPostRow[];
  total: number;
  published: number;
  drafts: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Admin list with server-side pagination, search and status filter. */
export async function listPostsAdminPaged(args: ListPostsAdminArgs = {}): Promise<ListPostsAdminResult> {
  const sb = createClient();
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(200, Math.max(5, args.pageSize ?? 25));
  const q = (args.query ?? '').trim();
  const status = args.status ?? 'all';

  // Build filtered query (reused for both data + counts)
  function filtered() {
    let qb = sb.from('blog_posts').select(
      'id, slug, title, excerpt, featured_image_url, status, published_at, updated_at, wp_source_url, tags',
      { count: 'exact' },
    );
    if (status !== 'all') qb = qb.eq('status', status);
    if (q) {
      // Escape % and , in the pattern so PostgREST doesn't choke
      const pat = `%${q.replace(/[%,]/g, '\\$&')}%`;
      qb = qb.or(`title.ilike.${pat},slug.ilike.${pat},excerpt.ilike.${pat}`);
    }
    return qb;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await filtered()
    .order('updated_at', { ascending: false })
    .range(from, to);

  const total = count ?? 0;

  // Stats ignore the search filter but respect nothing else — they describe
  // the whole library so the header numbers stay stable while the user types.
  const [publishedRes, draftsRes] = await Promise.all([
    sb.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    sb.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
  ]);

  return {
    rows: (data ?? []) as AdminPostRow[],
    total,
    published: publishedRes.count ?? 0,
    drafts: draftsRes.count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPostByIdAdmin(id: string) {
  const sb = createClient();
  const { data } = await sb.from('blog_posts').select('*').eq('id', id).maybeSingle();
  return data;
}
