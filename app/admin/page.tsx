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
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-ink">Order pipeline</h2>
            <div className="space-y-2">
              <PipelineRow label="Pending" value={stats.pending_count} color="bg-amber-500" />
              <PipelineRow label="Processing" value={stats.processing_count} color="bg-cyan-brand" />
              <PipelineRow label="Ready" value={stats.ready_count} color="bg-green-500" />
              <PipelineRow label="Completed" value={stats.completed_count} color="bg-neutral-400" />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-ink">Catalog</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Active products</span>
                <span className="font-bold text-ink">{stats.total_products}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Registered members</span>
                <span className="font-bold text-ink">{stats.total_members}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border-2 border-ink bg-white p-4 shadow-brand">
            <h2 className="mb-2 font-bold text-ink">Quick actions</h2>
            <div className="space-y-2">
              <Link href="/admin/orders" className="block rounded border border-neutral-200 px-3 py-2 text-xs font-semibold text-ink hover:border-ink">
                📋 View all orders
              </Link>
              <Link href="/admin/products" className="block rounded border border-neutral-200 px-3 py-2 text-xs font-semibold text-ink hover:border-ink">
                ✏️ Edit a product
              </Link>
              <Link href="/admin/promos" className="block rounded border border-neutral-200 px-3 py-2 text-xs font-semibold text-ink hover:border-ink">
                🎟️ Manage promos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: 'blue' | 'pink' | 'amber' | 'cyan' }) {
  const styles = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    pink: 'border-pink/40 bg-pink/5 text-pink',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-900',
  };
  return (
    <div className={`rounded-lg border-2 p-4 ${styles[color]}`}>
      <div className="text-2xl font-black lg:text-3xl">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
    </div>
  );
}

function PipelineRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="flex-1 text-neutral-600">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}
