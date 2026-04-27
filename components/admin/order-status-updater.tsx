'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus, deleteOrder } from '@/app/admin/orders/actions';
import { useRouter } from 'next/navigation';

const STATUSES = ['pending', 'processing', 'ready', 'shipped', 'completed', 'cancelled'];

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);

  // Inputs that show conditionally on shipped / cancelled.
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [refundCents, setRefundCents] = useState('');
  const [refundNote, setRefundNote] = useState('');

  const [pendingNewStatus, setPendingNewStatus] = useState<string | null>(null);

  function onSelect(newStatus: string) {
    setError(null);
    if (newStatus === 'shipped' || newStatus === 'cancelled') {
      // Don't apply yet — show the inline form first.
      setPendingNewStatus(newStatus);
      return;
    }
    apply(newStatus, {});
  }

  function apply(newStatus: string, extras: { tracking_number?: string; tracking_url?: string; refund_cents?: number; refund_note?: string }) {
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus, extras);
      if (!result.ok) {
        setError(result.error ?? 'Failed');
        setStatus(currentStatus);
      } else {
        setPendingNewStatus(null);
        router.refresh();
      }
    });
  }

  function confirmShipped() {
    if (!trackingNumber.trim()) { setError('Tracking number required'); return; }
    apply('shipped', { tracking_number: trackingNumber.trim(), tracking_url: trackingUrl.trim() || undefined });
  }

  function confirmCancelled() {
    const cents = Math.round(Number(refundCents) * 100);
    if (!Number.isFinite(cents) || cents < 0) { setError('Refund amount must be 0 or more'); return; }
    apply('cancelled', { refund_cents: cents, refund_note: refundNote.trim() || undefined });
  }

  function handleDelete() {
    if (!confirm('Delete this order permanently? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (result.ok) { router.push('/admin/orders'); router.refresh(); }
      else setError(result.error ?? 'Failed');
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <select
          value={pendingNewStatus ?? status}
          onChange={(e) => onSelect(e.target.value)}
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

      {pendingNewStatus === 'shipped' && (
        <div className="rounded border-2 border-neutral-200 bg-neutral-50 p-3 flex flex-col gap-2 max-w-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Mark as shipped</div>
          <input
            type="text" placeholder="Tracking number" value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <input
            type="url" placeholder="Tracking URL (optional)" value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <button onClick={confirmShipped} disabled={isPending} className="rounded bg-pink px-3 py-1 text-xs font-bold text-white">
              Send shipped email
            </button>
            <button onClick={() => setPendingNewStatus(null)} disabled={isPending} className="rounded border px-3 py-1 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {pendingNewStatus === 'cancelled' && (
        <div className="rounded border-2 border-neutral-200 bg-neutral-50 p-3 flex flex-col gap-2 max-w-md">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Cancel + refund</div>
          <input
            type="number" step="0.01" min="0" placeholder="Refund amount in SGD (e.g. 45.00)" value={refundCents}
            onChange={(e) => setRefundCents(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <textarea
            rows={2} placeholder="Refund note (optional)" value={refundNote}
            onChange={(e) => setRefundNote(e.target.value)}
            className="rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <button onClick={confirmCancelled} disabled={isPending} className="rounded bg-pink px-3 py-1 text-xs font-bold text-white">
              Cancel + send refund email
            </button>
            <button onClick={() => setPendingNewStatus(null)} disabled={isPending} className="rounded border px-3 py-1 text-xs">
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
