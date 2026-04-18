'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateMemberAdminNotes } from '@/app/admin/members/actions';

export function AdminNotesEditor({ profileId, initial }: { profileId: string; initial: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = notes !== initial;

  function save() {
    setErr(null);
    setSaved(false);
    startTransition(async () => {
      const r = await updateMemberAdminNotes(profileId, notes);
      if (!r.ok) { setErr(r.error); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const charsLeft = 2000 - notes.length;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
      <p className="mb-2 text-[11px] text-amber-900">
        Internal-only. Not visible to the customer. Use this for fit notes, reconciliation reminders,
        VIP flags, special delivery instructions, etc.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
        rows={5}
        className="w-full rounded border-2 border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        placeholder="e.g. Prefers matte finish. Always orders in bulk around Deepavali."
      />
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="text-[10px] text-amber-900">
          {charsLeft.toLocaleString()} char{charsLeft === 1 ? '' : 's'} remaining
        </div>
        <div className="flex items-center gap-3">
          {err && <span className="text-[11px] font-bold text-red-700">✗ {err}</span>}
          {saved && <span className="text-[11px] font-bold text-green-700">✓ Saved</span>}
          <button
            type="button"
            onClick={save}
            disabled={isPending || !dirty}
            className="rounded-full bg-ink px-5 py-2 text-xs font-bold text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
