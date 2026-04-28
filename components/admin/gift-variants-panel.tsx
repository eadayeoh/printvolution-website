'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, ChevronUp, ChevronDown, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { ImageUpload } from '@/components/admin/image-upload';
import { upsertGiftVariant, deleteGiftVariant } from '@/app/admin/gifts/actions';
import type { GiftProductVariant, GiftVariantColourSwatch, GiftVariantSurface, GiftInputMode, GiftTemplate, GiftTemplateZone, GiftSize } from '@/lib/gifts/types';
import { GIFT_MODE_LABEL } from '@/lib/gifts/types';
import type { ShapeKind, ShapeOption } from '@/lib/gifts/shape-options';
import { buildCityMapSvg } from '@/lib/gifts/city-map-svg';
import { buildStarMapSvg, buildStarMapScene } from '@/lib/gifts/star-map-svg';

/** Fallback for products that haven't pinned their allowed modes yet. Used
 *  only when allowedModes prop is empty — custom modes added via the admin
 *  modes page won't appear here, but they will appear once the parent
 *  product's primary/secondary mode is set to that custom mode. */
const FALLBACK_MODES = ['laser', 'uv', 'embroidery', 'photo-resize', 'eco-solvent', 'digital', 'uv-dtf'];

/** Display the configured label for a known mode, otherwise the slug
 *  itself (for custom modes added via /admin/gifts/modes). */
function modeLabel(slug: string): string {
  return (GIFT_MODE_LABEL as Record<string, string>)[slug] ?? slug;
}

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
  // Migration 0077 — per-variant size availability + price-delta
  // overrides. Keyed by gift_products.sizes[].slug. Missing key =
  // inherit product defaults (available, product-level delta).
  size_overrides: Record<string, { available?: boolean; price_delta_cents?: number }>;
  // Migration 0078 — material colour for renderer-driven products
  // (the bg behind the foil paths). Hex; empty string = fall back to
  // renderer default per layout.
  material_color: string;
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
    size_overrides: v?.size_overrides
      ? Object.fromEntries(
          Object.entries(v.size_overrides).map(([k, entry]) => [k, { ...entry }]),
        )
      : {},
    material_color: v?.material_color ?? '',
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
  allowedModes?: string[];
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
  /** Product-level sizes (gift_products.sizes). Drives the per-variant
   *  size availability + price-override table. Empty = product has a
   *  single fixed size; the override table is hidden. */
  productSizes?: GiftSize[];
  /** Renderer-driven template linked to the parent product (city_map /
   *  star_map). When set, the variant editor's mockup-area rectangle:
   *    - locks its aspect ratio to the template's reference dims
   *    - shows a "🔒 A3 portrait · 297×420mm" badge
   *    - composites the renderer's actual output inside the rectangle
   *      so admin sees what the customer will see (no mental
   *      compositing). Pass null/undefined for non-renderer products
   *      and the editor falls back to the legacy free-form rectangle. */
  linkedRendererTemplate?: GiftTemplate | null;
};

export const GiftVariantsPanel = forwardRef<GiftVariantsPanelHandle, GiftVariantsPanelProps>(function GiftVariantsPanel({
  giftProductId,
  initialVariants,
  allowedModes,
  productWidthMm,
  productHeightMm,
  parentShapeOptions,
  parentPrompts,
  productSizes,
  linkedRendererTemplate,
}, ref) {
  // ── Renderer preview wiring ──────────────────────────────────────────
  // Build the full SVG markup once per template change — we render the
  // SAME markup inside every variant's pink rectangle (admins see the
  // template overlay no matter which variant tile they're editing).
  // Customer text uses placeholder strings so admin gets a realistic
  // preview without leaking real customer data.
  const rendererPreviewSvg: string | null = (() => {
    const t = linkedRendererTemplate;
    if (!t || !t.renderer || t.renderer === 'zones') return null;
    const zones = (t.zones_json as GiftTemplateZone[] | null | undefined) ?? null;
    if (t.renderer === 'star_map') {
      const scene = buildStarMapScene(1.29, 103.85, new Date());
      const tw = (t as { reference_width_mm?: number | null }).reference_width_mm;
      const th = (t as { reference_height_mm?: number | null }).reference_height_mm;
      return buildStarMapSvg({
        scene, dateUtc: new Date(),
        names: 'EVA & JOHN', event: 'THE NIGHT WE MET',
        locationLabel: 'SINGAPORE', tagline: 'Under our stars',
        coordinates: '1.29° N · 103.85° E',
        showLines: true,
        zones,
        templateRefDims: tw && th ? { width_mm: tw, height_mm: th } : null,
      });
    }
    if (t.renderer === 'city_map') {
      return buildCityMapSvg({
        vectors: null,
        names: 'EVA & JOHN', event: 'OUR FIRST DATE',
        cityLabel: 'LONDON', tagline: 'Love now and always',
      });
    }
    // song_lyrics is a React component, not a string builder — skip
    // for now; admin will see the empty pink rectangle as before.
    return null;
  })();

  // Locked aspect ratio comes from the template's reference dimensions.
  // Falls back to null (no lock) if the template doesn't have both set.
  const lockedAspectRatio: number | null = (() => {
    const t = linkedRendererTemplate;
    if (!t) return null;
    const rw = (t as { reference_width_mm?: number | null }).reference_width_mm;
    const rh = (t as { reference_height_mm?: number | null }).reference_height_mm;
    if (!rw || !rh || rw <= 0 || rh <= 0) return null;
    return rw / rh;
  })();
  // Friendly badge text — most printable A-sizes get a nice label,
  // anything else gets the raw mm.
  const lockBadgeText: string | null = (() => {
    const t = linkedRendererTemplate;
    if (!t || !lockedAspectRatio) return null;
    const rw = (t as { reference_width_mm?: number }).reference_width_mm ?? 0;
    const rh = (t as { reference_height_mm?: number }).reference_height_mm ?? 0;
    const tagFor = (w: number, h: number): string | null => {
      const pairs: Array<[number, number, string]> = [
        [297, 420, 'A3'], [210, 297, 'A4'], [148, 210, 'A5'], [105, 148, 'A6'],
        [420, 297, 'A3 landscape'], [297, 210, 'A4 landscape'], [210, 148, 'A5 landscape'],
      ];
      const m = pairs.find(([pw, ph]) => Math.abs(pw - w) < 1 && Math.abs(ph - h) < 1);
      if (!m) return null;
      const portrait = h >= w;
      return portrait && m[2].length === 2 ? `${m[2]} portrait` : m[2];
    };
    const tag = tagFor(rw, rh);
    return tag
      ? `🔒 ${tag} · ${rw}×${rh}mm`
      : `🔒 ${rw}×${rh}mm`;
  })();
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>(initialVariants.map(toDraft));
  const [collapsed, setCollapsed] = useState<{ [k: string]: boolean }>({});
  const toggleCollapsed = (key: string) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));
  const moveDraft = (from: number, to: number) => {
    if (to < 0 || to >= drafts.length) return;
    setDrafts((list) => {
      const next = list.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((d, i) => ({ ...d, display_order: String(i) }));
    });
  };
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  function updateDraft(i: number, patch: Partial<Draft>) {
    setDrafts((list) => list.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  }

  function addRow() {
    setDrafts((list) => [...list, toDraft()]);
  }

  /**
   * Clone an existing variant — copies every field except the DB id (so
   * Save creates a new row), tweaks the slug + name to make the duplicate
   * obviously distinct, and inserts the copy directly below the source so
   * the admin doesn't lose their place. The duplicate isn't persisted
   * until the admin clicks Save.
   */
  function duplicateRow(i: number) {
    setDrafts((list) => {
      const src = list[i];
      const baseSlug = src.slug.replace(/-copy(?:-\d+)?$/, '') || 'variant';
      const existing = new Set(list.map((d) => d.slug));
      let suffix = 'copy';
      let candidate = `${baseSlug}-${suffix}`;
      let n = 2;
      while (existing.has(candidate)) {
        candidate = `${baseSlug}-copy-${n}`;
        n++;
      }
      const copy: Draft = {
        ...src,
        id: undefined,
        slug: candidate,
        name: src.name ? `${src.name} (copy)` : '',
        // Deep-clone nested arrays/objects so editing the copy doesn't
        // mutate the source row.
        colour_swatches: src.colour_swatches.map((s) => ({ ...s })),
        surfaces: src.surfaces.map((s) => ({ ...s, mockup_area: { ...s.mockup_area } })),
        mockup_area: { ...src.mockup_area },
        mockup_bounds: { ...src.mockup_bounds },
      };
      const next = list.slice();
      next.splice(i + 1, 0, copy);
      return next.map((d, idx) => ({ ...d, display_order: String(idx) }));
    });
    // Drop the new row open so the admin can rename it / tweak the
    // mockup straight away.
    setCollapsed((c) => ({ ...c, [`new-${i + 1}`]: false }));
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
    if (!d.name.trim()) {
      setErr(`Variant #${i + 1}: name is required`);
      return false;
    }
    if (!d.mockup_url) {
      setErr(`Variant "${d.name}": needs a mockup image`);
      return false;
    }
    // Slug is now an internal artifact — auto-derived from name when
    // missing, and auto-suffixed with a short random tag if a collision
    // would happen on (gift_product_id, slug) within this admin session.
    // Admins shouldn't have to think about slugs for variants.
    let workingSlug = d.slug.trim();
    if (!workingSlug) {
      workingSlug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'variant';
    }
    const taken = new Set(drafts.filter((_, j) => j !== i).map((o) => o.slug.trim()).filter(Boolean));
    if (taken.has(workingSlug)) {
      let n = 2;
      while (taken.has(`${workingSlug}-${n}`)) n++;
      workingSlug = `${workingSlug}-${n}`;
    }
    if (workingSlug !== d.slug) {
      d.slug = workingSlug;
      updateDraft(i, { slug: workingSlug });
    }
    for (const [si, s] of d.colour_swatches.entries()) {
      if (!s.name.trim()) { setErr(`Colour swatch #${si + 1} needs a name.`); return false; }
      if (!/^#[0-9A-Fa-f]{6}$/.test(s.hex)) { setErr(`Colour swatch #${si + 1} hex must be #RRGGBB.`); return false; }
      // Two valid shapes:
      //  - Mockup swatch: name + hex + mockup_url (swaps the displayed
      //    photo when picked, e.g. T-shirt with red / navy / black tiles).
      //  - Overlay swatch: name + hex, NO mockup_url (just retints the
      //    existing renderer output — used for foil colours like
      //    Gold / Rose Gold / Silver where the physical photo doesn't
      //    change, only the foil ink does).
      // Both need a name so the cart line is meaningful.
      if (!s.name.trim()) { setErr(`Colour swatch #${si + 1} needs a name.`); return false; }
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
      material_color: d.material_color.trim() || null,
      // Strip empty/no-op overrides so the DB doesn't accumulate
      // dead entries. An override is meaningful only when it sets
      // available=false OR a price_delta_cents.
      size_overrides: (() => {
        const cleaned: Record<string, { available?: boolean; price_delta_cents?: number }> = {};
        for (const [slug, entry] of Object.entries(d.size_overrides ?? {})) {
          if (!entry) continue;
          const out: { available?: boolean; price_delta_cents?: number } = {};
          if (entry.available === false) out.available = false;
          if (typeof entry.price_delta_cents === 'number' && entry.price_delta_cents > 0) {
            out.price_delta_cents = entry.price_delta_cents;
          }
          if (Object.keys(out).length) cleaned[slug] = out;
        }
        return cleaned;
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
  /** Quick-add a swatch with a known foil colour. Skips the row if a
   *  swatch with the same name already exists on the variant so admins
   *  can hammer the buttons without creating duplicates. */
  function addFoilSwatch(i: number, swatch: { name: string; hex: string }) {
    setDrafts((list) =>
      list.map((d, idx) => {
        if (idx !== i) return d;
        if (d.colour_swatches.some((s) => s.name.trim().toLowerCase() === swatch.name.toLowerCase())) {
          return d;
        }
        return {
          ...d,
          colour_swatches: [
            ...d.colour_swatches,
            { name: swatch.name, hex: swatch.hex, mockup_url: '' },
          ],
        };
      }),
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
            {drafts.map((d, i) => {
              const draftKey = d.id ?? `new-${i}`;
              const isCollapsed = !!collapsed[draftKey];
              return (
              <div key={draftKey} className="rounded-lg border-2 border-neutral-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-bold text-neutral-500">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(draftKey)}
                    className="flex flex-1 items-center gap-2 text-left hover:text-ink"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    <span className="text-ink">
                      {d.name?.trim() || (d.id ? `Variant #${i + 1}` : 'New variant (unsaved)')}
                    </span>
                    {d.id && (
                      <span className="text-neutral-400">
                        {' · S$'}{d.base_price || '0.00'}
                        {!d.is_active && ' · (hidden)'}
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    {flashId === d.id && <span className="text-green-600">✓ Saved</span>}
                    <button
                      type="button"
                      onClick={() => moveDraft(i, i - 1)}
                      disabled={i === 0}
                      className="rounded border border-neutral-200 p-1 text-neutral-500 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDraft(i, i + 1)}
                      disabled={i === drafts.length - 1}
                      className="rounded border border-neutral-200 p-1 text-neutral-500 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateRow(i)}
                      className="rounded border border-neutral-200 p-1 text-neutral-500 hover:border-ink hover:text-ink"
                      title="Duplicate this variant — new copy inserted below, save to persist"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                {!isCollapsed && (
                <>
                <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
                  <div className="space-y-3">
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
                          lockedAspectRatio={lockedAspectRatio}
                          lockBadgeText={lockBadgeText}
                          previewSvgMarkup={rendererPreviewSvg}
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
                                    onChange={(e) => updateSurface(i, sIdx, { mode: e.target.value || null })}
                                    className={inputCls}
                                  >
                                    <option value="">Inherit parent</option>
                                    {(allowedModes && allowedModes.length > 0 ? allowedModes : FALLBACK_MODES).map((m) => (
                                      <option key={m} value={m}>{modeLabel(m)}</option>
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
                    {(() => {
                      // When a linked renderer template owns the
                      // customer colour picker (migration 0079), the
                      // per-variant swatches section becomes redundant
                      // — hide it entirely so admins configure colours
                      // in one place. Legacy variants (no linked
                      // renderer template, or template with no picker
                      // role set) keep the original section.
                      const tplPickerRole =
                        (linkedRendererTemplate as { customer_picker_role?: string | null } | null)?.customer_picker_role ?? null;
                      if (tplPickerRole) {
                        return (
                          <div className="rounded border border-dashed border-magenta/40 bg-magenta/5 p-3 text-[11px] leading-snug text-ink">
                            <div className="font-bold uppercase tracking-wider text-magenta">
                              Colour picker — managed by template
                            </div>
                            <div className="mt-1 text-neutral-600">
                              The linked template <strong>{linkedRendererTemplate?.name}</strong> defines its own customer colour picker
                              ({tplPickerRole === 'foil_overlay' ? 'foil overlay' : tplPickerRole === 'mockup_swap' ? 'mockup swap' : tplPickerRole}).
                              Edit the swatches on the template, not here.
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })() || (
                    <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-ink">
                            {linkedRendererTemplate ? 'Colour overlays (optional)' : 'Colour swatches (optional)'}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {linkedRendererTemplate ? (
                              <>
                                Foil / ink colour options the customer picks
                                between. Each colour overlays all the text in
                                the rendered template. Add as many as you
                                want — quick-add chips below for the common
                                ones. Mockup image is optional: leave blank
                                for a pure overlay (recommended for foil
                                colours like Gold / Rose Gold / Silver where
                                the photo doesn&apos;t change), upload a
                                photo to also swap the displayed mockup
                                when picked.
                              </>
                            ) : (
                              <>
                                Add colour choices inside this tile — e.g.
                                one T-shirt tile with red / navy / black
                                dots. Customer picks a swatch to swap the
                                displayed mockup. Leave empty for no colour
                                choice.
                              </>
                            )}
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
                      {/* Quick-add chips for the foil colours that
                          come up on every renderer-driven product
                          (Star Map, City Map, Song Lyrics frames).
                          Skips re-adding any name already present so
                          admins can mash the buttons without making
                          duplicates. */}
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Quick add foil:</span>
                        {[
                          { name: 'Gold',      hex: '#d4af37' },
                          { name: 'Rose Gold', hex: '#b76e79' },
                          { name: 'Silver',    hex: '#c0c0c0' },
                          { name: 'Copper',    hex: '#b87333' },
                          { name: 'Black',     hex: '#0a0a0a' },
                          { name: 'White',     hex: '#ffffff' },
                        ].map((c) => {
                          const exists = d.colour_swatches.some(
                            (s) => s.name.trim().toLowerCase() === c.name.toLowerCase(),
                          );
                          return (
                            <button
                              key={c.name}
                              type="button"
                              disabled={exists}
                              onClick={() => addFoilSwatch(i, c)}
                              title={exists ? `${c.name} already added` : `Add ${c.name} (${c.hex})`}
                              className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide hover:border-pink hover:text-pink disabled:opacity-40 disabled:hover:border-neutral-300 disabled:hover:text-current"
                            >
                              <span
                                aria-hidden
                                style={{
                                  width: 11, height: 11, borderRadius: '50%',
                                  background: c.hex,
                                  border: '1px solid #0a0a0a',
                                  display: 'inline-block',
                                }}
                              />
                              {c.name}
                            </button>
                          );
                        })}
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
                              <div className="w-[140px]">
                                <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Mockup (optional)</span>
                                <ImageUpload
                                  value={s.mockup_url}
                                  onChange={(url) => updateSwatch(i, sIdx, { mockup_url: url })}
                                  prefix={`swatch-${d.slug || 'x'}-${sIdx}`}
                                  aspect={1}
                                  size="sm"
                                  label="Mockup"
                                />
                                <div className="mt-1 text-[10px] leading-snug text-neutral-500">
                                  {s.mockup_url ? (
                                    <span><strong>Mockup swatch</strong> — picking this swaps the displayed photo.</span>
                                  ) : (
                                    <span><strong>Colour overlay</strong> — no photo swap; only retints the renderer output (foil colour).</span>
                                  )}
                                </div>
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
                    )}

                    {/* Per-variant size availability + price-delta
                        overrides. Defaults: all product sizes
                        available, with the product-level price delta
                        applied. Admin only fills this in for the
                        exceptions — variants that don't carry a
                        particular size, or that need a different
                        delta for a specific size×variant combo. */}
                    {(productSizes ?? []).length > 0 && (
                      <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
                        <div className="mb-2">
                          <div className="text-[11px] font-bold text-ink">Sizes for this variant (optional)</div>
                          <div className="text-[10px] text-neutral-500">
                            By default this variant is available in every product size, with the product-level price delta. Untick a size to hide it for this variant only. Set a price override to charge a different delta on this variant × size — leave at 0.00 to inherit the product default.
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-[24px_1fr_120px_140px] gap-2 px-1 text-[10px] font-bold uppercase text-neutral-500">
                            <span></span>
                            <span>Size</span>
                            <span>Dimensions</span>
                            <span>+ Price (S$) override</span>
                          </div>
                          {(productSizes ?? []).map((sz) => {
                            const ov = d.size_overrides?.[sz.slug] ?? {};
                            const available = ov.available !== false;
                            const overrideDeltaCents = typeof ov.price_delta_cents === 'number' ? ov.price_delta_cents : null;
                            const productDelta = sz.price_delta_cents ?? 0;
                            const inputDollars = overrideDeltaCents != null
                              ? (overrideDeltaCents / 100).toFixed(2)
                              : '';
                            return (
                              <div key={sz.slug} className="grid grid-cols-[24px_1fr_120px_140px] items-center gap-2 rounded border border-neutral-200 bg-white p-2">
                                <input
                                  type="checkbox"
                                  checked={available}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setDrafts((list) => list.map((x, j) => {
                                      if (j !== i) return x;
                                      const next = { ...(x.size_overrides ?? {}) };
                                      const cur = next[sz.slug] ?? {};
                                      if (checked) {
                                        // Available again — drop the
                                        // available flag; keep any price override.
                                        delete cur.available;
                                      } else {
                                        cur.available = false;
                                      }
                                      if (Object.keys(cur).length === 0) {
                                        delete next[sz.slug];
                                      } else {
                                        next[sz.slug] = cur;
                                      }
                                      return { ...x, size_overrides: next };
                                    }));
                                  }}
                                  title={available ? 'Available — uncheck to hide this size on this variant' : 'Hidden — check to make available'}
                                />
                                <div>
                                  <div className="text-[12px] font-bold text-ink">{sz.name || sz.slug}</div>
                                  {!available && <div className="text-[10px] text-red-600">Hidden for this variant</div>}
                                </div>
                                <div className="text-[11px] text-neutral-600">
                                  {sz.width_mm}×{sz.height_mm}mm
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-neutral-400">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder={(productDelta / 100).toFixed(2)}
                                    value={inputDollars}
                                    disabled={!available}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      setDrafts((list) => list.map((x, j) => {
                                        if (j !== i) return x;
                                        const next = { ...(x.size_overrides ?? {}) };
                                        const cur = { ...(next[sz.slug] ?? {}) };
                                        if (raw === '' || raw == null) {
                                          delete cur.price_delta_cents;
                                        } else {
                                          const cents = Math.max(0, Math.round((parseFloat(raw) || 0) * 100));
                                          cur.price_delta_cents = cents;
                                        }
                                        if (Object.keys(cur).length === 0) {
                                          delete next[sz.slug];
                                        } else {
                                          next[sz.slug] = cur;
                                        }
                                        return { ...x, size_overrides: next };
                                      }));
                                    }}
                                    className={`${inputCls} w-full font-mono text-xs disabled:opacity-50`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 text-[10px] text-neutral-400">
                          Empty price field = use the product-level delta ({(productSizes ?? [])[0] ? `$${((productSizes ?? [])[0].price_delta_cents / 100).toFixed(2)}` : '—'} on the first size, etc).
                        </div>
                      </div>
                    )}
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
                </>
                )}
              </div>
              );
            })}
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
  lockedAspectRatio,
  lockBadgeText,
  previewSvgMarkup,
}: {
  mockupUrl: string;
  area: Rect;
  productWidthMm: number;
  productHeightMm: number;
  onChange: (next: Rect) => void;
  /** When set, resizing the rectangle preserves this width/height ratio
   *  (always — no Shift required). Admins can override per-variant via
   *  the unlock toggle if they need a non-matching mockup area. */
  lockedAspectRatio?: number | null;
  /** Pill rendered on the rectangle, e.g. "🔒 A3 portrait · 297×420mm".
   *  Tells admin at a glance the rectangle matches the linked template. */
  lockBadgeText?: string | null;
  /** Optional inline SVG markup rendered INSIDE the rectangle so admin
   *  sees the actual template output composited on the variant photo,
   *  not an empty pink fill. Pass the full `<svg ...>...</svg>` string. */
  previewSvgMarkup?: string | null;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<
    | { mode: 'move' | 'resize'; startX: number; startY: number; startArea: Rect }
    | null
  >(null);
  // Stage aspect strategy:
  //  • Renderer-linked variant (lockedAspectRatio set) → the stage IS
  //    the template's shape. A linked-A3 variant gets a stage drawn at
  //    297:420 portrait, so a rectangle drawn at any width%/height% =
  //    same pct (i.e. pctW=pctH) automatically displays as A3. This is
  //    bullet-proof: doesn't depend on the mockup image's actual
  //    dimensions, doesn't depend on JS image loading. The mockup
  //    image letterboxes inside the stage via object-contain.
  //  • Otherwise → fall back to the mockup image's natural aspect so
  //    free-form rectangles stay geometrically faithful to the photo.
  const [imageDims, setImageDims] = useState<{ w: number; h: number }>({ w: 1, h: 1 });
  useEffect(() => {
    if (!mockupUrl) { setImageDims({ w: 1, h: 1 }); return; }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setImageDims({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
    img.src = mockupUrl;
  }, [mockupUrl]);
  // Per-variant override of the lock prop. Only matters when
  // lockedAspectRatio is also set — flipping this off lets admin draw a
  // mismatched rectangle (e.g. intentional letterbox on a square frame).
  const [aspectUnlocked, setAspectUnlocked] = useState<boolean>(false);
  const effectiveLockedRatio =
    !aspectUnlocked && lockedAspectRatio && lockedAspectRatio > 0
      ? lockedAspectRatio
      : null;
  const stageDims = effectiveLockedRatio
    // Build stage dims from the locked W/H ratio. Use 1000 as the
    // base so the numbers stay readable (1000 × 1414 for A3 etc.).
    ? { w: 1000, h: Math.round(1000 / effectiveLockedRatio) }
    : imageDims;
  const stageAspect = `${stageDims.w} / ${stageDims.h}`;

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
    // Aspect ratio is preserved on resize when:
    //  - The variant's product is linked to a renderer template with
    //    reference dimensions → effectiveLockedRatio is the locked
    //    DISPLAY ratio (W/H). Admins want the rectangle to LOOK A3 in
    //    the editor (so they can trace the design opening of the
    //    physical product), so we lock the rectangle's on-screen
    //    aspect — not the % math. The on-screen aspect of a
    //    width%/height% rectangle on a stage with aspect stage_W /
    //    stage_H is (width% / height%) × (stage_W / stage_H), so the
    //    pct-space ratio we lock to is lockedRatio × (stage_H/stage_W).
    //  - Shift-drag falls back to the product's mm aspect (legacy).
    const stageHWRatio = stageDims.w > 0 && stageDims.h > 0
      ? stageDims.h / stageDims.w
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
        // Pick the locked DISPLAY aspect (W/H, both pixels on screen):
        //   - Renderer-linked variant → effectiveLockedRatio
        //   - Shift-drag → product's mm aspect (assumes mockup image
        //     was photographed with the product roughly filling it)
        const lockedDisplayRatio = effectiveLockedRatio
          ?? (e.shiftKey && productWidthMm > 0 && productHeightMm > 0
                ? productWidthMm / productHeightMm
                : null);
        if (lockedDisplayRatio) {
          const pctRatio = lockedDisplayRatio * stageHWRatio;
          if (Math.abs(dxPct) >= Math.abs(dyPct)) {
            nh = nw / pctRatio;
          } else {
            nw = nh * pctRatio;
          }
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
  }, [drag, effectiveLockedRatio]);

  // When the lock turns ON (or the locked ratio / stage dims change)
  // and the rectangle's display aspect doesn't match, snap it.
  // Anchored at top-left so position stays where admin put it. Display
  // aspect = (width% × stage_W) / (height% × stage_H), so we want
  // width% / height% = lockedRatio × stage_H / stage_W.
  useEffect(() => {
    if (!effectiveLockedRatio) return;
    if (stageDims.w <= 0 || stageDims.h <= 0) return;
    const pctRatio = effectiveLockedRatio * (stageDims.h / stageDims.w);
    const currentPctRatio = area.width / area.height;
    if (Math.abs(currentPctRatio - pctRatio) < 0.001) return;
    // Snap by adjusting height (keep width). Fall back to adjusting
    // width if height would exceed 100% of the stage.
    let nw = area.width;
    let nh = nw / pctRatio;
    if (nh > 100) {
      nh = area.height;
      nw = nh * pctRatio;
    }
    onChange(normalise({ x: area.x, y: area.y, width: nw, height: nh }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveLockedRatio, stageDims.w, stageDims.h]);

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
        style={{ aspectRatio: stageAspect, userSelect: 'none', touchAction: 'none' }}
      >
        <img src={mockupUrl} alt="" draggable={false} className="absolute inset-0 h-full w-full object-contain" />
        <div
          onPointerDown={startMove}
          className="absolute border-2 border-pink"
          style={{
            left: `${clamp(area.x)}%`,
            top: `${clamp(area.y)}%`,
            width: `${clamp(area.width)}%`,
            height: `${clamp(area.height)}%`,
            cursor: drag?.mode === 'move' ? 'grabbing' : 'grab',
            // Translucent pink fill behind the preview so the rectangle
            // remains visible even when the renderer SVG is dark.
            background: previewSvgMarkup ? 'transparent' : 'rgba(233,30,140,0.15)',
            overflow: 'hidden',
          }}
        >
          {previewSvgMarkup && (
            <div
              // Shows the actual renderer output composited inside the
              // pink rectangle so admin sees what customers see — no
              // mental compositing needed. SVG comes from the linked
              // template's own builder, customer text is empty/placeholder.
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: previewSvgMarkup }}
            />
          )}
          {lockBadgeText && (
            <div
              className="pointer-events-none absolute left-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
              style={{ background: 'rgba(233,30,140,0.92)' }}
            >
              {lockBadgeText}
            </div>
          )}
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
        {lockedAspectRatio && (
          <div className="mt-2 rounded border-2 border-magenta/30 bg-magenta/5 p-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-[10px] font-bold text-ink">
              <input
                type="checkbox"
                checked={!aspectUnlocked}
                onChange={(e) => setAspectUnlocked(!e.target.checked)}
              />
              <span>Lock aspect to template ({lockedAspectRatio.toFixed(3)})</span>
            </label>
            <div className="mt-1 text-[9px] text-neutral-500">
              Keeps the rectangle at the linked template&apos;s ratio so
              the customer&apos;s design fits without distortion. Uncheck
              for an intentional letterbox / mismatch.
            </div>
          </div>
        )}
        <div className="mt-2 text-[10px] text-neutral-400">
          Drag the pink rectangle to move it. Drag the small square in the bottom-right to resize{lockedAspectRatio ? ' (aspect locked)' : ' freely — hold Shift to lock to the product\'s aspect ratio'}. Customers can fine-tune position inside this area when they upload their photo.
        </div>
      </div>
    </div>
  );
}
