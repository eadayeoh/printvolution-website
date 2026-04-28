'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus } from 'lucide-react';
import { createGiftProduct, updateGiftProduct, deleteGiftProduct, setProductTemplates } from '@/app/admin/gifts/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import { GiftMockupEditor } from '@/components/admin/gift-mockup-editor';
import { MagazineEditor, type MagValue } from '@/components/admin/product-magazine-editor';
import { GIFT_MODE_LABEL, GIFT_MODE_DESCRIPTION } from '@/lib/gifts/types';
import type { GiftMode, GiftTemplateMode, GiftProduct, GiftTemplate, GiftPipeline, GiftProductVariant, GiftSize } from '@/lib/gifts/types';
import type { GiftModeMeta } from '@/lib/gifts/modes';
import { GiftVariantsPanel, type GiftVariantsPanelHandle } from './gift-variants-panel';
import { GiftShapeOptionsEditor } from './gift-shape-options-editor';
import type { ShapeOption } from '@/lib/gifts/shape-options';
import { GiftFigurineOptionsEditor, type FigurineOption, type FigurineArea } from './gift-figurine-options-editor';
import { slugify } from '@/lib/utils';

type Cat = { id: string; slug: string; name: string; parent_id: string | null };

type Props = {
  product: GiftProduct | null;
  categories: Cat[];
  allTemplates: GiftTemplate[];
  assignedTemplateIds: string[];
  pipelines?: GiftPipeline[];
  modes?: GiftModeMeta[];
  variants?: GiftProductVariant[];
  /** Active prompts from the modes this product supports. Fed into the
   *  variants panel so each variant can upload per-prompt mockups. */
  parentPrompts?: Array<{ id: string; name: string; mode: string }>;
  /** EVERY active prompt matching the product's mode(s) — the full
   *  candidate set the admin can choose from for the per-product art-
   *  style allowlist. Independent of the existing prompt_ids
   *  selection. */
  allCandidatePrompts?: Array<{ id: string; name: string; mode: string; thumbnail_url: string | null }>;
};

type Tab = 'basics' | 'production' | 'design' | 'content';

// Fallback used only if the /admin/gifts/modes DB hasn't been seeded yet.
const FALLBACK_MODES: GiftModeMeta[] = [
  { slug: 'laser',        label: 'Laser Engraving',  description: GIFT_MODE_DESCRIPTION['laser'],        icon: null, display_order: 1, is_active: true },
  { slug: 'uv',           label: 'UV Printing',      description: GIFT_MODE_DESCRIPTION['uv'],           icon: null, display_order: 2, is_active: true },
  { slug: 'embroidery',   label: 'Embroidery',       description: GIFT_MODE_DESCRIPTION['embroidery'],   icon: null, display_order: 3, is_active: true },
  { slug: 'photo-resize', label: 'Photo Resize',     description: GIFT_MODE_DESCRIPTION['photo-resize'], icon: null, display_order: 4, is_active: true },
  { slug: 'eco-solvent',  label: 'Eco Solvent',      description: GIFT_MODE_DESCRIPTION['eco-solvent'],  icon: null, display_order: 5, is_active: true },
  { slug: 'digital',      label: 'Digital Printing', description: GIFT_MODE_DESCRIPTION['digital'],      icon: null, display_order: 6, is_active: true },
  { slug: 'uv-dtf',       label: 'UV DTF',           description: GIFT_MODE_DESCRIPTION['uv-dtf'],       icon: null, display_order: 7, is_active: true },
];

export function GiftProductEditor({ product, categories, allTemplates, assignedTemplateIds, pipelines = [], modes, variants = [], parentPrompts = [], allCandidatePrompts = [] }: Props) {
  const MODE_OPTIONS = (modes && modes.length > 0 ? modes : FALLBACK_MODES);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [tab, setTab] = useState<Tab>('basics');

  const [slug, setSlug] = useState(product?.slug ?? '');
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [tagline, setTagline] = useState(product?.tagline ?? '');
  const [thumbnail, setThumbnail] = useState(product?.thumbnail_url ?? '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  const [mode, setMode] = useState<GiftMode>(product?.mode ?? 'photo-resize');
  const [secondaryMode, setSecondaryMode] = useState<GiftMode | null>(product?.secondary_mode ?? null);
  const [templateMode, setTemplateMode] = useState<GiftTemplateMode>(product?.template_mode ?? 'none');
  const [modeLocked] = useState(!!product?.first_ordered_at);
  const [pipelineId, setPipelineId] = useState<string>(product?.pipeline_id ?? '');
  const [secondaryPipelineId, setSecondaryPipelineId] = useState<string>(product?.secondary_pipeline_id ?? '');
  const [promptIds, setPromptIds] = useState<string[]>(
    Array.isArray((product as any)?.prompt_ids) ? ((product as any).prompt_ids as string[]) : [],
  );
  const [retentionDays, setRetentionDays] = useState<string>(String(product?.source_retention_days ?? 30));
  const [leadTimeDays, setLeadTimeDays] = useState<string>(String(product?.lead_time_days ?? 5));
  const [allowedFonts, setAllowedFonts] = useState<string[]>(product?.allowed_fonts ?? []);

  // The main Save button should also persist every variant (admin
  // removed the per-row Save in favour of one action). Ref + handle
  // lets us reach into the panel without lifting all its state.
  const variantsRef = useRef<GiftVariantsPanelHandle | null>(null);

  const [widthMm, setWidthMm] = useState(product?.width_mm.toString() ?? '100');
  const [heightMm, setHeightMm] = useState(product?.height_mm.toString() ?? '100');
  const [bleedMm, setBleedMm] = useState(product?.bleed_mm.toString() ?? '2');
  const [safeZoneMm, setSafeZoneMm] = useState(product?.safe_zone_mm.toString() ?? '3');
  const [minSourcePx, setMinSourcePx] = useState(product?.min_source_px.toString() ?? '1200');


  const [basePrice, setBasePrice] = useState(((product?.base_price_cents ?? 0) / 100).toFixed(2));
  const [priceTiers, setPriceTiers] = useState<Array<{ qty: string; price: string }>>(
    (product?.price_tiers ?? []).map((t) => ({ qty: String(t.qty), price: (t.price_cents / 100).toFixed(2) }))
  );

  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? '');
  const [seoDesc, setSeoDesc] = useState(product?.seo_desc ?? '');
  // Admin-authored long-form content. Each is nullable — null means the
  // public-facing component renders the mode-based default instead.
  const [seoBody, setSeoBody] = useState(product?.seo_body ?? '');
  const [seoMagazine, setSeoMagazine] = useState<MagValue | null>(
    (product?.seo_magazine as MagValue) ?? null,
  );
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    (product?.faqs as Array<{ question: string; answer: string }>) ?? [],
  );
  const [occasions, setOccasions] = useState<Array<{ icon: string; title: string; tip: string; suggested: string }>>(
    (product?.occasions ?? []).map((o) => ({
      icon: o.icon ?? '',
      title: o.title ?? '',
      tip: o.tip ?? '',
      suggested: o.suggested ?? '',
    })),
  );
  const [processSteps, setProcessSteps] = useState<Array<{ title: string; time: string; desc: string }>>(
    (product?.process_steps as Array<{ title: string; time: string; desc: string }>) ?? [],
  );

  const [mockupUrl, setMockupUrl] = useState(product?.mockup_url ?? '');
  const [mockupArea, setMockupArea] = useState<{ x: number; y: number; width: number; height: number }>(
    (product?.mockup_area as any) ?? { x: 20, y: 20, width: 60, height: 60 }
  );

  const [assignedTemplates, setAssignedTemplates] = useState<string[]>(assignedTemplateIds);

  const [sizes, setSizes] = useState<GiftSize[]>((product?.sizes ?? []) as GiftSize[]);

  const [shapePickerEnabled, setShapePickerEnabled] = useState<boolean>(
    Array.isArray(product?.shape_options) && (product!.shape_options!.length ?? 0) > 0,
  );
  const [shapeOptions, setShapeOptions] = useState<ShapeOption[]>(
    (product?.shape_options ?? []) as ShapeOption[],
  );

  const [figurinePickerEnabled, setFigurinePickerEnabled] = useState<boolean>(
    Array.isArray(product?.figurine_options) && (product!.figurine_options!.length ?? 0) > 0,
  );
  const [figurineOptions, setFigurineOptions] = useState<FigurineOption[]>(
    (product?.figurine_options ?? []) as FigurineOption[],
  );
  const [figurineArea, setFigurineArea] = useState<FigurineArea>(
    (product?.figurine_area as FigurineArea) ?? { x: 10, y: 60, width: 25, height: 30 },
  );

  const [showTextStep, setShowTextStep] = useState<boolean | null>(product?.show_text_step ?? null);
  const [extraTextZones, setExtraTextZones] = useState<Array<{ id: string; label: string; max_chars: string }>>(
    (product?.extra_text_zones ?? []).map((z) => ({
      id: z.id,
      label: z.label,
      max_chars: z.max_chars != null ? String(z.max_chars) : '',
    })),
  );

  function autoSlugFromName() {
    setSlug(slugify(name).slice(0, 60));
  }

  async function save() {
    setErr(null);
    if (!name.trim() || !slug.trim()) {
      setErr('Name and slug are required');
      return;
    }
    const payload: any = {
      slug: slug.trim(),
      name: name.trim(),
      category_id: categoryId || null,
      description: description.trim() || null,
      tagline: tagline.trim() || null,
      // Auto-derive thumbnail: explicit value wins, else fall back to
      // the product mockup shot. Variants can't be read here (client
      // component) — variant-level fallback kicks in server-side via
      // resolveGiftThumbnail() in the admin action.
      thumbnail_url: thumbnail || mockupUrl || null,
      width_mm: parseFloat(widthMm) || 100,
      height_mm: parseFloat(heightMm) || 100,
      bleed_mm: parseFloat(bleedMm) || 0,
      safe_zone_mm: parseFloat(safeZoneMm) || 0,
      min_source_px: parseInt(minSourcePx, 10) || 1200,
      template_mode: templateMode,
      base_price_cents: Math.round((parseFloat(basePrice) || 0) * 100),
      price_tiers: priceTiers
        .filter((t) => t.qty && t.price)
        .map((t) => ({ qty: parseInt(t.qty, 10), price_cents: Math.round((parseFloat(t.price) || 0) * 100) })),
      seo_title: seoTitle.trim() || null,
      seo_desc: seoDesc.trim() || null,
      seo_body: seoBody.trim() || null,
      seo_magazine: seoMagazine,
      faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()).length > 0
        ? faqs.filter((f) => f.question.trim() && f.answer.trim())
        : null,
      occasions: occasions.filter((o) => o.title.trim() && o.tip.trim()).length > 0
        ? occasions
            .filter((o) => o.title.trim() && o.tip.trim())
            .map((o) => ({
              icon: o.icon.trim() || '★',
              title: o.title.trim(),
              tip: o.tip.trim(),
              ...(o.suggested.trim() ? { suggested: o.suggested.trim() } : {}),
            }))
        : null,
      process_steps: processSteps.filter((s) => s.title.trim() && s.desc.trim()).length > 0
        ? processSteps
            .filter((s) => s.title.trim() && s.desc.trim())
            .map((s) => ({ title: s.title.trim(), time: s.time.trim(), desc: s.desc.trim() }))
        : null,
      is_active: isActive,
      show_text_step: showTextStep,
      extra_text_zones: extraTextZones
        .filter((z) => z.id.trim() && z.label.trim())
        .map((z) => ({
          id: z.id.trim(),
          label: z.label.trim(),
          max_chars: z.max_chars.trim() ? parseInt(z.max_chars, 10) || null : null,
        })),
      mockup_url: mockupUrl || null,
      // mockup_area is a NOT NULL column at the DB level, so always send
      // the current value. When there's no mockup URL the coordinates
      // are ignored anyway — we keep them parked at the default.
      mockup_area: mockupArea,
      pipeline_id: pipelineId || null,
      secondary_pipeline_id: secondaryMode ? (secondaryPipelineId || null) : null,
      prompt_ids: promptIds.length > 0 ? promptIds : null,
      source_retention_days: Math.max(1, parseInt(retentionDays, 10) || 30),
      lead_time_days: Math.max(1, parseInt(leadTimeDays, 10) || 5),
      allowed_fonts: allowedFonts.map((f) => f.trim()).filter(Boolean),
      sizes: sizes
        .map((s, i) => ({ ...s, display_order: i }))
        .filter((s) => s.slug && s.name && s.width_mm > 0 && s.height_mm > 0),
      shape_options: shapePickerEnabled && shapeOptions.length > 0 ? shapeOptions : null,
      figurine_options: figurinePickerEnabled && figurineOptions.filter((o) => o.slug && o.name && o.image_url).length > 0
        ? figurineOptions.filter((o) => o.slug && o.name && o.image_url)
        : null,
      figurine_area: figurinePickerEnabled && figurineOptions.length > 0 ? figurineArea : null,
    };
    if (!modeLocked) payload.mode = mode;
    payload.secondary_mode = secondaryMode;

    startTransition(async () => {
      if (product) {
        const r = await updateGiftProduct(product.id, payload);
        if (!r.ok) { setErr(r.error); return; }
        // Save templates
        await setProductTemplates(product.id, assignedTemplates);
        // Save every variant row — the per-row Save button is gone,
        // so the main Save is the only way variants get persisted.
        const variantsOk = await variantsRef.current?.saveAll();
        if (variantsOk === false) {
          // Error already surfaced inside the panel; bail out of flash.
          return;
        }
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1600);
      } else {
        const r = await createGiftProduct({ ...payload, mode, secondary_mode: secondaryMode });
        if (!r.ok) { setErr(r.error); return; }
        if (assignedTemplates.length > 0) {
          await setProductTemplates(r.id, assignedTemplates);
        }
        router.push(`/admin/gifts/${r.id}`);
      }
    });
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm('Delete this gift product? This cannot be undone.')) return;
    startTransition(async () => {
      const r = await deleteGiftProduct(product.id);
      if (!r.ok) setErr(r.error);
      else router.push('/admin/gifts');
    });
  }

  const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
  const topCats = categories.filter((c) => !c.parent_id);

  const TABS: Array<{ v: Tab; label: string; hide?: boolean }> = [
    { v: 'basics', label: 'Basics' },
    { v: 'production', label: 'Production' },
    { v: 'design', label: `Design${variants.length + sizes.length > 0 ? ` (${variants.length} variants · ${sizes.length} sizes)` : ''}` },
    { v: 'content', label: `Content${faqs.length > 0 ? ` (${faqs.length})` : ''}` },
  ];
  const visibleTabs = TABS.filter((t) => !t.hide);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/admin/gifts" className="text-sm font-bold text-neutral-500 hover:text-ink">← Back</Link>
        <div className="text-sm font-bold text-ink">{product ? 'Edit gift product' : 'New gift product'}</div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {visibleTabs.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`rounded-t px-4 py-2 text-xs font-bold transition-colors ${
              tab === t.v ? 'bg-ink text-white' : 'text-neutral-600 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Basics */}
      {tab === 'basics' && (
        <div className="max-w-4xl space-y-5">
          {/* Identity */}
          <div className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6">
            <div className="text-sm font-black text-ink">Identity</div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !slug && autoSlugFromName()} className={inputCls} placeholder="Wood Keychain" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Slug</span>
                <div className="flex items-center">
                  <span className="rounded-l border-2 border-r-0 border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 font-mono">/gift/</span>
                  <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className={`${inputCls} rounded-l-none font-mono text-xs`} />
                </div>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Category</span>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                  <option value="">— none —</option>
                  {topCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span className="font-semibold text-ink">Active (visible to customers)</span>
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Tagline</span>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} placeholder="One photo, one keepsake" />
            </label>
          </div>

          {/* Pricing */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 text-sm font-black text-ink">Pricing</div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Base price (S$)</span>
              <input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className={`${inputCls} max-w-[200px]`} />
              {variants.length > 0 ? (
                <span className="mt-1 block text-[11px] text-neutral-500">
                  Customers pay their selected <strong>variant&apos;s</strong> price plus any size delta. Leave <code>0</code> to auto-use the lowest variant price on catalog tiles; set non-zero to force-override the &ldquo;from $X&rdquo; display.
                </span>
              ) : (
                <span className="mt-1 block text-[11px] text-neutral-500">Single-unit price if no volume tier applies.</span>
              )}
            </label>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-ink">Volume tiers (optional)</div>
                  <div className="text-[11px] text-neutral-500">Cheaper per-unit price in bulk.</div>
                </div>
                <button type="button" onClick={() => setPriceTiers([...priceTiers, { qty: '', price: '' }])} className="inline-flex items-center gap-1 rounded-full bg-pink px-3 py-1.5 text-[11px] font-bold text-white hover:bg-pink-dark">
                  <Plus size={12} /> Add tier
                </button>
              </div>
              {priceTiers.length === 0 ? (
                <div className="rounded border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500">
                  No tiers — all orders use the base price.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_36px] gap-2 text-[10px] font-bold uppercase text-neutral-500">
                    <div>From qty</div>
                    <div>Price per unit (S$)</div>
                    <div />
                  </div>
                  {priceTiers.map((t, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
                      <input type="number" value={t.qty} onChange={(e) => setPriceTiers(priceTiers.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} className={inputCls} placeholder="10" />
                      <input type="number" step="0.01" value={t.price} onChange={(e) => setPriceTiers(priceTiers.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className={inputCls} placeholder="18.00" />
                      <button type="button" onClick={() => setPriceTiers(priceTiers.filter((_, j) => j !== i))} className="justify-self-center text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEO meta */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 text-sm font-black text-ink">Search snippet</div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">SEO title</span>
                <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">SEO description</span>
                <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} className={inputCls} />
              </label>
            </div>
          </div>
        </div>
      )}

      {tab === 'production' && (
        <div className="max-w-4xl space-y-4">
          {modeLocked && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              🔒 <strong>Mode is locked</strong> because this product has already been ordered. Changing the mode would invalidate past production files.
            </div>
          )}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink">Primary processing mode</div>
                <div className="text-[11px] text-neutral-500">The default for the whole product. Surfaces and templates inherit this unless they specify otherwise.</div>
              </div>
              <Link href="/admin/gifts/modes" className="text-[11px] text-pink underline hover:text-pink-dark">
                Manage modes →
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {MODE_OPTIONS.map((m) => {
                const active = mode === m.slug;
                return (
                  <button
                    key={m.slug}
                    type="button"
                    disabled={modeLocked}
                    onClick={() => {
                      setMode(m.slug);
                      // If the user flips primary to the current secondary,
                      // clear secondary to keep the two distinct.
                      if (m.slug === secondaryMode) setSecondaryMode(null);
                    }}
                    className={`rounded-lg border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      active ? 'border-pink bg-pink/5' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="mb-1 font-bold text-ink">{m.label}</div>
                    <div className="text-[11px] leading-relaxed text-neutral-600">{m.description ?? ''}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink">Secondary processing mode (optional)</div>
                <div className="text-[11px] text-neutral-500">
                  For products that combine two methods — e.g. acrylic wall art with a UV-printed photo + laser-engraved border. A product can have up to 2 modes. Leave empty for single-mode products.
                </div>
              </div>
              {secondaryMode && (
                <button
                  type="button"
                  onClick={() => setSecondaryMode(null)}
                  className="text-[11px] font-bold text-neutral-500 underline hover:text-ink"
                >
                  Clear secondary
                </button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {MODE_OPTIONS.map((m) => {
                const isPrimary = mode === m.slug;
                const active = secondaryMode === m.slug;
                return (
                  <button
                    key={m.slug}
                    type="button"
                    disabled={isPrimary}
                    onClick={() => setSecondaryMode(active ? null : m.slug)}
                    className={`rounded-lg border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      active ? 'border-pink bg-pink/5' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                    title={isPrimary ? 'Already the primary mode' : undefined}
                  >
                    <div className="mb-1 font-bold text-ink">
                      {m.label}
                      {isPrimary && <span className="ml-2 text-[10px] font-normal text-neutral-400">(primary)</span>}
                    </div>
                    <div className="text-[11px] leading-relaxed text-neutral-600">{m.description ?? ''}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legacy "Add text" step toggle */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 text-sm font-black text-ink">Customer PDP options</div>
            <div className="space-y-1 max-w-xs">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Legacy &ldquo;Add text&rdquo; step on PDP
              </label>
              <select
                value={showTextStep === null ? 'auto' : showTextStep ? 'on' : 'off'}
                onChange={(e) => {
                  const v = e.target.value;
                  setShowTextStep(v === 'auto' ? null : v === 'on');
                }}
                className={inputCls}
              >
                <option value="auto">Auto (laser/UV &rarr; on)</option>
                <option value="on">Force on</option>
                <option value="off">Force off</option>
              </select>
              <div className="text-[10px] text-neutral-400">
                Auto follows the product mode. Force off when surfaces handle all text inputs.
              </div>
            </div>

            {/* Extra text zones — adds N simple text fields to the PDP without
                needing a zones-based template. Useful for jewellery: front +
                back engraving, or "name" + "date" pairs. */}
            <div className="mt-6 border-t border-neutral-200 pt-5">
              <div className="mb-1 text-sm font-black text-ink">Extra text fields</div>
              <div className="mb-3 max-w-2xl text-xs text-neutral-600">
                Add one or more simple text inputs to the PDP — no template needed. Use for jewellery
                (front / back engraving), pet tags (name + phone), or any product where you just want
                to capture a couple of strings cleanly. Cart notes carry each field as
                <span className="font-mono"> text_&lt;id&gt;:&lt;value&gt;</span>.
              </div>
              <div className="space-y-2">
                {extraTextZones.map((z, i) => (
                  <div key={i} className="flex flex-wrap items-end gap-2 rounded border-2 border-neutral-200 bg-neutral-50 p-2">
                    <label className="block">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">ID (cart key)</span>
                      <input
                        value={z.id}
                        onChange={(e) => {
                          const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40);
                          setExtraTextZones((prev) => prev.map((x, idx) => idx === i ? { ...x, id: v } : x));
                        }}
                        placeholder="front"
                        className="w-32 rounded border-2 border-ink px-2 py-1 font-mono text-xs"
                      />
                    </label>
                    <label className="block flex-1 min-w-[140px]">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Label (shown to customer)</span>
                      <input
                        value={z.label}
                        onChange={(e) => {
                          const v = e.target.value.slice(0, 60);
                          setExtraTextZones((prev) => prev.map((x, idx) => idx === i ? { ...x, label: v } : x));
                        }}
                        placeholder="Front engraving"
                        className="w-full rounded border-2 border-ink px-2 py-1 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Max chars (optional)</span>
                      <input
                        type="number"
                        value={z.max_chars}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExtraTextZones((prev) => prev.map((x, idx) => idx === i ? { ...x, max_chars: v } : x));
                        }}
                        placeholder="e.g. 18"
                        className="w-24 rounded border-2 border-ink px-2 py-1 font-mono text-xs"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setExtraTextZones((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded border-2 border-ink px-2 py-1 text-xs hover:bg-red-100"
                      title="Remove this field"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setExtraTextZones((prev) => [...prev, { id: '', label: '', max_chars: '' }])}
                  className="inline-flex items-center gap-1 rounded border-2 border-ink bg-yellow-brand px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-white"
                >
                  <Plus size={12} /> Add text field
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <div className="block">
                <span className="mb-1 block text-xs font-bold text-ink">
                  Production pipeline overrides
                </span>
                <div className="space-y-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
                      Primary: {GIFT_MODE_LABEL[mode]}
                    </span>
                    <select value={pipelineId} onChange={(e) => setPipelineId(e.target.value)} className={inputCls}>
                      <option value="">Use mode default ({mode})</option>
                      {pipelines.filter((p) => p.kind === mode).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                  {secondaryMode && (
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">
                        Secondary: {GIFT_MODE_LABEL[secondaryMode]}
                      </span>
                      <select
                        value={secondaryPipelineId}
                        onChange={(e) => setSecondaryPipelineId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Use mode default ({secondaryMode})</option>
                        {pipelines.filter((p) => p.kind === secondaryMode).map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <span className="mt-2 block text-[11px] text-neutral-500">
                  Each override picks a specific transform for that mode's surfaces on this product.
                  Leave on default to use whatever pipeline is marked default at the mode level.{' '}
                  <Link href="/admin/gifts/pipelines" className="underline">Manage pipelines →</Link>
                </span>

                {allCandidatePrompts.length > 0 && (
                  <div className="mt-4 border-t border-neutral-100 pt-3">
                    <span className="mb-1 block text-xs font-bold text-ink">Art-style allowlist</span>
                    <p className="mb-2 text-[11px] text-neutral-500">
                      Tick the prompts the customer can pick on this product. Leave all unticked to
                      offer every prompt that matches the product&apos;s mode (the default).
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {allCandidatePrompts.map((p) => {
                        const checked = promptIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex cursor-pointer items-center gap-2 rounded border-2 p-2 text-xs ${
                              checked ? 'border-pink bg-pink/5' : 'border-neutral-200 bg-white hover:border-neutral-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setPromptIds((prev) =>
                                  prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                                );
                              }}
                            />
                            {p.thumbnail_url ? (
                              <img
                                src={p.thumbnail_url}
                                alt=""
                                className="h-8 w-8 flex-shrink-0 rounded border border-neutral-200 object-cover"
                              />
                            ) : (
                              <span
                                aria-hidden
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-base"
                              >
                                ✨
                              </span>
                            )}
                            <span className="flex-1 truncate">
                              <span className="block font-bold text-ink">{p.name}</span>
                              <span className="block text-[10px] uppercase tracking-wide text-neutral-500">{p.mode}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {promptIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPromptIds([])}
                        className="mt-2 text-[11px] font-bold uppercase tracking-wide text-pink hover:underline"
                      >
                        Reset to all
                      </button>
                    )}
                  </div>
                )}
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Turnaround (Ready-by calendar)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(e.target.value)}
                    className={`${inputCls} max-w-[120px]`}
                  />
                  <span className="text-xs text-neutral-600">business days</span>
                </div>
                <span className="mt-1 block text-[11px] text-neutral-500">
                  Drives the Ready-by calendar card customers see. Weekends are skipped automatically; SG public holidays are not — pad a day or two if a holiday window matters.
                </span>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Delete uploads + production after</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    className={`${inputCls} max-w-[120px]`}
                  />
                  <span className="text-xs text-neutral-600">days</span>
                </div>
                <span className="mt-1 block text-[11px] text-neutral-500">
                  After this many days the customer&apos;s uploaded photo and the 300 DPI production file are purged. The watermarked preview stays.
                </span>
              </label>
            </div>
          </div>

          {(() => {
            // Only AI modes carry transform prompts. Non-AI modes
            // (photo-resize, eco-solvent, digital, uv-dtf) just do
            // pass-through rendering so there's nothing to prompt for.
            const AI_MODES: GiftMode[] = ['laser', 'uv', 'embroidery'];
            const productModes = [mode, ...(secondaryMode ? [secondaryMode] : [])];
            const promptable = productModes.filter((m) => AI_MODES.includes(m));
            if (promptable.length === 0) return null;
            return (
              <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <div className="mb-1 text-xs font-bold text-ink">Transformation prompts</div>
                <p className="mb-3 text-[11px] text-neutral-500">
                  Prompts live at the <strong>mode level</strong> (with optional per-pipeline override). Customers always see a <strong>Line Art</strong> and <strong>Realistic</strong> picker; admin fills the prompt text for each.
                  {promptable.length > 1 && (
                    <> Dual-mode product — manage prompts for each mode separately.</>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {promptable.map((m) => (
                    <Link
                      key={m}
                      href={`/admin/gifts/prompts?mode=${m}`}
                      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs font-bold text-ink hover:border-ink"
                    >
                      Manage {GIFT_MODE_LABEL[m]} prompts →
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Dimensions — merged in from the old Production tab */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 text-sm font-black text-ink">Dimensions & output</div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Default width (mm)</span>
                <input type="number" step="0.1" value={widthMm} onChange={(e) => setWidthMm(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Default height (mm)</span>
                <input type="number" step="0.1" value={heightMm} onChange={(e) => setHeightMm(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Bleed (mm)</span>
                <input type="number" step="0.1" value={bleedMm} onChange={(e) => setBleedMm(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Safe zone (mm)</span>
                <input type="number" step="0.1" value={safeZoneMm} onChange={(e) => setSafeZoneMm(e.target.value)} className={inputCls} />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-bold text-ink">Minimum source resolution (px, long edge)</span>
                <input type="number" value={minSourcePx} onChange={(e) => setMinSourcePx(e.target.value)} className={inputCls} />
                <span className="mt-1 block text-[11px] text-neutral-500">Customer photos smaller than this trigger a warning at upload.</span>
              </label>
            </div>
            <div className="mt-3 rounded border border-neutral-200 bg-neutral-50 p-3 text-[11px] text-neutral-600">
              <strong>Recommended:</strong> bleed <strong>2 mm</strong>, safe zone <strong>3 mm</strong>, minimum source <strong>{Math.ceil((Math.max(parseFloat(widthMm), parseFloat(heightMm)) / 25.4) * 300)} px</strong> for 300 DPI at your current dimensions. Sizes under the <strong>Design</strong> tab override these per chosen size.
            </div>
          </div>
        </div>
      )}

      {/* Design tab — variants, sizes, templates, fallback mockup */}
      {tab === 'design' && (
        <div className="max-w-4xl space-y-6">
          {/* Template mode selector — only shown when templates are relevant */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 text-sm font-black text-ink">Template mode</div>
            <p className="mb-3 text-[11px] text-neutral-500">
              Templates are pre-designed layouts the customer&apos;s photo drops into.
            </p>
            <div className="grid gap-2 md:grid-cols-3">
              {[
                { v: 'none' as const, label: 'No templates', desc: 'Customer uploads and configures directly' },
                { v: 'optional' as const, label: 'Optional', desc: 'Customer can pick a template OR upload' },
                { v: 'required' as const, label: 'Required', desc: 'Customer MUST start from a template' },
              ].map((t) => {
                const active = templateMode === t.v;
                return (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => setTemplateMode(t.v)}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      active ? 'border-ink bg-ink/5' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="text-sm font-bold text-ink">{t.label}</div>
                    <div className="mt-0.5 text-[11px] text-neutral-600">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variants (tiles with mockups) */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-ink">Variants</div>
                <div className="text-[11px] text-neutral-500">Mockup tiles the customer picks between. Each variant is photographed in one base/material/colour.</div>
              </div>
            </div>
            {product ? (
              <GiftVariantsPanel
                ref={variantsRef}
                giftProductId={product.id}
                initialVariants={variants}
                allowedModes={secondaryMode ? [mode, secondaryMode] : [mode]}
                productWidthMm={parseFloat(widthMm) || product.width_mm}
                productHeightMm={parseFloat(heightMm) || product.height_mm}
                parentShapeOptions={shapePickerEnabled && shapeOptions.length > 0 ? shapeOptions : null}
                parentPrompts={parentPrompts}
                productSizes={sizes}
                // First assigned template that uses a code-driven
                // renderer (city_map / star_map). The variant editor
                // uses it to lock the mockup-area rectangle's aspect
                // and overlay the renderer's actual output inside.
                linkedRendererTemplate={
                  allTemplates.find(
                    (t) =>
                      assignedTemplates.includes(t.id) &&
                      (t as { renderer?: string }).renderer &&
                      (t as { renderer?: string }).renderer !== 'zones',
                  ) ?? null
                }
              />
            ) : (
              <div className="rounded border border-dashed p-8 text-center text-sm text-neutral-500">Save this product first, then variants can be added.</div>
            )}
          </div>

          {/* Sizes (product-wide, shared across variants) */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-black text-ink">Sizes</div>
                <div className="mt-1 text-xs text-neutral-500">
                  Product-level size options. Every variant above is available in every size. Leave empty if the product has a single fixed size.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSizes([...sizes, { slug: '', name: '', width_mm: parseFloat(widthMm) || 100, height_mm: parseFloat(heightMm) || 100, price_delta_cents: 0, display_order: sizes.length }])}
                className="inline-flex items-center gap-1 rounded-full bg-pink px-3 py-1.5 text-[11px] font-bold text-white hover:bg-pink-dark"
              >
                <Plus size={12} /> Add size
              </button>
            </div>
            <div className="mt-4">
              {sizes.length === 0 ? (
                <div className="rounded border border-dashed border-neutral-300 p-8 text-center text-xs text-neutral-500">
                  No sizes yet. Use the quick-add buttons below or click <strong>+ Add size</strong>.
                </div>
              ) : (
                <div className="space-y-2">
                  {sizes.map((s, i) => (
                    <div key={i} className="grid grid-cols-[1fr_90px_90px_110px_40px] items-end gap-2 rounded border border-neutral-200 bg-neutral-50 p-3">
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">Name</span>
                        <input
                          value={s.name}
                          onChange={(e) => {
                            // Auto-derive the slug from the name on every keystroke.
                            // Slug is an internal stable key (used by the cart line +
                            // saved drafts) — never appears in URLs — so the admin
                            // shouldn't have to manage it.
                            const name = e.target.value;
                            const next = [...sizes];
                            next[i] = { ...s, name, slug: slugify(name).slice(0, 40) };
                            setSizes(next);
                          }}
                          placeholder="A4 portrait"
                          className={inputCls}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">W (mm)</span>
                        <input type="number" min={1} step={0.1} value={s.width_mm}
                          onChange={(e) => { const next = [...sizes]; next[i] = { ...s, width_mm: parseFloat(e.target.value) || 0 }; setSizes(next); }}
                          className={inputCls} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">H (mm)</span>
                        <input type="number" min={1} step={0.1} value={s.height_mm}
                          onChange={(e) => { const next = [...sizes]; next[i] = { ...s, height_mm: parseFloat(e.target.value) || 0 }; setSizes(next); }}
                          className={inputCls} />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase text-neutral-500">+ Price (S$)</span>
                        <input type="number" min={0} step={0.01}
                          value={(s.price_delta_cents / 100).toFixed(2)}
                          onChange={(e) => { const next = [...sizes]; next[i] = { ...s, price_delta_cents: Math.round((parseFloat(e.target.value) || 0) * 100) }; setSizes(next); }}
                          className={inputCls} />
                      </label>
                      <button type="button" onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
                        className="flex h-9 w-9 items-center justify-center rounded text-red-600 hover:bg-red-50" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                <span className="mr-1 text-neutral-500">Quick add:</span>
                {[
                  { label: 'A4 portrait', w: 210, h: 297 },
                  { label: 'A5 portrait', w: 148, h: 210 },
                  { label: 'A6 portrait', w: 105, h: 148 },
                  { label: 'A4 landscape', w: 297, h: 210 },
                  { label: 'A5 landscape', w: 210, h: 148 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      const slug = slugify(p.label);
                      setSizes([...sizes, { slug, name: p.label, width_mm: p.w, height_mm: p.h, price_delta_cents: 0, display_order: sizes.length }]);
                    }}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 font-bold text-neutral-700 hover:border-ink"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Allowed fonts — customer picks from this list when adding text */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-black text-ink">Fonts customer can pick from</div>
                <div className="mt-1 text-xs text-neutral-500">
                  Google-Fonts family names (exact spelling). Customer sees a dropdown on the product page when adding text. Leave empty to hide the font picker.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllowedFonts([...allowedFonts, ''])}
                className="inline-flex items-center gap-1 rounded-full bg-pink px-3 py-1.5 text-[11px] font-bold text-white hover:bg-pink-dark"
              >
                <Plus size={12} /> Add font
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {allowedFonts.length === 0 ? (
                <div className="rounded border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500">
                  No fonts — customer can&apos;t add text. Use the suggestions below or click <strong>+ Add font</strong>.
                </div>
              ) : (
                allowedFonts.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={f}
                      onChange={(e) => {
                        const next = [...allowedFonts]; next[i] = e.target.value; setAllowedFonts(next);
                      }}
                      placeholder="e.g. Playfair Display"
                      className={`${inputCls} flex-1`}
                      style={{ fontFamily: f || undefined }}
                    />
                    <button
                      type="button"
                      onClick={() => setAllowedFonts(allowedFonts.filter((_, j) => j !== i))}
                      className="flex h-9 w-9 items-center justify-center rounded text-red-600 hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
              <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                <span className="mr-1 text-neutral-500">Quick add:</span>
                {['Archivo', 'Fraunces', 'Playfair Display', 'Dancing Script', 'Bebas Neue', 'Montserrat', 'Lora', 'Caveat', 'Great Vibes'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      if (!allowedFonts.includes(name)) setAllowedFonts([...allowedFonts, name]);
                    }}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 font-bold text-neutral-700 hover:border-ink"
                    style={{ fontFamily: name }}
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Templates assignment — only when template mode != none */}
          {templateMode !== 'none' && (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-ink">Assigned templates</div>
                  <div className="text-[11px] text-neutral-500">Pre-designed layouts customers can pick from.</div>
                </div>
                <Link href="/admin/gifts/templates/new" className="text-[11px] font-bold text-pink hover:underline">
                  + Create new template
                </Link>
              </div>
              {allTemplates.length === 0 ? (
                <div className="rounded border border-dashed border-neutral-300 p-8 text-center text-xs text-neutral-500">
                  No templates exist yet. <Link href="/admin/gifts/templates/new" className="font-bold text-pink">Create one</Link> then come back.
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {allTemplates.map((t) => {
                    const active = assignedTemplates.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAssignedTemplates(active ? assignedTemplates.filter((id) => id !== t.id) : [...assignedTemplates, t.id])}
                        className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                          active ? 'border-pink bg-pink/5' : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                          {t.thumbnail_url ? (
                            <img src={t.thumbnail_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">🎨</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-ink truncate">{t.name}</div>
                          <div className="text-[11px] text-neutral-500 truncate">{t.description || '—'}</div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 ${active ? 'border-pink bg-pink' : 'border-neutral-300'} flex items-center justify-center`}>
                          {active && <span className="text-[10px] text-white">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Fallback mockup — only relevant when no variant mockups cover it */}
          {(() => {
            const variantsWithMockup = variants.filter((v) => v.mockup_url).length;
            const allCovered = variants.length > 0 && variantsWithMockup === variants.length;
            if (allCovered) return null;
            return (
              <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <div className="mb-3">
                  <div className="text-sm font-black text-ink">Fallback mockup</div>
                  <div className="text-[11px] text-neutral-500">
                    Used for any variant that doesn&apos;t carry its own mockup. Disappears automatically once every variant has a mockup assigned.
                  </div>
                </div>
                <GiftMockupEditor
                  mockupUrl={mockupUrl}
                  setMockupUrl={setMockupUrl}
                  area={mockupArea}
                  setArea={setMockupArea}
                  slug={slug}
                />
              </div>
            );
          })()}

          {/* Customer-pickable shape options (cutout / rectangle / template).
              Lives at the bottom of Design so the admin has already seen the
              variants + template list above before deciding what to expose. */}
          <GiftShapeOptionsEditor
            enabled={shapePickerEnabled}
            onEnabledChange={setShapePickerEnabled}
            value={shapeOptions}
            onChange={setShapeOptions}
            allTemplates={allTemplates}
          />

          {/* Figurine overlay picker — used by the Figurine Photo Frame.
              Each option is a transparent PNG composited onto the mockup
              at figurine_area. Default off; only turn on for products
              with a dedicated figurine slot on the mockup. */}
          <GiftFigurineOptionsEditor
            enabled={figurinePickerEnabled}
            onEnabledChange={setFigurinePickerEnabled}
            value={figurineOptions}
            onChange={setFigurineOptions}
            area={figurineArea}
            onAreaChange={setFigurineArea}
            productSlug={slug || 'new-product'}
            mockupUrl={mockupUrl || variants.find((v) => v.mockup_url)?.mockup_url || null}
            productWidthMm={parseFloat(widthMm) || product?.width_mm || 100}
            productHeightMm={parseFloat(heightMm) || product?.height_mm || 100}
          />
        </div>
      )}


      {/* Content — long-form page sections: 2-line SEO body, magazine, FAQs */}
      {tab === 'content' && (
        <div className="max-w-4xl space-y-6">
          {/* Short keyword footer */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3">
              <div className="text-sm font-black text-ink">SEO footer paragraph</div>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Short, keyword-heavy — the grey mono paragraph at the bottom of the product page. 2 lines max.
                Leave blank to fall back to the mode-based default.
              </p>
            </div>
            <textarea
              value={seoBody}
              onChange={(e) => setSeoBody(e.target.value)}
              rows={3}
              placeholder="Custom LED photo base printing Singapore — laser-engraved acrylic, warm LED wood base, personalised photo gift. Ships in 5 days, islandwide delivery."
              className={inputCls}
            />
          </div>

          {/* SEO Magazine — reuses services-side editor */}
          <MagazineEditor value={seoMagazine} onChange={setSeoMagazine} />

          {/* Per-gift FAQs */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black text-ink">FAQs — Common questions</div>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  Rendered as an expandable accordion on the product page. Leave empty to use
                  the mode-based default set.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
                className="inline-flex items-center gap-1 rounded border-2 border-ink bg-white px-3 py-1.5 text-[11px] font-bold text-ink transition-all hover:bg-yellow"
              >
                <Plus size={12} /> Add FAQ
              </button>
            </div>
            {faqs.length === 0 ? (
              <p className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-xs text-neutral-500">
                No FAQs yet — using mode-based defaults. Click &quot;Add FAQ&quot; to override.
              </p>
            ) : (
              <div className="space-y-3">
                {faqs.map((f, i) => (
                  <div key={i} className="rounded border border-neutral-200 bg-neutral-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                        FAQ {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                        className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                    <label className="mb-2 block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Question
                      </span>
                      <input
                        value={f.question}
                        onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                        className={inputCls}
                        placeholder="e.g. How long does the LED battery last?"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Answer
                      </span>
                      <textarea
                        value={f.answer}
                        onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
                        rows={3}
                        className={inputCls}
                        placeholder="About 8 hours on a single AA battery. USB-C cable also included for always-on display."
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Who's it for? — per-product occasion matcher */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black text-ink">Who&apos;s it for? — occasion cards</div>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  The "Who&apos;s it for?" band on the product page. Leave empty to fall back to the
                  generic gift-occasion defaults.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOccasions([...occasions, { icon: '★', title: '', tip: '', suggested: '' }])}
                className="inline-flex items-center gap-1 rounded border-2 border-ink bg-white px-3 py-1.5 text-[11px] font-bold text-ink transition-all hover:bg-yellow"
              >
                <Plus size={12} /> Add occasion
              </button>
            </div>
            {occasions.length === 0 ? (
              <p className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-xs text-neutral-500">
                No occasions yet — using generic defaults. Click &quot;Add occasion&quot; to override.
              </p>
            ) : (
              <div className="space-y-3">
                {occasions.map((o, i) => (
                  <div key={i} className="rounded border border-neutral-200 bg-neutral-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                        Occasion {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOccasions(occasions.filter((_, j) => j !== i))}
                        className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[80px_1fr]">
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                          Icon
                        </span>
                        <input
                          value={o.icon}
                          onChange={(e) => setOccasions(occasions.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))}
                          className={inputCls}
                          placeholder="★"
                          maxLength={4}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                          Title
                        </span>
                        <input
                          value={o.title}
                          onChange={(e) => setOccasions(occasions.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                          className={inputCls}
                          placeholder="Housewarming"
                        />
                      </label>
                    </div>
                    <label className="mt-2 block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Tip (HTML &lt;b&gt; allowed)
                      </span>
                      <textarea
                        value={o.tip}
                        onChange={(e) => setOccasions(occasions.map((x, j) => (j === i ? { ...x, tip: e.target.value } : x)))}
                        rows={2}
                        className={inputCls}
                        placeholder="A photo of <b>the new place</b> — the garden, the front door, the view from the window."
                      />
                    </label>
                    <label className="mt-2 block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Suggested (optional — small footer line)
                      </span>
                      <input
                        value={o.suggested}
                        onChange={(e) => setOccasions(occasions.map((x, j) => (j === i ? { ...x, suggested: e.target.value } : x)))}
                        className={inputCls}
                        placeholder="Line art · Wood base"
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it works — per-product process steps */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black text-ink">How it works — process steps</div>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  The "From your photo to a finished piece" band. Leave empty to use the mode-based
                  defaults. Don&apos;t invent operational facts (locations, exact hours) — keep copy
                  honest to what the product actually ships.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProcessSteps([...processSteps, { title: '', time: '', desc: '' }])}
                className="inline-flex items-center gap-1 rounded border-2 border-ink bg-white px-3 py-1.5 text-[11px] font-bold text-ink transition-all hover:bg-yellow"
              >
                <Plus size={12} /> Add step
              </button>
            </div>
            {processSteps.length === 0 ? (
              <p className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-xs text-neutral-500">
                No steps yet — using mode-based defaults. Click &quot;Add step&quot; to override.
              </p>
            ) : (
              <div className="space-y-3">
                {processSteps.map((s, i) => (
                  <div key={i} className="rounded border border-neutral-200 bg-neutral-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                        Step {String(i + 1).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setProcessSteps(processSteps.filter((_, j) => j !== i))}
                        className="inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[1fr_180px]">
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                          Title
                        </span>
                        <input
                          value={s.title}
                          onChange={(e) => setProcessSteps(processSteps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                          className={inputCls}
                          placeholder="Upload &amp; Preview"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                          Time label (small yellow)
                        </span>
                        <input
                          value={s.time}
                          onChange={(e) => setProcessSteps(processSteps.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
                          className={inputCls}
                          placeholder="Free preview"
                        />
                      </label>
                    </div>
                    <label className="mt-2 block">
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                        Description
                      </span>
                      <textarea
                        value={s.desc}
                        onChange={(e) => setProcessSteps(processSteps.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
                        rows={2}
                        className={inputCls}
                        placeholder="Upload any clear photo. Pick a style. Live preview updates as you choose."
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-4 rounded-lg border-2 border-ink bg-white p-4 shadow-brand">
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          {err && <span className="font-bold text-red-600">{err}</span>}
          {savedFlash && <span className="font-bold text-green-600">✓ Saved</span>}
          {!err && !savedFlash && <span>Changes save when you click Save.</span>}
          {product && (
            <button onClick={handleDelete} disabled={isPending} className="ml-3 text-[11px] font-bold text-red-600 hover:underline">
              Delete
            </button>
          )}
        </div>
        <button
          onClick={save}
          disabled={isPending}
          className="rounded-full bg-pink px-6 py-2 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50"
        >
          {isPending ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </div>
  );
}
