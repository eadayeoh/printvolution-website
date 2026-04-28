'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createGiftMode } from '@/app/admin/gifts/actions';

/**
 * Inline "+ New processing mode" form for /admin/gifts/modes.
 *
 * Slug becomes the database identifier (immutable). Label / description /
 * icon are editable later via the per-row edit page. Once added, the new
 * slug is immediately selectable from product / variant / template dropdowns
 * (those panels load `gift_modes` at server-render time).
 */
export function GiftModeCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [displayOrder, setDisplayOrder] = useState('99');

  function reset() {
    setLabel(''); setDescription(''); setIcon(''); setDisplayOrder('99');
    setErr(null);
  }

  function submit() {
    setErr(null);
    // Slug is derived from the label automatically — admins shouldn't have
    // to think about URL-safe identifiers when adding a new processing
    // mode. Server-side regex still validates the result, and the create
    // action returns a duplicate-slug error if two modes derive the same
    // slug (admin renames the label to disambiguate).
    const derivedSlug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    if (!derivedSlug) {
      setErr('Label must contain at least one letter or digit.');
      return;
    }
    startTransition(async () => {
      const r = await createGiftMode({
        slug: derivedSlug,
        label: label.trim(),
        description: description.trim() || null,
        icon: icon.trim() || null,
        display_order: parseInt(displayOrder, 10) || 99,
        is_active: true,
      });
      if (!r.ok) { setErr(r.error); return; }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-3 inline-flex items-center gap-1 rounded border-2 border-ink bg-yellow-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-white"
      >
        <Plus size={14} /> New processing mode
      </button>
    );
  }

  return (
    <div className="mb-4 rounded border-2 border-ink bg-white p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-wider">New processing mode</div>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block text-xs">
          <span className="mb-1 block font-bold uppercase tracking-wider">Label</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Foil Press"
            maxLength={60}
            className="w-full rounded border-2 border-ink px-2 py-1 text-sm"
          />
        </label>
        <label className="col-span-2 block text-xs">
          <span className="mb-1 block font-bold uppercase tracking-wider">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Metallic foil press onto card / paper. Spot foil only — no full-bleed."
            className="w-full rounded border-2 border-ink px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-bold uppercase tracking-wider">Icon</span>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="✦"
            maxLength={4}
            className="w-full rounded border-2 border-ink px-2 py-1 text-center text-base"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-bold uppercase tracking-wider">Display order</span>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className="w-full rounded border-2 border-ink px-2 py-1 font-mono text-xs"
          />
        </label>
      </div>
      {err && <div className="mt-3 text-xs text-red-600">{err}</div>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !label.trim()}
          className="rounded bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add mode'}
        </button>
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          disabled={pending}
          className="rounded border-2 border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
