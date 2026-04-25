'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reorderPastOrder } from '@/app/(site)/account/actions';
import { useCart } from '@/lib/cart-store';

export function ReorderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const addToCart = useCart((s) => s.add);
  const [isPending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        start(async () => {
          const r = await reorderPastOrder(orderId);
          if (!r.ok) {
            alert(r.error);
            return;
          }
          if (r.items.length === 0) {
            alert(
              r.gift_count > 0
                ? `${orderNumber} only had gift items — those need a fresh photo upload via the gift page.`
                : 'Nothing to reorder — products no longer available.',
            );
            return;
          }
          for (const item of r.items) addToCart(item);
          if (r.gift_count > 0) {
            alert(`Print items added to cart. ${r.gift_count} gift item(s) skipped — re-create those from the gift page.`);
          }
          router.push('/cart');
        });
      }}
      style={{
        padding: '6px 12px',
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        color: '#fff',
        background: '#0a0a0a',
        border: 'none',
        borderRadius: 999,
        cursor: 'pointer',
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {isPending ? '…' : 'Reorder'}
    </button>
  );
}
