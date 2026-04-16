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
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as BlogPostSummary[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
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

export async function getPostByIdAdmin(id: string) {
  const sb = createClient();
  const { data } = await sb.from('blog_posts').select('*').eq('id', id).maybeSingle();
  return data;
}
