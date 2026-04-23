'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';
import { ImageUpload } from '@/components/admin/image-upload';
import { upsertGiftVariant, deleteGiftVariant } from '@/app/admin/gifts/actions';
import type { GiftProductVariant, GiftVariantKind, GiftVariantColourSwatch, GiftVariantSurface, GiftInputMode, GiftMode } from '@/lib/gifts/types';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';

const ALL_GIFT_MODES: GiftMode[] = ['laser', 'uv', 'embroidery', 'photo-resize', 'eco-solvent', 'digital', 'uv-dtf'];

type Draft = {
  id?: string;
  slug: string;
  name: string;
  features_text: string; // textarea (newline-separated)
  mockup_url: string;
  mockup_area: { x: number; y: number; width: number; height: number };
  variant_thumbnail_url: string;
  base_price: string; // dollars
  display_order: string;
  is_active: boolean;
  variant_kind: GiftVariantKind;
  width_mm: string;  // mm for size variants, blank otherwise
  height_mm: string;
  // Optional colour choices nested under this variant tile (e.g. one
  // "T-shirt" tile with red / navy / black swatches).
  colour_swatches: GiftVariantColourSwatch[];
  // Multi-face config. Empty = single-surface fallback using the
  // variant row's own mockup_url + mockup_area.
  surfaces: GiftVariantSurface[];
};

function toDraft(v?: GiftProductVariant): Draft {
  return {
    id: v?.id,
    slug: v?.slug ?? '',
    name: v?.name ?? '',
    features_text: (v?.features ?? []).join('\n'),
    mockup_url: v?.mockup_url ?? '',
    mockup_area: (v?.mockup_area as any) ?? { x: 20, y: 20, width: 60, height: 60 },
    variant_thumbnail_url: v?.variant_thumbnail_url ?? '',
    base_price: ((v?.base_price_cents ?? 0) / 100).toFixed(2),
    display_order: String(v?.display_order ?? 0),
    is_active: v?.is_active ?? true,
    variant_kind: v?.variant_kind ?? 'base',
    width_mm:  v?.width_mm  != null ? String(v.width_mm)  : '',
    height_mm: v?.height_mm != null ? String(v.height_mm) : '',
    colour_swatches: (v?.colour_swatches ?? []).map((s) => ({ ...s })),
    surfaces: (v?.surfaces ?? []).map((s) => ({ ...s, mockup_area: { ...s.mockup_area } })),
  };
}

const A_SERIES_PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: 'A3 portrait', w: 297, h: 420 },
  { label: 'A4 portrait', w: 210, h: 297 },
  { label: 'A5 portrait', w: 148, h: 210 },
  { label: 'A6 portrait', w: 105, h: 148 },
  { label: 'A3 landscape', w: 420, h: 297 },
  { label: 'A4 landscape', w: 297, h: 210 },
  { label: 'A5 landscape', w: 210, h: 148 },
];

export function GiftVariantsPanel({
  giftProductId,
  initialVariants,
}: {
  giftProductId: string;
  initialVariants: GiftProductVariant[];
}) {
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

  function saveRow(i: number) {
    setErr(null);
    const d = drafts[i];
    if (!d.name.trim() || !d.slug.trim()) {
      setErr('Name and slug are required for each variant');
      return;
    }
    // Base variants still need a mockup image (old LED-stand behaviour);
    // size / colour / material variants reuse the product's mockup so
    // the mockup_url is optional for them.
    if (d.variant_kind === 'base' && !d.mockup_url) {
      setErr('Base variants still need a mockup image (upload one or switch the kind to size / colour / material).');
      return;
    }
    if (d.variant_kind === 'size') {
      const w = parseFloat(d.width_mm);
      const h = parseFloat(d.height_mm);
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
        setErr('Size variants need positive width and height in mm.');
        return;
      }
    }
    // Validate swatches up-front so the Zod error on the server doesn't
    // surface as an opaque blob.
    for (const [si, s] of d.colour_swatches.entries()) {
      if (!s.name.trim()) { setErr(`Colour swatch #${si + 1} needs a name.`); return; }
      if (!/^#[0-9A-Fa-f]{6}$/.test(s.hex)) {
        setErr(`Colour swatch #${si + 1} hex must be #RRGGBB (got "${s.hex}").`);
        return;
      }
      if (!s.mockup_url) { setErr(`Colour swatch #${si + 1} needs a mockup image.`); return; }
    }
    const payload = {
      id: d.id,
      gift_product_id: giftProductId,
      slug: d.slug.trim(),
      name: d.name.trim(),
      features: d.features_text.split('\n').map((s) => s.trim()).filter(Boolean),
      mockup_url: d.mockup_url,
      mockup_area: d.mockup_area,
      variant_thumbnail_url: d.variant_thumbnail_url || null,
      base_price_cents: Math.round((parseFloat(d.base_price) || 0) * 100),
      display_order: parseInt(d.display_order, 10) || 0,
      is_active: d.is_active,
      variant_kind: d.variant_kind,
      width_mm:  d.variant_kind === 'size' && d.width_mm  ? parseFloat(d.width_mm)  : null,
      height_mm: d.variant_kind === 'size' && d.height_mm ? parseFloat(d.height_mm) : null,
      colour_swatches: d.colour_swatches.map((s) => ({
        name: s.name.trim(),
        hex: s.hex,
        mockup_url: s.mockup_url,
      })),
      surfaces: d.surfaces.map((s) => ({
        id: s.id.trim(),
        label: s.label.trim(),
        accepts: s.accepts,
        mockup_url: s.mockup_url,
        mockup_area: s.mockup_area,
        max_chars: s.max_chars ?? null,
        font_family: s.font_family ?? null,
        font_size_pct: s.font_size_pct ?? null,
        color: s.color ?? null,
        mode: s.mode ?? null,
      })),
    };
    // Extra validation for surfaces up-front so Zod errors don't
    // surface as opaque blobs. mockup_url is optional — text-only
    // surfaces render fine without one, and production never touches
    // it (the real output uses text or the per-surface source photo).
    for (const [si, s] of d.surfaces.entries()) {
      if (!s.id.trim() || !/^[a-z0-9-]+$/.test(s.id)) {
        setErr(`Surface #${si + 1} id must be lowercase-slug (got "${s.id}").`);
        return;
      }
      if (!s.label.trim()) { setErr(`Surface #${si + 1} needs a label.`); return; }
      if (s.accepts === 'photo' && !s.mockup_url) {
        setErr(`Surface "${s.label || s.id}" accepts photo — set a mockup image so the customer can see where their photo lands, or change accepts to 'text'.`);
        return;
      }
    }
    startTransition(async () => {
      const r = await upsertGiftVariant(payload);
      if (!r.ok) { setErr(r.error); return; }
      if (!d.id) {
        // refresh to pull back the newly-created row with id
        router.refresh();
      } else {
        setFlashId(d.id);
        setTimeout(() => setFlashId(null), 1600);
      }
    });
  }

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

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-ink">Variants</div>
            <div className="text-[11px] text-neutral-500">
              Pick a kind per variant — <b>Base</b> (different physical mockup, e.g. LED stand A/B/C),{' '}
              <b>Size</b> (A3/A4/A5/A6 — sets the print dimensions), <b>Colour</b>, or <b>Material</b>. Mix kinds freely.
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
                    <div className="grid grid-cols-[1fr_2fr_1fr] gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-ink">Kind</span>
                        <select
                          value={d.variant_kind}
                          onChange={(e) => updateDraft(i, { variant_kind: e.target.value as GiftVariantKind })}
                          className={inputCls}
                        >
                          <option value="base">Base (mockup)</option>
                          <option value="size">Size (dimensions)</option>
                          <option value="colour">Colour</option>
                          <option value="material">Material</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-ink">Name</span>
                        <input
                          value={d.name}
                          onBlur={() => autoSlug(i)}
                          onChange={(e) => updateDraft(i, { name: e.target.value })}
                          className={inputCls}
                          placeholder={
                            d.variant_kind === 'size' ? 'A4 portrait' :
                            d.variant_kind === 'colour' ? 'Warm White' :
                            d.variant_kind === 'material' ? 'Oak' :
                            'Oak Round'
                          }
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
                    {d.variant_kind === 'size' && (
                      <div className="rounded border border-pink-200 bg-pink-50/50 p-3">
                        <div className="mb-2 text-[11px] font-bold text-ink">
                          Print dimensions (overrides the product&apos;s default when a customer picks this variant)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Width (mm)</span>
                            <input
                              type="number" min={1} step={0.1}
                              value={d.width_mm}
                              onChange={(e) => updateDraft(i, { width_mm: e.target.value })}
                              className={inputCls}
                              placeholder="210"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Height (mm)</span>
                            <input
                              type="number" min={1} step={0.1}
                              value={d.height_mm}
                              onChange={(e) => updateDraft(i, { height_mm: e.target.value })}
                              className={inputCls}
                              placeholder="297"
                            />
                          </label>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {A_SERIES_PRESETS.map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => updateDraft(i, { width_mm: String(p.w), height_mm: String(p.h) })}
                              className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-700 hover:border-pink hover:text-pink"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                    {d.variant_kind === 'base' && (
                      <div>
                        <div className="mb-1 text-[11px] font-bold text-neutral-500">Mockup area (% of mockup image)</div>
                        <div className="grid grid-cols-4 gap-2 text-[11px]">
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Area x %</span>
                            <input type="number" value={d.mockup_area.x}
                              onChange={(e) => updateDraft(i, { mockup_area: { ...d.mockup_area, x: parseFloat(e.target.value) || 0 } })}
                              className={inputCls} />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Area y %</span>
                            <input type="number" value={d.mockup_area.y}
                              onChange={(e) => updateDraft(i, { mockup_area: { ...d.mockup_area, y: parseFloat(e.target.value) || 0 } })}
                              className={inputCls} />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Width %</span>
                            <input type="number" value={d.mockup_area.width}
                              onChange={(e) => updateDraft(i, { mockup_area: { ...d.mockup_area, width: parseFloat(e.target.value) || 0 } })}
                              className={inputCls} />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Height %</span>
                            <input type="number" value={d.mockup_area.height}
                              onChange={(e) => updateDraft(i, { mockup_area: { ...d.mockup_area, height: parseFloat(e.target.value) || 0 } })}
                              className={inputCls} />
                          </label>
                        </div>
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
                              <div className="grid grid-cols-[70px_1fr_90px_70px_auto] gap-2">
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
                                <button
                                  type="button"
                                  onClick={() => removeSurface(i, sIdx)}
                                  className="mt-5 rounded-full border border-red-200 p-1 text-red-600 hover:bg-red-50 self-start"
                                  title="Remove surface"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div className="mt-2 grid grid-cols-[120px_1fr] gap-2">
                                <div>
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
                                    Mockup{s.accepts === 'photo' ? '' : ' (optional)'}
                                  </span>
                                  <ImageUpload
                                    value={s.mockup_url}
                                    onChange={(url) => updateSurface(i, sIdx, { mockup_url: url })}
                                    prefix={`surface-${d.slug || 'x'}-${s.id || sIdx}`}
                                    aspect={1}
                                    size="sm"
                                    label="Mockup"
                                  />
                                  {s.accepts !== 'photo' && (
                                    <div className="mt-1 text-[9px] text-neutral-500">
                                      Used for the customer preview only. Text-only surfaces render fine without one.
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
                                    Surface area on mockup (% of image)
                                  </span>
                                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                                    {(['x', 'y', 'width', 'height'] as const).map((k) => (
                                      <label key={k} className="block">
                                        <span className="mb-0.5 block text-[9px] font-bold uppercase text-neutral-400">{k}</span>
                                        <input
                                          type="number"
                                          value={s.mockup_area[k]}
                                          onChange={(e) => updateSurface(i, sIdx, { mockup_area: { ...s.mockup_area, [k]: parseFloat(e.target.value) || 0 } })}
                                          className={inputCls}
                                        />
                                      </label>
                                    ))}
                                  </div>
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
                                    {ALL_GIFT_MODES.map((m) => (
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
                    {d.variant_kind === 'base' && (
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
                    )}
                    <div>
                      <span className="mb-1 block text-xs font-bold text-ink">Variant thumbnail</span>
                      <ImageUpload
                        value={d.variant_thumbnail_url}
                        onChange={(url) => updateDraft(i, { variant_thumbnail_url: url })}
                        prefix={`variant-${d.slug || 'thumb'}`}
                        aspect={1}
                        size="md"
                        label="Thumb"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveRow(i)}
                    disabled={isPending}
                    className="rounded-full bg-pink px-4 py-1.5 text-xs font-bold text-white hover:bg-pink-dark disabled:opacity-50"
                  >
                    {d.id ? 'Save' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> {d.id ? 'Delete' : 'Discard'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {err && <div className="mt-3 text-xs font-bold text-red-600">{err}</div>}
      </div>
    </div>
  );
}
