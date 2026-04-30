'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { setOrderStatus } from '@/app/staff/actions';

/**
 * Kanban-style swim-lane board for production staff.
 * 4 lanes: Pending → Processing → Ready → Completed.
 * Click "Advance" on any card to push it to the next lane.
 */

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  delivery_method: string;
  created_at: string;
  order_items?: Array<{ id: string }>;
};

const LANES: Array<{ key: string; label: string; accent: string; bg: string }> = [
  { key: 'pending',    label: 'Pending',    accent: '#f59e0b', bg: '#fef3c7' },
  { key: 'processing', label: 'Processing', accent: '#0891b2', bg: '#cffafe' },
  { key: 'ready',      label: 'Ready',      accent: '#16a34a', bg: '#dcfce7' },
  { key: 'completed',  label: 'Completed',  accent: '#525252', bg: '#f5f5f5' },
];

const NEXT_STATUS: Record<string, string> = {
  pending: 'processing',
  processing: 'ready',
  ready: 'completed',
};

export function StaffBoard({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function advance(id: string, current: string) {
    const next = NEXT_STATUS[current];
    if (!next) return;
    startTransition(async () => {
      await setOrderStatus(id, next);
      router.refresh();
    });
  }

  // Group orders by status
  const grouped: Record<string, Order[]> = {};
  for (const l of LANES) grouped[l.key] = [];
  for (const o of orders) {
    if (grouped[o.status]) grouped[o.status].push(o);
  }

  function fmtTime(iso: string): string {
    try {
      const d = new Date(iso);
      const diffH = (Date.now() - d.getTime()) / 36e5;
      if (diffH < 1) return `${Math.round(diffH * 60)}m ago`;
      if (diffH < 24) return `${Math.round(diffH)}h ago`;
      return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {LANES.map((lane) => {
        const items = grouped[lane.key] ?? [];
        return (
          <div key={lane.key} className="flex flex-col overflow-hidden rounded-lg border-2 border-neutral-200 bg-neutral-50">
            {/* Lane header */}
            <div
              className="flex items-center justify-between border-b-2 px-3 py-2.5"
              style={{ borderColor: lane.accent, background: lane.bg }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: lane.accent }} />
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: lane.accent }}>
                  {lane.label}
                </span>
              </div>
              <span className="text-xs font-bold" style={{ color: lane.accent }}>{items.length}</span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 p-2.5">
              {items.length === 0 ? (
                <div className="py-8 text-center text-[11px] italic text-neutral-400">Empty</div>
              ) : (
                items.map((o) => (
                  <div key={o.id} className="rounded-md border border-neutral-200 bg-white p-3 text-xs shadow-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-black text-ink">{o.order_number}</span>
                      {/* Revenue intentionally hidden on /staff. */}
                    </div>
                    <div className="truncate font-semibold text-ink">{o.customer_name}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>{o.order_items?.length ?? 0} items · {o.delivery_method === 'pickup' ? '🏬 pickup' : '🚚 delivery'}</span>
                      <span>{fmtTime(o.created_at)}</span>
                    </div>
                    {NEXT_STATUS[o.status] && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => advance(o.id, o.status)}
                        className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded border-2 border-ink bg-ink px-2 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-pink hover:border-pink disabled:opacity-50"
                      >
                        Advance to {NEXT_STATUS[o.status]} <ArrowRight size={10} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
