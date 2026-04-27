'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';
import { ImageUpload } from '@/components/admin/image-upload';
import { upsertGiftVariant, deleteGiftVariant } from '@/app/admin/gifts/actions';
import type { GiftProductVariant, GiftVariantColourSwatch, GiftVariantSurface, GiftInputMode, GiftMode } from '@/lib/gifts/types';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';
import type { ShapeKind, ShapeOption } from '@/lib/gifts/shape-options';

const ALL_GIFT_MODES: GiftMode[] = ['laser', 'uv', 'embroidery', 'photo-resize', 'eco-solvent', 'digital', 'uv-dtf'];

type Draft = {
  id?: string;
  slug: string;
  name: string;
  features_text: string; // textarea (newline-separated)
  mockup_url: string;
  mockup_area: { x: number; y: number; width: number; height: number };
  mockup_bounds: { x: number; y: number; width: number; height: number };
  variant_thumbnail_url: string;
  base_price: string; // dollars
  display_order: string;
  is_active: boolean;
  // Optional colour choices nested under this variant tile (e.g. one
  // "T-shirt" tile with red / navy / black swatches).
  colour_swatches: GiftVariantColourSwatch[];
  // Multi-face config. Empty = single-surface fallback using the
  // variant row's own mockup_url + mockup_area.
  surfaces: GiftVariantSurface[];
  // Per-shape mockup overrides (migration 0058). Keyed by shape kind.
  // Missing key = fall back to the variant's base `mockup_url` +
  // `mockup_area`. Only shown in the editor when the parent product has
  // `shape_options` active.
  mockup_by_shape: Partial<Record<ShapeKind, { url: string; area: { x: number; y: number; width: number; height: number } }>>;
  // Migration 0059 — pan-photo mode (fixed mockup_area; customer pans).
  photo_pan_mode: boolean;
  // Migration 0061 — per-prompt mockup keyed by prompt UUID.
  mockup_by_prompt_id: Record<string, { url: string; area: { x: number; y: number; width: number; height: number } }>;
};

function toDraft(v?: GiftProductVariant): Draft {
  const area = (v?.mockup_area as any) ?? { x: 20, y: 20, width: 60, height: 60 };
  return {
    id: v?.id,
    slug: v?.slug ?? '',
    name: v?.name ?? '',
    features_text: (v?.features ?? []).join('\n'),
    mockup_url: v?.mockup_url ?? '',
    mockup_area: area,
    mockup_bounds: (v?.mockup_bounds as any) ?? {
      x: Math.max(0, area.x - 5),
      y: Math.max(0, area.y - 5),
      width: Math.min(100, area.width + 10),
      height: Math.min(100, area.height + 10),
    },
    variant_thumbnail_url: v?.variant_thumbnail_url ?? '',
    base_price: ((v?.base_price_cents ?? 0) / 100).toFixed(2),
    display_order: String(v?.display_order ?? 0),
    is_active: v?.is_active ?? true,
    colour_swatches: (v?.colour_swatches ?? []).map((s) => ({ ...s })),
    surfaces: (v?.surfaces ?? []).map((s) => ({ ...s, mockup_area: { ...s.mockup_area } })),
    photo_pan_mode: v?.photo_pan_mode ?? true,
    mockup_by_shape: v?.mockup_by_shape
      ? Object.fromEntries(
          Object.entries(v.mockup_by_shape).map(([k, entry]) => [
            k,
            entry ? { url: entry.url, area: { ...entry.area } } : entry,
          ]),
        ) as Draft['mockup_by_shape']
      : {},
    mockup_by_prompt_id: v?.mockup_by_prompt_id
      ? Object.fromEntries(
          Object.entries(v.mockup_by_prompt_id).map(([k, entry]) => [
            k,
            { url: entry.url, area: { ...entry.area } },
          ]),
        )
      : {},
  };
}

// Mockup areas are stored as percentages of the mockup image (0–100),
// but editors are easier to reason about in millimetres. We convert
// in/out using the variant's own width_mm/height_mm (falling back to
// the product's when the variant hasn't overridden them). This assumes
// the mockup image represents the product surface.
const pctToMm = (pct: number, dimMm: number) => (dimMm > 0 ? +((pct / 100) * dimMm).toFixed(1) : 0);
const mmToPct = (mm: number, dimMm: number) => (dimMm > 0 ? +((mm / dimMm) * 100).toFixed(3) : 0);

export type GiftVariantsPanelHandle = {
  /** Save every dirty draft sequentially. Returns true if all rows
   *  succeed; false (plus `err` state visible in the panel) otherwise. */
  saveAll: () => Promise<boolean>;
};

type GiftVariantsPanelProps = {
  giftProductId: string;
  initialVariants: GiftProductVariant[];
  /** When set, the per-surface Mode dropdown only lets admin pick from
   *  these (parent product's {mode, secondary_mode}). When undefined or
   *  empty, every mode is available (back-compat). */
  allowedModes?: GiftMode[];
  /** Parent product dimensions used as the mockup canvas when a variant
   *  doesn't override width_mm/height_mm. */
  productWidthMm: number;
  productHeightMm: number;
  /** Parent product's shape_options. When present, each variant row
   *  grows an extra block to upload a per-shape mockup + area so
   *  cutout / rectangle / template each render on the correct base
   *  visual. */
  parentShapeOptions?: ShapeOption[] | null;
  /** Active prompts available on the parent product. Drives a second
   *  per-variant mockup block — one slot per prompt — so the live
   *  preview can swap the mockup when the customer picks an art style. */
  parentPrompts?: Array<{ id: string; name: string; mode: string }>;
};

export const GiftVariantsPanel = forwardRef<GiftVariantsPanelHandle, GiftVariantsPanelProps>(function GiftVariantsPanel({
  giftProductId,
  initialVariants,
  allowedModes,
  productWidthMm,
  productHeightMm,
  parentShapeOptions,
  parentPrompts,
}, ref) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>(initialVariants.map(toDraft));
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  function updateDraft(i: number, patch: Partial<Draft>) {
    setDrafts((list) => list.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  }

  function addRow() {
    setDrafts((list) => [...list, toDraft()]);
  }

  function removeRow(i: number) {
    const d = drafts[i];
    if (d.id && !confirm('Delete this variant? Orders placed with it stay intact.')) return;
    startTransition(async () => {
      setErr(null);
      if (d.id) {
        const r = await deleteGiftVariant(d.id);
        if (!r.ok) { setErr(r.error); return; }
      }
      setDrafts((list) => list.filter((_, idx) => idx !== i));
      router.refresh();
    });
  }

  // Core save — awaitable, returns whether it succeeded. saveAll
  // (exposed via forwardRef) iterates and awaits each draft so the
  // main product save button persists every variant in one go.
  async function saveDraft(i: number): Promise<boolean> {
    const d = drafts[i];
    if (!d.name.trim() || !d.slug.trim()) {
      setErr(`Variant #${i + 1}: name and slug are required`);
      return false;
    }
    if (!d.mockup_url) {
      setErr(`Variant "${d.name}": needs a mockup image`);
      return false;
    }
    const slugClash = drafts.find((other, j) => j !== i && other.slug.trim() === d.slug.trim());
    if (slugClash) {
      setErr(`A variant with slug "${d.slug.trim()}" already exists${slugClash.name ? ` (“${slugClash.name}”)` : ''}.`);
      return false;
    }
    for (const [si, s] of d.colour_swatches.entries()) {
      if (!s.name.trim()) { setErr(`Colour swatch #${si + 1} needs a name.`); return false; }
      if (!/^#[0-9A-Fa-f]{6}$/.test(s.hex)) { setErr(`Colour swatch #${si + 1} hex must be #RRGGBB.`); return false; }
      if (!s.mockup_url) { setErr(`Colour swatch #${si + 1} needs a mockup image.`); return false; }
    }
    for (const [si, s] of d.surfaces.entries()) {
      if (!s.id.trim() || !/^[a-z0-9-]+$/.test(s.id)) { setErr(`Surface #${si + 1} id must be lowercase-slug.`); return false; }
      if (!s.label.trim()) { setErr(`Surface #${si + 1} needs a label.`); return false; }
    }
    const payload = {
      id: d.id,
      gift_product_id: giftProductId,
      slug: d.slug.trim(),
      name: d.name.trim(),
      features: d.features_text.split('\n').map((s) => s.trim()).filter(Boolean),
      mockup_url: d.mockup_url,
      mockup_area: d.mockup_area,
      mockup_bounds: d.mockup_bounds,
      variant_thumbnail_url: d.variant_thumbnail_url || d.mockup_url || null,
      base_price_cents: Math.round((parseFloat(d.base_price) || 0) * 100),
      display_order: parseInt(d.display_order, 10) || 0,
      is_active: d.is_active,
      variant_kind: 'base' as const,
      width_mm: null,
      height_mm: null,
      colour_swatches: d.colour_swatches.map((s) => ({ name: s.name.trim(), hex: s.hex, mockup_url: s.mockup_url })),
      surfaces: d.surfaces.map((s) => ({
        id: s.id.trim(), label: s.label.trim(), accepts: s.accepts, mockup_url: s.mockup_url,
        mockup_area: s.mockup_area, max_chars: s.max_chars ?? null,
        font_family: s.font_family ?? null, font_size_pct: s.font_size_pct ?? null,
        color: s.color ?? null, mode: s.mode ?? null,
        price_delta_cents: s.price_delta_cents ?? 0,
      })),
      photo_pan_mode: d.photo_pan_mode,
      mockup_by_shape: (() => {
        // Strip empty entries so we don't bloat the DB with
        // {kind: {url: '', area: {...}}} noise. Missing key on the
        // customer side falls back to the base mockup.
        const cleaned: Partial<Record<ShapeKind, { url: string; area: { x: number; y: number; width: number; height: number } }>> = {};
        for (const [kind, entry] of Object.entries(d.mockup_by_shape)) {
          if (entry && typeof entry.url === 'string' && entry.url.trim()) {
            cleaned[kind as ShapeKind] = { url: entry.url.trim(), area: entry.area };
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : null;
      })(),
      mockup_by_prompt_id: (() => {
        const cleaned: Record<string, { url: string; area: { x: number; y: number; width: number; height: number } }> = {};
        for (const [promptId, entry] of Object.entries(d.mockup_by_prompt_id)) {
          if (entry && typeof entry.url === 'string' && entry.url.trim()) {
            cleaned[promptId] = { url: entry.url.trim(), area: entry.area };
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : null;
      })(),
    };
    // `mockup_by_shape` is a Partial<Record<>>; z.record(enum, obj)
    // widens values to required. Cast at the call site — the server
    // validator accepts missing keys just fine.
    const r = await upsertGiftVariant(payload as any);
    if (!r.ok) {
      const msg = r.error.includes('gift_product_id_slug_key')
        ? `A variant with slug "${d.slug.trim()}" already exists.`
        : r.error;
      setErr(msg);
      return false;
    }
    if (d.id) {
      setFlashId(d.id);
      setTimeout(() => setFlashId(null), 1600);
    }
    return true;
  }

  useImperativeHandle(ref, () => ({
    async saveAll() {
      setErr(null);
      let ok = true;
      let createdAny = false;
      for (let i = 0; i < drafts.length; i++) {
        const wasNew = !drafts[i].id;
        const success = await saveDraft(i);
        if (!success) { ok = false; break; }
        if (wasNew) createdAny = true;
      }
      if (createdAny) router.refresh();
      return ok;
    },
  }), [drafts]);


  function addSwatch(i: number) {
    setDrafts((list) =>
      list.map((d, idx) =>
        idx === i
          ? { ...d, colour_swatches: [...d.colour_swatches, { name: '', hex: '#000000', mockup_url: '' }] }
          : d,
      ),
    );
  }
  function updateSwatch(variantI: number, swatchI: number, patch: Partial<GiftVariantColourSwatch>) {
    setDrafts((list) =>
      list.map((d, idx) =>
        idx === variantI
          ? {
              ...d,
              colour_swatches: d.colour_swatches.map((s, j) =>
                j === swatchI ? { ...s, ...patch } : s,
              ),
            }
          : d,
      ),
    );
  }
  function removeSwatch(variantI: number, swatchI: number) {
    setDrafts((list) =>
      list.map((d, idx) =>
        idx === variantI
          ? { ...d, colour_swatches: d.colour_swatches.filter((_, j) => j !== swatchI) }
          : d,
      ),
    );
  }

  function addSurface(i: number) {
    setDrafts((list) =>
      list.map((d, idx) =>
        idx === i
          ? {
              ...d,
              surfaces: [
                ...d.surfaces,
                {
                  id: `side-${d.surfaces.length + 1}`,
                  label: `Side ${d.surfaces.length + 1}`,
                  accepts: 'text',
                  mockup_url: '',
                  mockup_area: { x: 20, y: 20, width: 60, height: 60 },
                  max_chars: 15,
                } as GiftVariantSurface,
              ],
            }
          : d,
      ),
    );
  }
  function updateSurface(variantI: number, surfI: number, patch: Partial<GiftVariantSurface>) {
    setDrafts((list) =>
      list.map((d, idx) =>
        idx === variantI
          ? { ...d, surfaces: d.surfaces.map((s, j) => (j === surfI ? { ...s, ...patch } : s)) }
          : d,
      ),
    );
  }
  function removeSurface(variantI: number, surfI: number) {
    setDrafts((list) =>
      list.map((d, idx) =>
        idx === variantI
          ? { ...d, surfaces: d.surfaces.filter((_, j) => j !== surfI) }
          : d,
      ),
    );
  }

  function autoSlug(i: number) {
    const d = drafts[i];
    if (d.slug) return;
    const s = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    if (s) updateDraft(i, { slug: s });
  }

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (err && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [err]);

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

  return (
    <div ref={panelRef} className="space-y-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        {err && (
          <div className="mb-4 rounded-md border-2 border-red-300 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <span className="text-base font-black text-red-700">⚠</span>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-red-700">Variants couldn&apos;t save</div>
                <div className="mt-1 text-sm font-medium text-red-900">{err}</div>
              </div>
            </div>
          </div>
        )}
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-ink">Variants</div>
            <div className="text-[11px] text-neutral-500">
              Each variant is a mockup tile (e.g. Wood Rectangle, Black Base, Wood Circle). Sizes are set at the product level under the Sizes section below and apply to every variant.
            </div>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-xs font-bold text-white hover:bg-pink-dark"
          >
            <Plus size={14} /> Add variant
          </button>
        </div>

        {drafts.length === 0 ? (
          <div className="rounded border border-dashed border-neutral-300 p-6 text-center text-xs text-neutral-500">
            No variants — the parent product&apos;s mockup and price apply.
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((d, i) => (
              <div key={d.id ?? `new-${i}`} className="rounded-lg border-2 border-neutral-200 p-4">
                <div className="mb-3 flex items-center justify-between text-[11px] font-bold text-neutral-500">
                  <span>{d.id ? `Variant #${i + 1}` : 'New variant (unsaved)'}</span>
                  {flashId === d.id && <span className="text-green-600">✓ Saved</span>}
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[2fr_1fr] gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-ink">Name</span>
                        <input
                          value={d.name}
                          onBlur={() => autoSlug(i)}
                          onChange={(e) => updateDraft(i, { name: e.target.value })}
                          className={inputCls}
                          placeholder="Oak Round"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-ink">Slug</span>
                        <input
                          value={d.slug}
                          onChange={(e) => updateDraft(i, { slug: e.target.value })}
                          className={`${inputCls} font-mono text-xs`}
                          placeholder="oak-round"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold text-ink">Features (one per line)</span>
                      <textarea
                        value={d.features_text}
                        onChange={(e) => updateDraft(i, { features_text: e.target.value })}
                        rows={4}
                        className={`${inputCls} font-mono text-xs`}
                        placeholder={'Solid oak\nWarm white LED\nUSB-C powered'}
                      />
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-ink">Price (S$)</span>
                        <input
                          type="number" step="0.01" value={d.base_price}
                          onChange={(e) => updateDraft(i, { base_price: e.target.value })}
                          className={inputCls}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-ink">Order</span>
                        <input
                          type="number" value={d.display_order}
                          onChange={(e) => updateDraft(i, { display_order: e.target.value })}
                          className={inputCls}
                        />
                      </label>
                      <label className="flex items-end gap-2 pb-2 text-xs">
                        <input type="checkbox" checked={d.is_active}
                          onChange={(e) => updateDraft(i, { is_active: e.target.checked })} />
                        <span>Active</span>
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-xs pt-2">
                      <input
                        type="checkbox"
                        checked={d.photo_pan_mode}
                        onChange={(e) => updateDraft(i, { photo_pan_mode: e.target.checked })}
                      />
                      <span>
                        <b>Customer pans photo inside fixed area</b> <span className="text-[10px] text-pink">(default)</span>
                        <span className="block text-[10px] text-neutral-500">
                          ON: area is locked, customer drags the photo within it (right for
                          frames, magnets, mugs — most gift products). OFF: legacy free-
                          placement where the customer moves + resizes the rectangle on the
                          mockup (only useful when placement itself is part of the design).
                        </span>
                      </span>
                    </label>
                    {d.mockup_url ? (
                      <div>
                        <div className="mb-2 text-[11px] font-bold text-neutral-500">
                          Mockup area — drag to move, drag the pink corner to resize
                        </div>
                        <DraggableArea
                          mockupUrl={d.mockup_url}
                          area={d.mockup_area}
                          productWidthMm={productWidthMm}
                          productHeightMm={productHeightMm}
                          onChange={(next) => updateDraft(i, { mockup_area: next })}
                        />
                      </div>
                    ) : (
                      <div className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-3 text-[11px] text-neutral-500">
                        Upload a mockup image first to position the design area.
                      </div>
                    )}
                    <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-ink">Surfaces (optional)</div>
                          <div className="text-[10px] text-neutral-500">
                            Multi-face config — e.g. a 3D bar keychain's 4 sides, or the front + back of a pendant. Leave empty to use this variant's own mockup + area as a single surface. When set, customers get one input per surface.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addSurface(i)}
                          className="rounded-full border border-pink bg-white px-3 py-1 text-[11px] font-bold text-pink hover:bg-pink hover:text-white"
                        >
                          + Surface
                        </button>
                      </div>
                      {d.surfaces.length > 0 && (
                        <div className="space-y-2">
                          {d.surfaces.map((s, sIdx) => (
                            <div key={sIdx} className="rounded border border-neutral-200 bg-white p-2">
                              <div className="grid grid-cols-[70px_1fr_90px_70px_90px_auto] gap-2">
                                <label className="block">
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Id</span>
                                  <input
                                    value={s.id}
                                    onChange={(e) => updateSurface(i, sIdx, { id: e.target.value })}
                                    className={`${inputCls} font-mono text-[11px]`}
                                    placeholder="front"
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Label</span>
                                  <input
                                    value={s.label}
                                    onChange={(e) => updateSurface(i, sIdx, { label: e.target.value })}
                                    className={inputCls}
                                    placeholder="Front"
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Accepts</span>
                                  <select
                                    value={s.accepts}
                                    onChange={(e) => updateSurface(i, sIdx, { accepts: e.target.value as GiftInputMode })}
                                    className={inputCls}
                                  >
                                    <option value="text">Text</option>
                                    <option value="photo">Photo</option>
                                    <option value="both">Both</option>
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Max chars</span>
                                  <input
                                    type="number"
                                    value={s.max_chars ?? ''}
                                    onChange={(e) => updateSurface(i, sIdx, { max_chars: e.target.value ? Number(e.target.value) : null })}
                                    className={inputCls}
                                    placeholder="15"
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Price delta (S$)</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={((s.price_delta_cents ?? 0) / 100).toFixed(2)}
                                    onChange={(e) => {
                                      const cents = Math.max(0, Math.round((parseFloat(e.target.value) || 0) * 100));
                                      updateSurface(i, sIdx, { price_delta_cents: cents });
                                    }}
                                    className={inputCls}
                                    placeholder="0.00"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeSurface(i, sIdx)}
                                  className="mt-5 rounded-full border border-red-200 p-1 text-red-600 hover:bg-red-50 self-start"
                                  title="Remove surface"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div className="mt-2 space-y-2">
                                <div>
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
                                    Mockup (optional)
                                  </span>
                                  <ImageUpload
                                    value={s.mockup_url}
                                    onChange={(url) => updateSurface(i, sIdx, { mockup_url: url })}
                                    prefix={`surface-${d.slug || 'x'}-${s.id || sIdx}`}
                                    aspect={1}
                                    size="sm"
                                    label="Mockup"
                                  />
                                  <div className="mt-1 text-[10px] text-neutral-500">
                                    Leave blank to fall back to the variant&apos;s main mockup above.
                                  </div>
                                </div>
                                <div>
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
                                    Surface area on mockup (mm)
                                  </span>
                                  {(() => {
                                    const wMm = productWidthMm;
                                    const hMm = productHeightMm;
                                    const dimFor = (k: 'x' | 'y' | 'width' | 'height') => (k === 'x' || k === 'width' ? wMm : hMm);
                                    return (
                                      <div className="grid grid-cols-4 gap-1 text-[11px]">
                                        {(['x', 'y', 'width', 'height'] as const).map((k) => (
                                          <label key={k} className="block">
                                            <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-400">{k} (mm)</span>
                                            <input
                                              type="number"
                                              step="0.1"
                                              value={pctToMm(s.mockup_area[k], dimFor(k))}
                                              onChange={(e) => updateSurface(i, sIdx, { mockup_area: { ...s.mockup_area, [k]: mmToPct(parseFloat(e.target.value) || 0, dimFor(k)) } })}
                                              className={inputCls}
                                            />
                                          </label>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="mt-2">
                                <label className="block">
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
                                    Production method (overrides parent product&apos;s mode)
                                  </span>
                                  <select
                                    value={s.mode ?? ''}
                                    onChange={(e) => updateSurface(i, sIdx, { mode: (e.target.value || null) as GiftMode | null })}
                                    className={inputCls}
                                  >
                                    <option value="">Inherit parent</option>
                                    {(allowedModes && allowedModes.length > 0 ? allowedModes : ALL_GIFT_MODES).map((m) => (
                                      <option key={m} value={m}>{GIFT_MODE_LABEL[m]}</option>
                                    ))}
                                  </select>
                                </label>
                                <div className="mt-1 text-[10px] text-neutral-500">
                                  Use this when one face of the same variant uses a different process — e.g. UV-printed front + laser-engraved back on the same acrylic piece.
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-ink">Colour swatches (optional)</div>
                          <div className="text-[10px] text-neutral-500">
                            Add colour choices inside this tile — e.g. one T-shirt tile with red / navy / black dots. Customer picks a swatch to swap the displayed mockup. Leave empty for no colour choice.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addSwatch(i)}
                          className="rounded-full border border-pink bg-white px-3 py-1 text-[11px] font-bold text-pink hover:bg-pink hover:text-white"
                        >
                          + Swatch
                        </button>
                      </div>
                      {d.colour_swatches.length > 0 && (
                        <div className="space-y-2">
                          {d.colour_swatches.map((s, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-2 rounded border border-neutral-200 bg-white p-2">
                              <div className="flex items-center gap-1 pt-1">
                                <span
                                  aria-hidden
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: /^#[0-9A-Fa-f]{6}$/.test(s.hex) ? s.hex : '#ccc',
                                    border: '2px solid #0a0a0a',
                                  }}
                                />
                              </div>
                              <div className="grid flex-1 grid-cols-[1fr_120px] gap-2">
                                <label className="block">
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Name</span>
                                  <input
                                    value={s.name}
                                    onChange={(e) => updateSwatch(i, sIdx, { name: e.target.value })}
                                    className={inputCls}
                                    placeholder="Red"
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Hex</span>
                                  <input
                                    value={s.hex}
                                    onChange={(e) => updateSwatch(i, sIdx, { hex: e.target.value })}
                                    className={`${inputCls} font-mono text-xs`}
                                    placeholder="#C62828"
                                  />
                                </label>
                              </div>
                              <div className="w-[120px]">
                                <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Mockup</span>
                                <ImageUpload
                                  value={s.mockup_url}
                                  onChange={(url) => updateSwatch(i, sIdx, { mockup_url: url })}
                                  prefix={`swatch-${d.slug || 'x'}-${sIdx}`}
                                  aspect={1}
                                  size="sm"
                                  label="Mockup"
                                />
                                {!s.mockup_url && (
                                  <div className="mt-1 text-[11px] text-amber-700">⚠ Mockup image required — upload above to save this swatch.</div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSwatch(i, sIdx)}
                                className="mt-5 rounded-full border border-red-200 p-1 text-red-600 hover:bg-red-50"
                                title="Remove swatch"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="mb-1 block text-xs font-bold text-ink">Mockup image</span>
                      <ImageUpload
                        value={d.mockup_url}
                        onChange={(url) => updateDraft(i, { mockup_url: url })}
                        prefix={`variant-${d.slug || 'mockup'}`}
                        aspect={1}
                        size="md"
                        label="Mockup"
                      />
                    </div>
                    {/* Variant thumbnail used to be a separate upload
                        field. Admin now gets it for free — the mockup
                        image doubles as the thumbnail (copy happens on
                        save). Keeping the column in the DB means old
                        rows still work without a migration. */}
                    {parentShapeOptions && parentShapeOptions.length > 0 && (
                      <div className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-3">
                        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                          Per-shape mockups (optional)
                        </div>
                        <p className="mb-2 text-[10px] text-neutral-500">
                          Override the base mockup for specific shapes. Useful when the customer picks Cutout and the
                          rectangular-panel mockup above stops looking right. Leave blank to fall back to the base mockup.
                        </p>
                        <div className="space-y-2">
                          {parentShapeOptions.map((opt) => {
                            const entry = d.mockup_by_shape[opt.kind];
                            const currentUrl = entry?.url ?? '';
                            const currentArea = entry?.area ?? d.mockup_area;
                            return (
                              <div key={opt.kind} className="rounded border border-neutral-200 bg-white p-2">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-ink">
                                    {opt.kind} · {opt.label}
                                  </span>
                                  {currentUrl && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = { ...d.mockup_by_shape };
                                        delete next[opt.kind];
                                        updateDraft(i, { mockup_by_shape: next });
                                      }}
                                      className="text-[10px] font-bold text-red-600 hover:underline"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                                <ImageUpload
                                  value={currentUrl}
                                  onChange={(url) => {
                                    const next = { ...d.mockup_by_shape };
                                    if (url) {
                                      next[opt.kind] = { url, area: currentArea };
                                    } else {
                                      delete next[opt.kind];
                                    }
                                    updateDraft(i, { mockup_by_shape: next });
                                  }}
                                  prefix={`variant-${d.slug || 'mockup'}-${opt.kind}`}
                                  aspect={1}
                                  size="sm"
                                  label={`${opt.kind} mockup`}
                                />
                                {currentUrl && (
                                  <div className="mt-1 grid grid-cols-4 gap-1 text-[10px]">
                                    {(['x', 'y', 'width', 'height'] as const).map((field) => (
                                      <label key={field} className="block">
                                        <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">
                                          {field}%
                                        </span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          step={0.1}
                                          value={currentArea[field]}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value || '0');
                                            const nextArea = { ...currentArea, [field]: Number.isFinite(val) ? val : 0 };
                                            const next = { ...d.mockup_by_shape };
                                            next[opt.kind] = { url: currentUrl, area: nextArea };
                                            updateDraft(i, { mockup_by_shape: next });
                                          }}
                                          className="w-full rounded border border-neutral-200 bg-white px-1 py-0.5 text-[10px]"
                                        />
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {parentPrompts && parentPrompts.length > 0 && (
                      <div className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-3">
                        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                          Per-prompt mockups (optional)
                        </div>
                        <p className="mb-2 text-[10px] text-neutral-500">
                          Swap the live-preview mockup when the customer picks a specific art-style
                          prompt. Useful when Line Art (laser) and UV Print render on different
                          frames. Leave blank to fall back to the base mockup above.
                        </p>
                        <div className="space-y-2">
                          {parentPrompts.map((pr) => {
                            const entry = d.mockup_by_prompt_id[pr.id];
                            const currentUrl = entry?.url ?? '';
                            const currentArea = entry?.area ?? d.mockup_area;
                            return (
                              <div key={pr.id} className="rounded border border-neutral-200 bg-white p-2">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-ink">
                                    {pr.name} · {pr.mode}
                                  </span>
                                  {currentUrl && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = { ...d.mockup_by_prompt_id };
                                        delete next[pr.id];
                                        updateDraft(i, { mockup_by_prompt_id: next });
                                      }}
                                      className="text-[10px] font-bold text-red-600 hover:underline"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                                <ImageUpload
                                  value={currentUrl}
                                  onChange={(url) => {
                                    const next = { ...d.mockup_by_prompt_id };
                                    if (url) {
                                      next[pr.id] = { url, area: currentArea };
                                    } else {
                                      delete next[pr.id];
                                    }
                                    updateDraft(i, { mockup_by_prompt_id: next });
                                  }}
                                  prefix={`variant-${d.slug || 'mockup'}-prompt-${pr.id.slice(0, 8)}`}
                                  aspect={1}
                                  size="sm"
                                  label={`${pr.name} mockup`}
                                />
                                {currentUrl && (
                                  <div className="mt-1 grid grid-cols-4 gap-1 text-[10px]">
                                    {(['x', 'y', 'width', 'height'] as const).map((field) => (
                                      <label key={field} className="block">
                                        <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-500">
                                          {field}%
                                        </span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          step={0.1}
                                          value={currentArea[field]}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value || '0');
                                            const nextArea = { ...currentArea, [field]: Number.isFinite(val) ? val : 0 };
                                            const next = { ...d.mockup_by_prompt_id };
                                            next[pr.id] = { url: currentUrl, area: nextArea };
                                            updateDraft(i, { mockup_by_prompt_id: next });
                                          }}
                                          className="w-full rounded border border-neutral-200 bg-white px-1 py-0.5 text-[10px]"
                                        />
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> {d.id ? 'Delete' : 'Discard'}
                  </button>
                  {d.id && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Saved automatically when you click the main Save button
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {err && <div className="mt-3 text-xs font-bold text-red-600">{err}</div>}
      </div>
    </div>
  );
});

type Rect = { x: number; y: number; width: number; height: number };

export function DraggableArea({
  mockupUrl,
  area,
  productWidthMm,
  productHeightMm,
  onChange,
}: {
  mockupUrl: string;
  area: Rect;
  productWidthMm: number;
  productHeightMm: number;
  onChange: (next: Rect) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<
    | { mode: 'move' | 'resize'; startX: number; startY: number; startArea: Rect }
    | null
  >(null);

  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const normalise = (r: Rect): Rect => {
    const width = Math.max(2, Math.min(100, r.width));
    const height = Math.max(2, Math.min(100, r.height));
    const x = Math.max(0, Math.min(100 - width, r.x));
    const y = Math.max(0, Math.min(100 - height, r.y));
    return { x, y, width, height };
  };

  useEffect(() => {
    if (!drag) return;
    function pctDelta(clientX: number, clientY: number) {
      const stage = stageRef.current;
      if (!stage) return { dxPct: 0, dyPct: 0 };
      const r = stage.getBoundingClientRect();
      return {
        dxPct: ((clientX - drag!.startX) / r.width) * 100,
        dyPct: ((clientY - drag!.startY) / r.height) * 100,
      };
    }
    // Lock the resize to the print's aspect ratio. width%/height% on
    // the (square) stage map to the printed shape — so a 10×15 cm
    // portrait product gets a 2:3 area, no matter how the customer
    // drags. Pick the dominant motion axis (whichever delta is bigger)
    // and derive the other to preserve ratio.
    const aspectRatio =
      productWidthMm > 0 && productHeightMm > 0
        ? productWidthMm / productHeightMm
        : 1;
    function onMove(e: PointerEvent) {
      const { dxPct, dyPct } = pctDelta(e.clientX, e.clientY);
      if (drag!.mode === 'move') {
        onChange(normalise({
          x: drag!.startArea.x + dxPct,
          y: drag!.startArea.y + dyPct,
          width: drag!.startArea.width,
          height: drag!.startArea.height,
        }));
      } else {
        let nw = drag!.startArea.width + dxPct;
        let nh = drag!.startArea.height + dyPct;
        if (Math.abs(dxPct) >= Math.abs(dyPct)) {
          nh = nw / aspectRatio;
        } else {
          nw = nh * aspectRatio;
        }
        onChange(normalise({
          x: drag!.startArea.x,
          y: drag!.startArea.y,
          width: nw,
          height: nh,
        }));
      }
    }
    function onUp() { setDrag(null); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  function startMove(e: React.PointerEvent) {
    e.preventDefault();
    setDrag({ mode: 'move', startX: e.clientX, startY: e.clientY, startArea: { ...area } });
  }
  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ mode: 'resize', startX: e.clientX, startY: e.clientY, startArea: { ...area } });
  }

  // mm readout (not editable — just so admin sees the physical size)
  const wMm = ((area.width / 100) * productWidthMm).toFixed(1);
  const hMm = ((area.height / 100) * productHeightMm).toFixed(1);

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_300px]">
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded border border-neutral-300 bg-neutral-50"
        style={{ aspectRatio: '1 / 1', userSelect: 'none', touchAction: 'none' }}
      >
        <img src={mockupUrl} alt="" draggable={false} className="absolute inset-0 h-full w-full object-contain" />
        <div
          onPointerDown={startMove}
          className="absolute border-2 border-pink bg-pink/15"
          style={{
            left: `${clamp(area.x)}%`,
            top: `${clamp(area.y)}%`,
            width: `${clamp(area.width)}%`,
            height: `${clamp(area.height)}%`,
            cursor: drag?.mode === 'move' ? 'grabbing' : 'grab',
          }}
        >
          <div
            onPointerDown={startResize}
            aria-label="Drag to resize"
            style={{
              position: 'absolute', right: -6, bottom: -6,
              width: 14, height: 14,
              background: '#E91E8C', border: '2px solid #fff', borderRadius: 2,
              cursor: 'nwse-resize', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>
      <div className="space-y-1 text-[11px] text-neutral-600">
        <div><strong>Design size:</strong> {wMm} × {hMm} mm</div>
        <div><strong>Position:</strong> {area.x.toFixed(1)}%, {area.y.toFixed(1)}% from top-left</div>
        <div className="mt-2 text-[10px] text-neutral-400">
          Drag the pink rectangle to move it. Drag the small square in the bottom-right to resize. Customers can fine-tune position inside this area when they upload their photo.
        </div>
      </div>
    </div>
  );
}
