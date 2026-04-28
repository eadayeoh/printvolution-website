'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateGiftMode } from '@/app/admin/gifts/actions';
import type { GiftModeMeta } from '@/lib/gifts/modes';

export function GiftModeEditor({ mode }: { mode: GiftModeMeta }) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [label, setLabel] = useState(mode.label);
  const [description, setDescription] = useState(mode.description ?? '');
  const [icon, setIcon] = useState(mode.icon ?? '');
  const [displayOrder, setDisplayOrder] = useState(mode.display_order.toString());
  const [isActive, setIsActive] = useState(mode.is_active);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const inp = 'w-full rounded border-2 border-neutral-200 bg-white px-4 py-3 text-sm focus:border-pink focus:outline-none';

  function save() {
    setErr(null);
    if (!label.trim()) { setErr('Label required'); return; }
    start(async () => {
      const r = await updateGiftMode(mode.slug, {
        label: label.trim(),
        description: description.trim() || null,
        icon: icon.trim() || null,
        display_order: parseInt(displayOrder, 10) || 0,
        is_active: isActive,
      });
      if (!r.ok) { setErr(r.error); return; }
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
      router.refresh();
    });
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/admin/gifts/modes" className="text-sm text-neutral-500 hover:text-ink">← Back to modes</Link>
      </div>
      <h1 className="mb-1 text-2xl font-black">Edit {mode.label || 'mode'}</h1>

      <div className="max-w-2xl space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-ink">Label</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={inp} />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-ink">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inp} />
          <span className="mt-1 block text-[11px] text-neutral-500">
            Shown as the sub-copy on the mode tile in the product editor.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-ink">Display order</span>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className={inp}
          />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span className="text-sm">Active (tile shows on product editor when checked)</span>
        </label>

        {err && <div className="rounded border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">✗ {err}</div>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-full bg-pink px-4 py-2 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          {flash && <span className="text-sm font-bold text-green-700">✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}
