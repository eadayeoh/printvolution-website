'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { createGiftOccasion, deleteGiftOccasion, updateGiftOccasion } from '@/app/admin/gifts/actions';
import type { GiftOccasion } from '@/lib/gifts/types';
import { describeOccasionWindow, isOccasionInWindow } from '@/lib/gifts/occasion';

const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

export function GiftOccasionEditor({ occasion }: { occasion: GiftOccasion | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [name, setName] = useState(occasion?.name ?? '');
  const [badgeLabel, setBadgeLabel] = useState(occasion?.badge_label ?? '');
  const [targetDate, setTargetDate] = useState(occasion?.target_date ?? '');
  const [daysBefore, setDaysBefore] = useState(String(occasion?.days_before ?? 14));
  const [daysAfter, setDaysAfter]   = useState(String(occasion?.days_after  ?? 2));
  const [isActive, setIsActive] = useState(occasion?.is_active ?? true);

  // Live preview of the computed window so admin can sanity-check the
  // date math without saving.
  const previewWindow = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return null;
    const draft: GiftOccasion = {
      id: 'draft',
      name,
      badge_label: badgeLabel || null,
      target_date: targetDate,
      days_before: parseInt(daysBefore, 10) || 0,
      days_after:  parseInt(daysAfter,  10) || 0,
      is_active: isActive,
    };
    const { fromIso, untilIso } = describeOccasionWindow(draft);
    const inWindow = isOccasionInWindow(draft);
    return { fromIso, untilIso, inWindow };
  }, [targetDate, daysBefore, daysAfter, isActive, name, badgeLabel]);

  function save() {
    setErr(null);
    if (!name.trim()) { setErr('Name required'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) { setErr('Target date must be YYYY-MM-DD'); return; }
    const payload = {
      name: name.trim(),
      badge_label: badgeLabel.trim() || null,
      target_date: targetDate,
      days_before: parseInt(daysBefore, 10) || 0,
      days_after:  parseInt(daysAfter,  10) || 0,
      is_active: isActive,
    };
    startTransition(async () => {
      if (occasion) {
        const r = await updateGiftOccasion(occasion.id, payload);
        if (!r.ok) setErr(r.error);
        else { setFlash(true); setTimeout(() => setFlash(false), 1600); }
      } else {
        const r = await createGiftOccasion(payload);
        if (!r.ok) setErr(r.error);
        else router.push(`/admin/gifts/occasions/${r.id}`);
      }
    });
  }

  function remove() {
    if (!occasion) return;
    if (!confirm('Delete this occasion? Templates tagged with it will revert to "always show".')) return;
    startTransition(async () => {
      const r = await deleteGiftOccasion(occasion.id);
      if (!r.ok) setErr(r.error);
      else router.push('/admin/gifts/occasions');
    });
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/gifts/occasions" className="text-sm font-bold text-neutral-500 hover:text-ink">← Back to occasions</Link>
        <div className="text-sm font-bold text-ink">{occasion ? 'Edit occasion' : 'New occasion'}</div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">Name (admin)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Mother&rsquo;s Day 2026" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">Badge label (customer-facing)</span>
            <input value={badgeLabel} onChange={(e) => setBadgeLabel(e.target.value)} className={inputCls} placeholder="Mother&rsquo;s Day" />
            <span className="mt-1 block text-[11px] text-neutral-500">
              Shown on the template tile during the window. Falls back to <em>Name</em> if blank.
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">Target date (YYYY-MM-DD)</span>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Show this many days before</span>
              <input type="number" min={0} value={daysBefore} onChange={(e) => setDaysBefore(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">…and this many days after</span>
              <input type="number" min={0} value={daysAfter} onChange={(e) => setDaysAfter(e.target.value)} className={inputCls} />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-xs font-bold text-ink">Active</span>
            <span className="text-[11px] text-neutral-500">Pause without untagging templates by unticking this.</span>
          </label>
        </div>

        {previewWindow ? (
          <div className="rounded-lg border border-neutral-200 bg-cream/60 p-4 text-xs">
            <div className="mb-1 font-bold text-ink">Computed window</div>
            <div>
              Visible from <strong>{previewWindow.fromIso}</strong> to <strong>{previewWindow.untilIso}</strong>{' '}
              <span className={previewWindow.inWindow ? 'text-green-700' : 'text-neutral-500'}>
                {previewWindow.inWindow ? '✓ in window now' : '○ out of window'}
              </span>
            </div>
          </div>
        ) : null}

        {err ? <div className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{err}</div> : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-full bg-pink px-5 py-2 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-60"
          >
            {isPending ? 'Saving…' : occasion ? 'Save changes' : 'Create occasion'}
          </button>
          {flash ? <span className="text-xs text-green-700">Saved.</span> : null}
          {occasion ? (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:border-red-400"
            >
              <Trash2 size={12} /> Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
