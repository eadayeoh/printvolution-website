'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, Download } from 'lucide-react';
import { formatSGD } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import type { OrderListItem } from '@/lib/data/admin';

type Props = {
  orders: OrderListItem[];
  initialStatus: string;
  initialSearch: string;
};

const STATUSES = ['all', 'pending', 'processing', 'ready', 'completed', 'cancelled'];

export function OrdersTable({ orders, initialStatus, initialSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  function applyFilters(nextStatus?: string, nextSearch?: string) {
    const params = new URLSearchParams(searchParams.toString());
    const s = nextStatus ?? params.get('status') ?? 'all';
    const q = nextSearch ?? params.get('q') ?? '';
    if (s && s !== 'all') params.set('status', s); else params.delete('status');
    if (q) params.set('q', q); else params.delete('q');
    startTransition(() => {
      router.push(`/admin/orders${params.toString() ? `?${params.toString()}` : ''}`);
    });
  }

  function exportCSV() {
    // Customer-supplied strings beginning with =, +, -, @, tab or CR can
    // execute as formulas in Excel/Numbers — prefix a single quote to
    // neutralise. Standard CSV-injection defence.
    const escapeCell = (raw: unknown) => {
      const s = String(raw ?? '');
      const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const headers = ['Order', 'Customer', 'Email', 'Phone', 'Delivery', 'Items', 'Subtotal', 'Total', 'Status', 'Date'];
    const rows = orders.map((o) => [
      o.order_number, o.customer_name, o.email, o.phone, o.delivery_method,
      String(o.item_count), (o.subtotal_cents / 100).toFixed(2),
      (o.total_cents / 100).toFixed(2), o.status,
      new Date(o.created_at).toLocaleString('en-SG'),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map(escapeCell).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters(undefined, search)}
            placeholder="Search order number, name, email..."
            className="w-full rounded border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-pink focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => applyFilters(s, search)}
              className={`rounded border px-3 py-1.5 text-xs font-bold transition-colors ${
                initialStatus === s
                  ? 'border-ink bg-ink text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-ink'
              }`}
            >
              {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="ml-auto flex items-center gap-2 rounded border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-ink"
        >
          <Download size={12} /> CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-500">
                  No orders match that filter.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-bold text-ink hover:text-pink">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{o.customer_name}</div>
                    <div className="text-[11px] text-neutral-500">{o.email}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs">{o.item_count}</td>
                  <td className="px-4 py-3 text-right font-bold text-pink">{formatSGD(o.total_cents)}</td>
                  <td className="px-4 py-3 text-xs capitalize text-neutral-600">{o.delivery_method}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(o.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isPending && (
        <div className="mt-3 text-center text-xs text-neutral-500">Loading...</div>
      )}
    </>
  );
}
