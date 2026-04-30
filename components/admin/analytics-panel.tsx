import { formatSGD } from '@/lib/utils';
import type { AnalyticsBundle } from '@/lib/data/analytics';

export function AnalyticsPanel({ a }: { a: AnalyticsBundle }) {
  const maxCents = Math.max(...a.daily.map((d) => d.cents), 1);
  return (
    <div className="space-y-6">
      {/* Top-line numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Today" value={formatSGD(a.revenueToday)} hint="revenue, completed" />
        <Metric label="Last 7 days" value={formatSGD(a.revenue7d)} hint={`${a.orders7d} order${a.orders7d === 1 ? '' : 's'}`} />
        <Metric label="Last 30 days" value={formatSGD(a.revenue30d)} hint={`${a.orders30d} order${a.orders30d === 1 ? '' : 's'}`} />
        <Metric label="Avg order" value={formatSGD(a.avgOrderCents)} hint="last 30 days" />
        <Metric
          label="NPS · 90d"
          value={a.nps90d === null ? '—' : String(a.nps90d)}
          hint={a.npsResponseCount90d === 0 ? 'No survey responses yet' : `${a.npsResponseCount90d} response${a.npsResponseCount90d === 1 ? '' : 's'}`}
        />
      </div>

      {/* Daily revenue chart */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">Revenue · last 30 days</div>
            <div className="mt-1 text-sm font-bold text-ink">
              {formatSGD(a.revenue30d)}
              <span className="ml-2 text-xs font-normal text-neutral-500">from {a.orders30d} orders</span>
            </div>
          </div>
        </div>
        <div className="flex h-40 items-end gap-[2px]">
          {a.daily.map((d, i) => {
            const pct = (d.cents / maxCents) * 100;
            const date = new Date(d.date);
            const isToday = new Date().toISOString().slice(0, 10) === d.date;
            return (
              <div key={i} className="group relative flex-1" title={`${d.date} · ${formatSGD(d.cents)} · ${d.orders} orders`}>
                <div
                  className={`w-full rounded-t transition-colors ${isToday ? 'bg-pink' : 'bg-neutral-300 group-hover:bg-pink'}`}
                  style={{ height: `${Math.max(2, pct)}%` }}
                />
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] text-white group-hover:block">
                  {date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })} · {formatSGD(d.cents)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
          <span>{new Date(a.daily[0]?.date ?? '').toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">Top products · last 30 days</div>
        </div>
        {a.topProducts.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-neutral-500">No completed orders yet in the last 30 days.</div>
        ) : (
          a.topProducts.map((p, i) => {
            const maxRev = a.topProducts[0].revenue_cents || 1;
            const pct = (p.revenue_cents / maxRev) * 100;
            return (
              <div key={p.slug} className="border-b border-neutral-100 px-4 py-3 last:border-0">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold text-ink">{i + 1}. {p.name}</span>
                  <span className="text-pink font-bold">{formatSGD(p.revenue_cents)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full bg-pink" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-neutral-500 w-20 text-right">{p.orders} ordered</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border-2 border-neutral-200 bg-white p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-1.5 text-2xl font-black text-ink lg:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}
