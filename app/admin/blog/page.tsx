import Link from 'next/link';
import { listPostsAdminPaged } from '@/lib/data/blog';
import { BlogImportPanel } from '@/components/admin/blog-import-panel';
import { BlogPostsTable } from '@/components/admin/blog-posts-table';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

type SearchParams = {
  page?: string;
  q?: string;
  status?: string;
  size?: string;
};

export default async function AdminBlogListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = parseInt(searchParams.page ?? '1', 10) || 1;
  const pageSize = parseInt(searchParams.size ?? '25', 10) || 25;
  const query = searchParams.q ?? '';
  const status = (searchParams.status === 'published' || searchParams.status === 'draft')
    ? searchParams.status
    : 'all';

  const result = await listPostsAdminPaged({ page, pageSize, query, status });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink">Blog</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {result.published + result.drafts} post{result.published + result.drafts === 1 ? '' : 's'}
            {' · '}{result.published} published · {result.drafts} draft{result.drafts === 1 ? '' : 's'}
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

      <div className="mb-8">
        <BlogImportPanel />
      </div>

      <BlogPostsTable
        posts={result.rows}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        totalMatching={result.total}
        initialQuery={query}
        initialStatus={status}
      />
    </div>
  );
}
