import Link from 'next/link';
import { listAllPostsAdmin } from '@/lib/data/blog';
import { BlogImportPanel } from '@/components/admin/blog-import-panel';
import { BlogPostsTable } from '@/components/admin/blog-posts-table';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

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

      {/* List with checkboxes + bulk delete */}
      <BlogPostsTable posts={posts as any} />
    </div>
  );
}
