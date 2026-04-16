'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { createPost, updatePost, deletePost } from '@/app/admin/blog/actions';
import { ImageUpload } from '@/components/admin/image-upload';

type Existing = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_html: string;
  featured_image_url: string | null;
  author: string | null;
  status: 'draft' | 'published';
  tags: string[];
  seo_title: string | null;
  seo_desc: string | null;
  published_at: string | null;
};

export function BlogPostEditor({ post }: { post: Existing | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const [slug, setSlug] = useState(post?.slug ?? '');
  const [title, setTitle] = useState(post?.title ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [contentHtml, setContentHtml] = useState(post?.content_html ?? '');
  const [featuredUrl, setFeaturedUrl] = useState(post?.featured_image_url ?? '');
  const [author, setAuthor] = useState(post?.author ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status ?? 'draft');
  const [tags, setTags] = useState((post?.tags ?? []).join(', '));
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? '');
  const [seoDesc, setSeoDesc] = useState(post?.seo_desc ?? '');
  const [publishedAt, setPublishedAt] = useState(post?.published_at ? post.published_at.slice(0, 16) : '');

  function autoSlug() {
    const s = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
    setSlug(s);
  }

  function handleSave() {
    setErr(null);
    if (!title.trim() || !slug.trim()) {
      setErr('Title and slug are required');
      return;
    }
    const input = {
      slug: slug.trim(),
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      content_html: contentHtml,
      featured_image_url: featuredUrl || null,
      author: author.trim() || null,
      status,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      seo_title: seoTitle.trim() || null,
      seo_desc: seoDesc.trim() || null,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
    };
    startTransition(async () => {
      if (post) {
        const r = await updatePost(post.id, input);
        if (!r.ok) setErr(r.error);
        else {
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 1600);
        }
      } else {
        const r = await createPost(input);
        if (!r.ok) setErr(r.error);
        else router.push(`/admin/blog/${r.id}`);
      }
    });
  }

  function handleDelete() {
    if (!post) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    startTransition(async () => {
      const r = await deletePost(post.id);
      if (!r.ok) setErr(r.error);
      else router.push('/admin/blog');
    });
  }

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/blog" className="text-sm font-bold text-neutral-500 hover:text-ink">← Back to posts</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-5">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => { if (!slug && title) autoSlug(); }}
                className={`${inputCls} text-lg font-bold`}
                placeholder="How to print a name card that gets callbacks"
              />
            </label>
            <div className="mt-3 flex items-end gap-2">
              <label className="block flex-1">
                <span className="mb-1 block text-xs font-bold text-ink">URL slug</span>
                <div className="flex items-center">
                  <span className="rounded-l border-2 border-r-0 border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 font-mono">/blog/</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className={`${inputCls} rounded-l-none font-mono text-xs`}
                    placeholder="name-card-callbacks"
                  />
                </div>
              </label>
              <button type="button" onClick={autoSlug} className="rounded border border-neutral-200 px-3 py-2 text-[11px] font-bold text-neutral-600 hover:border-ink">
                From title
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Excerpt</span>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className={inputCls}
                placeholder="A short summary shown on the blog index and social cards."
              />
            </label>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Content (HTML)</span>
              <span className="text-[10px] text-neutral-500">Imported posts keep original WordPress HTML. Paste or edit HTML freely.</span>
            </div>
            <textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              rows={24}
              className={`${inputCls} font-mono text-xs leading-relaxed`}
              placeholder="<p>Start writing…</p>"
            />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 text-xs font-bold text-ink">SEO overrides (optional)</div>
            <label className="mb-3 block">
              <span className="mb-1 block text-[11px] text-neutral-600">SEO title</span>
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-neutral-600">SEO description</span>
              <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} className={inputCls} />
            </label>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-3 text-xs font-bold text-ink">Publish</div>
            <div className="mb-3">
              <span className="mb-1 block text-[11px] text-neutral-600">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={inputCls}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="mb-4">
              <span className="mb-1 block text-[11px] text-neutral-600">Publish date</span>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className={inputCls}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="w-full rounded-full bg-pink py-2 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50"
            >
              {isPending ? 'Saving…' : post ? 'Save changes' : 'Create post'}
            </button>
            {err && <div className="mt-2 text-xs font-bold text-red-600">{err}</div>}
            {savedFlash && <div className="mt-2 text-xs font-bold text-green-600">✓ Saved</div>}
            {post && status === 'published' && (
              <Link
                href={`/blog/${slug}`}
                target="_blank"
                className="mt-3 block text-center text-[11px] font-bold text-neutral-500 hover:text-ink"
              >
                View live →
              </Link>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-2 text-xs font-bold text-ink">Featured image</div>
            <ImageUpload
              value={featuredUrl}
              onChange={setFeaturedUrl}
              prefix={`blog-${slug || 'post'}`}
              aspect={16 / 9}
              size="lg"
              label="Featured image"
            />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Author</span>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} placeholder="Printvolution team" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Tags</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="printing, tips, business" />
              <span className="mt-1 block text-[10px] text-neutral-500">Comma-separated</span>
            </label>
          </div>

          {post && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white py-2 text-xs font-bold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Delete post
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
