import Link from 'next/link';
import { listOrders } from '@/lib/data/admin';
import { OrdersTable } from '@/components/admin/orders-table';

export const metadata = { title: 'Orders' };
export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const pageSize = 25;
  const { rows, total } = await listOrders({ status: searchParams.status, search: searchParams.q, page, pageSize });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(p: number): string {
    const sp = new URLSearchParams();
    if (searchParams.status) sp.set('status', searchParams.status);
    if (searchParams.q) sp.set('q', searchParams.q);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/admin/orders${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ink">Orders</h1>
          <p className="text-sm text-neutral-500">
            Showing {rows.length ? (page - 1) * pageSize + 1 : 0}–{(page - 1) * pageSize + rows.length} of {total}
          </p>
        </div>
      </div>

      <OrdersTable orders={rows} initialStatus={searchParams.status ?? 'all'} initialSearch={searchParams.q ?? ''} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-neutral-500">Page {page} of {totalPages}</div>
          <div className="flex gap-1">
            <PageLink href={pageHref(Math.max(1, page - 1))} disabled={page === 1}>← Prev</PageLink>
            {pageNumbers(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={i} className="px-3 py-1.5 text-xs text-neutral-400">…</span>
              ) : (
                <PageLink key={i} href={pageHref(p)} active={p === page}>{p}</PageLink>
              )
            )}
            <PageLink href={pageHref(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next →</PageLink>
          </div>
        </div>
      )}
    </div>
  );
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  if (current > 3) out.push('…');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
  if (current < total - 2) out.push('…');
  out.push(total);
  return out;
}

function PageLink({ href, children, active, disabled }: { href: string; children: React.ReactNode; active?: boolean; disabled?: boolean }) {
  if (disabled) return <span className="rounded border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-bold text-neutral-400">{children}</span>;
  return (
    <Link
      href={href}
      className={`rounded border px-3 py-1.5 text-xs font-bold transition-colors ${active ? 'border-ink bg-ink text-white' : 'border-neutral-200 bg-white text-ink hover:border-ink'}`}
    >
      {children}
    </Link>
  );
}
