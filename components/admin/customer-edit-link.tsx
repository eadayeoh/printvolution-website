'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendCustomerEditLink, setCustomerEditLocked } from '@/app/admin/orders/actions';

type Props = {
  orderId: string;
  hasToken: boolean;
  locked: boolean;
  lastEditAt: string | null;
};

export function CustomerEditLink({ orderId, hasToken, locked, lastEditAt }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function send() {
    setErr(null); setOk(null);
    start(async () => {
      const r = await sendCustomerEditLink(orderId, note.trim() || null);
      if (!r.ok) { setErr(r.error); return; }
      setOk('Email sent. The customer can edit until you lock the order.');
      setOpen(false);
      setNote('');
      router.refresh();
    });
  }

  function toggleLock() {
    setErr(null); setOk(null);
    start(async () => {
      const r = await setCustomerEditLocked(orderId, !locked);
      if (!r.ok) { setErr(r.error); return; }
      setOk(locked ? 'Customer edits unlocked.' : 'Customer edits locked.');
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border-2 border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="font-bold text-ink">Customer edit link</h2>
        {hasToken && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            locked ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
          }`}>
            {locked ? 'Locked' : 'Open'}
          </span>
        )}
      </div>
      <p className="text-xs text-neutral-600 mb-3 leading-relaxed">
        Email the customer a tokenised link so they can review qty, delivery,
        notes — handy when you've drafted an order on their behalf.
      </p>
      {lastEditAt && (
        <p className="text-[11px] text-neutral-500 mb-3">
          Customer last edited {new Date(lastEditAt).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}
        </p>
      )}

      {!open ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={isPending || locked}
            className="rounded-full border-2 border-pink bg-white px-3 py-1.5 text-xs font-bold text-pink hover:bg-pink hover:text-white disabled:opacity-50"
          >
            {hasToken ? 'Re-send edit link' : 'Send edit link'}
          </button>
          {hasToken && (
            <button
              type="button"
              onClick={toggleLock}
              disabled={isPending}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-ink"
            >
              {locked ? 'Unlock customer edits' : 'Lock further edits'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Optional note in the email — e.g. 'I've drafted this from your phone call.'"
            className="w-full rounded border border-neutral-300 px-2 py-1.5 text-xs focus:border-pink focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={send}
              disabled={isPending}
              className="rounded-full bg-pink px-3 py-1.5 text-xs font-bold text-white"
            >
              {isPending ? 'Sending…' : 'Send email'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setNote(''); }}
              disabled={isPending}
              className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {err && <p className="mt-2 text-[11px] text-red-600">{err}</p>}
      {ok && <p className="mt-2 text-[11px] text-green-700">{ok}</p>}
    </div>
  );
}
