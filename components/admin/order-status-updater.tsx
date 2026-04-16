'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus, deleteOrder } from '@/app/admin/orders/actions';
import { useRouter } from 'next/navigation';

const STATUSES = ['pending', 'processing', 'ready', 'completed', 'cancelled'];

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);

  function handleChange(newStatus: string) {
    setStatus(newStatus);
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (!result.ok) {
        setError(result.error ?? 'Failed');
        setStatus(currentStatus);
      }
    });
  }

  function handleDelete() {
    if (!confirm('Delete this order permanently? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (result.ok) {
        router.push('/admin/orders');
        router.refresh();
      } else {
        setError(result.error ?? 'Failed');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="rounded border-2 border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold focus:border-pink focus:outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="rounded border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
      >
        Delete
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
