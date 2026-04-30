import Link from 'next/link';
import { getAdminStats, getRecentOrders } from '@/lib/data/admin';
import { getAnalytics } from '@/lib/data/analytics';
import { formatSGD } from '@/lib/utils';
import { StatusBadge } from '@/components/admin/status-badge';
import { AnalyticsPanel } from '@/components/admin/analytics-panel';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [stats, recent, analytics] = await Promise.all([
    getAdminStats(),
    getRecentOrders(8),
    getAnalytics(),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink">Dashboard</h1>
        <p className="text-sm text-neutral-500">Revenue, orders, top products, and production queue.</p>
      </div>

      {/* Analytics */}
      <div className="mb-8">
        <AnalyticsPanel a={analytics} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="font-bold text-ink">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs font-semibold text-pink hover:underline">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-neutral-100">
              {recent.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-neutral-500">No orders yet.</div>
              ) : (
                recent.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">{o.order_number}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="mt-0.5 truncate text-xs text-neutral-500">
                        {o.customer_name} · {o.email} · {o.item_count} item{o.item_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-pink">{formatSGD(o.total_cents)}</div>
                      <div className="text-[10px] text-neutral-400">
                        {new Date(o.created_at).toLocaleDateString('en-SG')}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          {/* Needs attention: only renders when there's something to do.
              Hides itself on a clean queue so the dashboard doesn't
              shout at the admin when nothing is wrong. */}
          {(stats.stale_count > 0 || stats.ready_stale_count > 0) && (
            <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 shadow-brand">
              <h2 className="mb-2 flex items-center gap-2 font-bold text-amber-900">
                <span aria-hidden>⚠</span> Needs attention
              </h2>
              <div className="space-y-2 text-sm">
                {stats.stale_count > 0 && (
                  <Link
                    href="/admin/orders?status=pending"
                    className="block rounded border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:border-amber-500"
                  >
                    {stats.stale_count} order{stats.stale_count === 1 ? '' : 's'} pending / processing &gt; 24h →
                  </Link>
                )}
                {stats.ready_stale_count > 0 && (
                  <Link
                    href="/admin/orders?status=ready"
                    className="block rounded border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:border-amber-500"
                  >
                    {stats.ready_stale_count} ready order{stats.ready_stale_count === 1 ? '' : 's'} &gt; 48h →
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-ink">Order pipeline</h2>
            <div className="space-y-1">
              {/* Each row links to /admin/orders pre-filtered by that
                  status — saves a click. The previous design rendered
                  these as inert text. */}
              <PipelineRow href="/admin/orders?status=pending"    label="Pending"    value={stats.pending_count}    color="bg-amber-500" />
              <PipelineRow href="/admin/orders?status=processing" label="Processing" value={stats.processing_count} color="bg-cyan-brand" />
              <PipelineRow href="/admin/orders?status=ready"      label="Ready"      value={stats.ready_count}      color="bg-green-500" />
              <PipelineRow href="/admin/orders?status=shipped"    label="Shipped"    value={stats.shipped_count}    color="bg-blue-500" />
              <PipelineRow href="/admin/orders?status=completed"  label="Completed"  value={stats.completed_count}  color="bg-neutral-400" />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-ink">Catalog</h2>
            <div className="space-y-2 text-sm">
              <Link href="/admin/products" className="flex items-center justify-between hover:text-pink">
                <span className="text-neutral-600">Active products</span>
                <span className="font-bold text-ink">{stats.total_products}</span>
              </Link>
              <Link href="/admin/members" className="flex items-center justify-between hover:text-pink">
                <span className="text-neutral-600">Registered members</span>
                <span className="font-bold text-ink">{stats.total_members}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineRow({ href, label, value, color }: { href: string; label: string; value: number; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-neutral-50"
      title={`Filter orders by ${label.toLowerCase()}`}
    >
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="flex-1 text-neutral-600 group-hover:text-ink">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </Link>
  );
}
