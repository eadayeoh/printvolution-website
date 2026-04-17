'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { deletePost, deletePosts } from '@/app/admin/blog/actions';

type Post = {
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

type Props = {
  posts: Post[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalMatching: number;
  initialQuery: string;
  initialStatus: 'all' | 'published' | 'draft';
};

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}

export function BlogPostsTable({
  posts,
  page,
  pageSize,
  totalPages,
  totalMatching,
  initialQuery,
  initialStatus,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState(initialQuery);
  const [err, setErr] = useState<string | null>(null);

  // Debounced URL sync for the search box so each keystroke doesn't hammer the server
  useEffect(() => {
    if (query === initialQuery) return;
    const t = setTimeout(() => {
      pushParams({ q: query || null, page: '1' });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const pushParams = useCallback((patch: Record<string, string | null>) => {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    const qs = p.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }, [pathname, router, searchParams]);

  function setStatus(s: 'all' | 'published' | 'draft') {
    pushParams({ status: s === 'all' ? null : s, page: '1' });
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === page) return;
    pushParams({ page: String(p) });
  }

  function setPageSize(sz: number) {
    pushParams({ size: String(sz), page: '1' });
  }

  const allOnPageSelected = posts.length > 0 && posts.every((p) => selected.has(p.id));
  const someSelected = selected.size > 0;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    if (allOnPageSelected) {
      const next = new Set(selected);
      posts.forEach((p) => next.delete(p.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      posts.forEach((p) => next.add(p.id));
      setSelected(next);
    }
  }

  function deleteOne(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    setErr(null);
    startTransition(async () => {
      const r = await deletePost(id);
      if (!r.ok) setErr(r.error);
      else {
        const next = new Set(selected);
        next.delete(id);
        setSelected(next);
        router.refresh();
      }
    });
  }

  function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} post${selected.size === 1 ? '' : 's'}? This can't be undone.`)) return;
    setErr(null);
    const ids = Array.from(selected);
    startTransition(async () => {
      const r = await deletePosts(ids);
      if (!r.ok) setErr(r.error ?? 'Bulk delete failed');
      else {
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  const pageWindow = getPageWindow(page, totalPages);
  const rangeFrom = totalMatching === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, totalMatching);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, slug, excerpt…"
            className="w-full rounded border-2 border-neutral-200 bg-white px-9 py-2 text-sm focus:border-pink focus:outline-none"
          />
          {isPending && (
            <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-400" />
          )}
        </div>
        <div className="flex rounded-full border border-neutral-200 bg-white p-1 text-[11px] font-bold">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 ${initialStatus === s ? 'bg-ink text-white' : 'text-neutral-500 hover:text-ink'}`}
            >
              {s === 'all' ? 'All' : s === 'published' ? 'Published' : 'Drafts'}
            </button>
          ))}
        </div>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
          className="rounded border-2 border-neutral-200 bg-white px-2 py-1.5 text-xs font-bold text-neutral-600"
          aria-label="Page size"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>

      {someSelected && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border-2 border-pink bg-pink/5 px-4 py-2">
          <div className="text-sm font-bold text-ink">
            {selected.size} post{selected.size === 1 ? '' : 's'} selected
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-full px-3 py-1 text-xs font-bold text-neutral-500 hover:text-ink"
              disabled={isPending}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Delete {selected.size}
            </button>
          </div>
        </div>
      )}

      {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">✗ {err}</div>}

      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="grid grid-cols-[40px_80px_1fr_120px_120px_120px_80px] gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          <div>
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={toggleAll}
              className="h-4 w-4 cursor-pointer"
              aria-label="Select all on page"
            />
          </div>
          <div>Image</div>
          <div>Title / Slug</div>
          <div>Status</div>
          <div>Published</div>
          <div>Source</div>
          <div>Actions</div>
        </div>

        {posts.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-neutral-500">
            {totalMatching === 0 && !initialQuery && initialStatus === 'all'
              ? <>No posts yet. Import from WordPress above, or click <strong>New post</strong>.</>
              : <>No posts match your filter.</>
            }
          </div>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              className={`grid grid-cols-[40px_80px_1fr_120px_120px_120px_80px] items-center gap-3 border-b border-neutral-100 px-4 py-3 text-sm ${selected.has(p.id) ? 'bg-pink/5' : ''}`}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="h-4 w-4 cursor-pointer"
                  aria-label={`Select ${p.title}`}
                />
              </div>
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
                {p.wp_source_url ? safeHost(p.wp_source_url) : 'Manual'}
              </div>
              <div className="flex items-center gap-1">
                <Link href={`/admin/blog/${p.id}`} className="rounded px-2 py-1 text-[11px] font-bold text-pink hover:bg-pink/10">
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => deleteOne(p.id, p.title)}
                  disabled={isPending}
                  className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Delete ${p.title}`}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-neutral-500">
          {totalMatching === 0
            ? 'No posts'
            : <>Showing <strong>{rangeFrom}</strong>–<strong>{rangeTo}</strong> of <strong>{totalMatching}</strong></>
          }
          {selected.size > 0 && ` · ${selected.size} selected`}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || isPending}
              className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-600 disabled:opacity-40 hover:enabled:bg-neutral-50"
            >
              <ChevronLeft size={12} /> Prev
            </button>
            {pageWindow.map((p, i) =>
              p === null ? (
                <span key={`dots-${i}`} className="px-1 text-[11px] text-neutral-400">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  disabled={isPending}
                  className={`min-w-[28px] rounded px-2 py-1 text-[11px] font-bold ${
                    p === page
                      ? 'bg-ink text-white'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || isPending}
              className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-600 disabled:opacity-40 hover:enabled:bg-neutral-50"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function safeHost(url: string): string {
  try { return new URL(url).hostname; } catch { return 'Link'; }
}

function getPageWindow(current: number, total: number): Array<number | null> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | null> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push(null);
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push(null);
  out.push(total);
  return out;
}
