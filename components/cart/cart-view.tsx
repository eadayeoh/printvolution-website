'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { formatSGD } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function CartView() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotalCents());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="text-sm text-neutral-500">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-neutral-200 p-12 text-center">
        <p className="mb-6 text-lg text-neutral-500">Your cart is empty.</p>
        <Link
          href="/shop"
          className="inline-flex items-center rounded-full bg-pink px-6 py-3 text-sm font-bold text-white hover:bg-pink-dark"
        >
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded bg-neutral-50 text-3xl">
                {item.icon ?? '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink">{item.product_name}</h3>
                  <button
                    onClick={() => remove(item.id)}
                    className="text-neutral-400 transition-colors hover:text-red-500"
                    aria-label="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {Object.keys(item.config).length > 0 && (
                  <div className="mb-2 text-xs text-neutral-500">
                    {Object.entries(item.config).map(([k, v]) => (
                      <span key={k} className="mr-3">
                        <span className="text-neutral-400">{k}:</span> <span className="font-semibold text-neutral-700">{v}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Qty {item.qty}</span>
                  <span className="text-sm font-black text-pink">{formatSGD(item.line_total_cents)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside>
        <div className="sticky top-20 rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
          <h3 className="mb-4 text-lg font-black text-ink">Summary</h3>
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-semibold text-ink">{formatSGD(subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <div className="mb-5 border-t-2 border-ink pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-neutral-600">Total</span>
              <span className="text-2xl font-black text-pink">{formatSGD(subtotal)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="block w-full rounded-full bg-pink py-3 text-center text-sm font-bold text-white transition-colors hover:bg-pink-dark"
          >
            Proceed to Checkout →
          </Link>
          <Link
            href="/shop"
            className="mt-2 block w-full rounded-full border-2 border-neutral-200 py-3 text-center text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}
