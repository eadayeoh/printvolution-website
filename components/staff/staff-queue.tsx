'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ArrowRight, Check, LayoutList, Columns } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import { setOrderStatus, setItemProductionStatus } from '@/app/staff/actions';
import { createClient } from '@/lib/supabase/client';
import { StaffBoard } from '@/components/staff/staff-board';

type Props = {
  orders: any[];
  counts: Record<string, number>;
  initialStatus: string;
  initialSearch: string;
};

const STATUSES = ['all', 'pending', 'processing', 'ready', 'completed'];
const NEXT_STATUS: Record<string, string> = {
  pending: 'processing',
  processing: 'ready',
  ready: 'completed',
};

export function StaffQueue({ orders: initialOrders, counts, initialStatus, initialSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orders, setOrders] = useState(initialOrders);
  const [view, setView] = useState<'list' | 'board'>(() => {
    if (typeof window === 'undefined') return 'list';
    return (localStorage.getItem('pv-staff-view') as any) || 'list';
  });
  function setViewPersistent(v: 'list' | 'board') {
    setView(v);
    try { localStorage.setItem('pv-staff-view', v); } catch {}
  }

  // Keep local state in sync with server re-renders
  useEffect(() => { setOrders(initialOrders); }, [initialOrders]);

  // Realtime subscription: refresh when orders change
  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel('staff-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        router.refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        router.refresh();
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [router]);

  function applyFilter(nextStatus?: string, nextSearch?: string) {
    const params = new URLSearchParams(searchParams.toString());
    const s = nextStatus ?? params.get('status') ?? 'all';
    const q = nextSearch ?? params.get('q') ?? '';
    if (s && s !== 'all') params.set('status', s); else params.delete('status');
    if (q) params.set('q', q); else params.delete('q');
    startTransition(() => {
      router.push(`/staff${params.toString() ? `?${params.toString()}` : ''}`);
    });
  }

  function advanceStatus(orderId: string, currentStatus: string) {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    startTransition(async () => {
      await setOrderStatus(orderId, next);
      router.refresh();
    });
  }

  function completeItem(itemId: string) {
    startTransition(async () => {
      await setItemProductionStatus(itemId, 'completed');
      router.refresh();
    });
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter(undefined, search)}
            placeholder="Search order #, name, email, phone..."
            className="w-full rounded border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-pink focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => {
            const count = s === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[s] ?? 0;
            return (
              <button
                key={s}
                onClick={() => applyFilter(s, search)}
                className={`relative rounded border px-3 py-1.5 text-xs font-bold transition-colors ${
                  initialStatus === s
                    ? 'border-ink bg-ink text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-ink'
                }`}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] ${initialStatus === s ? 'bg-white/20' : 'bg-neutral-100 text-neutral-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-full border border-neutral-200 bg-white p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setViewPersistent('list')}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${view === 'list' ? 'bg-ink text-white' : 'text-neutral-500 hover:text-ink'}`}
            >
              <LayoutList size={12} /> List
            </button>
            <button
              type="button"
              onClick={() => setViewPersistent('board')}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${view === 'board' ? 'bg-ink text-white' : 'text-neutral-500 hover:text-ink'}`}
            >
              <Columns size={12} /> Board
            </button>
          </div>
          <span className="text-[11px] text-neutral-400">Updates live</span>
        </div>
      </div>

      {/* Board (swim lanes) */}
      {view === 'board' && (
        <StaffBoard orders={orders} />
      )}

      {/* List view — existing card-per-order layout below */}
      {view === 'list' && (
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-500">
            No orders match.
          </div>
        ) : orders.map((o) => {
          const isExpanded = expanded === o.id;
          const items = o.order_items ?? [];
          const pendingItems = items.filter((i: any) => i.production_status !== 'completed').length;
          return (
            <div key={o.id} className="rounded-lg border-2 border-neutral-200 bg-white transition-all hover:border-neutral-300">
              {/* Collapsed header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : o.id)}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-ink">{o.order_number}</span>
                    <StatusBadge status={o.status} />
                    <span className="text-sm font-semibold text-ink">{o.customer_name}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
                    <span>📧 {o.email}</span>
                    <span>📞 {o.phone}</span>
                    <span>🚚 {o.delivery_method}</span>
                    <span>📦 {items.length} item{items.length !== 1 ? 's' : ''}{pendingItems > 0 && o.status !== 'completed' ? ` · ${pendingItems} pending` : ''}</span>
                  </div>
                </div>
                <div className="text-right">
                  {/* Revenue lives in /admin only. Staff dashboard
                      is scoped to fulfillment — order number, customer,
                      items, status — not money. */}
                  <div className="text-[10px] text-neutral-400">
                    {new Date(o.created_at).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-neutral-100 bg-neutral-50 p-4">
                  <div className="space-y-3">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex gap-3 rounded border border-neutral-200 bg-white p-3">
                        <div className="text-3xl flex-shrink-0">{item.icon ?? '📦'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div className="font-bold text-ink">{item.product_name} <span className="text-xs font-normal text-neutral-500">× {item.qty}</span></div>
                            {item.production_method && (
                              <span className="rounded bg-cyan-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-900">
                                {item.production_method}
                              </span>
                            )}
                          </div>
                          {Object.keys(item.config ?? {}).length > 0 && (
                            <div className="mt-1 text-xs text-neutral-600">
                              {Object.entries(item.config).map(([k, v]) => (
                                <span key={k} className="mr-3">
                                  <span className="text-neutral-400">{k}:</span> <strong>{v as string}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                          {item.personalisation_notes && (
                            <div className="mt-1 rounded bg-yellow-50 px-2 py-1 text-[11px] text-yellow-900">
                              <strong>Personalisation:</strong> {item.personalisation_notes}
                            </div>
                          )}
                          {item.gift_image_url && (
                            <div className="mt-1 text-[11px]">
                              <a href={item.gift_image_url} target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">
                                View uploaded image →
                              </a>
                            </div>
                          )}
                          {/* Production-file downloads. Shown only when
                              the item's product is one of the code-driven
                              templates that re-renders into a foil SVG.
                              Each link hits the existing per-item endpoint
                              (now allowed for staff) which streams an SVG
                              with a download header. */}
                          {(item.product_slug === 'song-lyrics-photo-frame'
                            || item.product_slug === 'city-map-photo-frame'
                            || item.product_slug === 'star-map-photo-frame'
                            || item.product_slug === 'star-map-poster'
                            || item.product_slug === 'spotify-music-plaque'
                            || item.product_slug === 'bluetooth-spotify-magnet') && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.product_slug === 'song-lyrics-photo-frame' && (
                                <a
                                  href={`/api/admin/orders/${o.id}/items/${item.id}/foil-svg`}
                                  className="inline-flex items-center gap-1 rounded-full border border-ink bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-ink hover:text-white"
                                  download
                                >
                                  ↓ Foil SVG
                                </a>
                              )}
                              {item.product_slug === 'city-map-photo-frame' && (
                                <a
                                  href={`/api/admin/orders/${o.id}/items/${item.id}/city-map-svg`}
                                  className="inline-flex items-center gap-1 rounded-full border border-ink bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-ink hover:text-white"
                                  download
                                >
                                  ↓ City-map SVG
                                </a>
                              )}
                              {(item.product_slug === 'star-map-photo-frame' || item.product_slug === 'star-map-poster') && (
                                <a
                                  href={`/api/admin/orders/${o.id}/items/${item.id}/star-map-svg`}
                                  className="inline-flex items-center gap-1 rounded-full border border-ink bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-ink hover:text-white"
                                  download
                                >
                                  ↓ Star-map SVG
                                </a>
                              )}
                              {(item.product_slug === 'spotify-music-plaque' || item.product_slug === 'bluetooth-spotify-magnet') && (
                                <a
                                  href={`/api/admin/orders/${o.id}/items/${item.id}/spotify-plaque-svg`}
                                  className="inline-flex items-center gap-1 rounded-full border border-ink bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-ink hover:text-white"
                                  download
                                >
                                  ↓ Plaque SVG
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => completeItem(item.id)}
                          disabled={item.production_status === 'completed' || isPending}
                          className={`flex items-center gap-1 rounded border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                            item.production_status === 'completed'
                              ? 'border-green-200 bg-green-50 text-green-800'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-green-500 hover:text-green-700'
                          }`}
                        >
                          <Check size={12} />
                          {item.production_status === 'completed' ? 'Done' : 'Mark done'}
                        </button>
                      </div>
                    ))}

                    {o.notes && (
                      <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900">
                        <strong>Customer notes:</strong> {o.notes}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      {NEXT_STATUS[o.status] && (
                        <button
                          onClick={() => advanceStatus(o.id, o.status)}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50"
                        >
                          Mark as {NEXT_STATUS[o.status]} <ArrowRight size={12} />
                        </button>
                      )}
                      <a
                        href={`/api/admin/orders/${o.id}/packet`}
                        className="rounded-full border border-ink bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-ink hover:text-white"
                        title="Production packet PDF — order details + per-item config + customer photo"
                      >
                        ⤓ Print packet
                      </a>
                      <a
                        href={`https://wa.me/${o.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-green-500 bg-white px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-50"
                      >
                        💬 WhatsApp customer
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </>
  );
}
