import Link from 'next/link';
import { listAllPostsAdmin } from '@/lib/data/blog';
import { BlogImportPanel } from '@/components/admin/blog-import-panel';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

export default async function AdminBlogListPage() {
  const posts = await listAllPostsAdmin();
  const total = posts.length;
  const published = posts.filter((p: any) => p.status === 'published').length;
  const drafts = total - published;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink">Blog</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {total} post{total === 1 ? '' : 's'} · {published} published · {drafts} draft{drafts === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark"
          >
            <Plus size={14} /> New post
          </Link>
        </div>
      </div>

      {/* Import panel */}
      <div className="mb-8">
        <BlogImportPanel />
      </div>

      {/* List */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="grid grid-cols-[80px_1fr_140px_120px_120px_100px] gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          <div>Image</div>
          <div>Title / Slug</div>
          <div>Status</div>
          <div>Published</div>
          <div>Source</div>
          <div>Actions</div>
        </div>
        {posts.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-neutral-500">
            No posts yet. Import from WordPress above, or click <strong>New post</strong>.
          </div>
        ) : (
          posts.map((p: any) => (
            <div key={p.id} className="grid grid-cols-[80px_1fr_140px_120px_120px_100px] items-center gap-3 border-b border-neutral-100 px-4 py-3 text-sm">
              <div className="h-14 w-14 overflow-hidden rounded bg-neutral-100">
                {p.featured_image_url ? (
                  <img src={p.featured_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">✍️</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold text-ink">{p.title}</div>
                <div className="truncate text-[11px] text-neutral-500 font-mono">/blog/{p.slug}</div>
              </div>
              <div>
                {p.status === 'published' ? (
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Published</span>
                ) : (
                  <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">Draft</span>
                )}
              </div>
              <div className="text-[11px] text-neutral-600">{fmt(p.published_at)}</div>
              <div className="truncate text-[11px] text-neutral-500" title={p.wp_source_url || ''}>
                {p.wp_source_url ? new URL(p.wp_source_url).hostname : 'Manual'}
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/blog/${p.id}`} className="text-[11px] font-bold text-pink hover:underline">Edit</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
