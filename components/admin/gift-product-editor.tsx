'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus } from 'lucide-react';
import { createGiftProduct, updateGiftProduct, deleteGiftProduct, setProductTemplates } from '@/app/admin/gifts/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import { GIFT_MODE_LABEL, GIFT_MODE_DESCRIPTION } from '@/lib/gifts/types';
import type { GiftMode, GiftTemplateMode, GiftProduct, GiftTemplate } from '@/lib/gifts/types';

type Cat = { id: string; slug: string; name: string; parent_id: string | null };

type Props = {
  product: GiftProduct | null;
  categories: Cat[];
  allTemplates: GiftTemplate[];
  assignedTemplateIds: string[];
};

type Tab = 'basics' | 'mode' | 'ai' | 'pricing' | 'templates' | 'production' | 'seo';

const MODE_OPTIONS: Array<{ v: GiftMode; label: string; desc: string; emoji: string }> = [
  { v: 'laser', label: 'Laser', desc: GIFT_MODE_DESCRIPTION['laser'], emoji: '🔥' },
  { v: 'uv', label: 'UV Print', desc: GIFT_MODE_DESCRIPTION['uv'], emoji: '🎨' },
  { v: 'embroidery', label: 'Embroidery', desc: GIFT_MODE_DESCRIPTION['embroidery'], emoji: '🧵' },
  { v: 'photo-resize', label: 'Photo Resize', desc: GIFT_MODE_DESCRIPTION['photo-resize'], emoji: '✂️' },
];

export function GiftProductEditor({ product, categories, allTemplates, assignedTemplateIds }: Props) {
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
  const [templateMode, setTemplateMode] = useState<GiftTemplateMode>(product?.template_mode ?? 'none');
  const [modeLocked] = useState(!!product?.first_ordered_at);

  const [widthMm, setWidthMm] = useState(product?.width_mm.toString() ?? '100');
  const [heightMm, setHeightMm] = useState(product?.height_mm.toString() ?? '100');
  const [bleedMm, setBleedMm] = useState(product?.bleed_mm.toString() ?? '2');
  const [safeZoneMm, setSafeZoneMm] = useState(product?.safe_zone_mm.toString() ?? '3');
  const [minSourcePx, setMinSourcePx] = useState(product?.min_source_px.toString() ?? '1200');

  const [aiPrompt, setAiPrompt] = useState(product?.ai_prompt ?? '');
  const [aiNegative, setAiNegative] = useState(product?.ai_negative_prompt ?? '');
  const [colorProfile, setColorProfile] = useState(product?.color_profile ?? '');

  const [basePrice, setBasePrice] = useState(((product?.base_price_cents ?? 0) / 100).toFixed(2));
  const [priceTiers, setPriceTiers] = useState<Array<{ qty: string; price: string }>>(
    (product?.price_tiers ?? []).map((t) => ({ qty: String(t.qty), price: (t.price_cents / 100).toFixed(2) }))
  );

  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? '');
  const [seoDesc, setSeoDesc] = useState(product?.seo_desc ?? '');

  const [assignedTemplates, setAssignedTemplates] = useState<string[]>(assignedTemplateIds);

  function autoSlugFromName() {
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60));
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
      thumbnail_url: thumbnail || null,
      width_mm: parseFloat(widthMm) || 100,
      height_mm: parseFloat(heightMm) || 100,
      bleed_mm: parseFloat(bleedMm) || 0,
      safe_zone_mm: parseFloat(safeZoneMm) || 0,
      min_source_px: parseInt(minSourcePx, 10) || 1200,
      template_mode: templateMode,
      ai_prompt: aiPrompt.trim() || null,
      ai_negative_prompt: aiNegative.trim() || null,
      color_profile: colorProfile.trim() || null,
      base_price_cents: Math.round((parseFloat(basePrice) || 0) * 100),
      price_tiers: priceTiers
        .filter((t) => t.qty && t.price)
        .map((t) => ({ qty: parseInt(t.qty, 10), price_cents: Math.round((parseFloat(t.price) || 0) * 100) })),
      seo_title: seoTitle.trim() || null,
      seo_desc: seoDesc.trim() || null,
      is_active: isActive,
    };
    if (!modeLocked) payload.mode = mode;

    startTransition(async () => {
      if (product) {
        const r = await updateGiftProduct(product.id, payload);
        if (!r.ok) { setErr(r.error); return; }
        // Save templates too
        await setProductTemplates(product.id, assignedTemplates);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1600);
      } else {
        const r = await createGiftProduct({ ...payload, mode });
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
    { v: 'mode', label: 'Mode' },
    { v: 'ai', label: 'AI settings', hide: mode === 'photo-resize' },
    { v: 'pricing', label: 'Pricing' },
    { v: 'templates', label: 'Templates' },
    { v: 'production', label: 'Production' },
    { v: 'seo', label: 'SEO' },
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
        <div className="grid max-w-4xl gap-5 rounded-lg border border-neutral-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !slug && autoSlugFromName()} className={inputCls} placeholder="Wood Keychain" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Slug</span>
              <div className="flex items-center">
                <span className="rounded-l border-2 border-r-0 border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 font-mono">/gift/</span>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputCls} rounded-l-none font-mono text-xs`} />
              </div>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">Category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">— none —</option>
              {topCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">Tagline</span>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} placeholder="One photo, one keepsake" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls} />
          </label>
          <div>
            <span className="mb-1 block text-xs font-bold text-ink">Thumbnail</span>
            <ImageUpload value={thumbnail} onChange={setThumbnail} prefix={`gift-${slug || 'new'}`} aspect={1} size="md" label="Thumbnail" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="font-semibold text-ink">Active (visible to customers)</span>
          </label>
        </div>
      )}

      {/* Mode */}
      {tab === 'mode' && (
        <div className="max-w-4xl space-y-4">
          {modeLocked && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              🔒 <strong>Mode is locked</strong> because this product has already been ordered. Changing the mode would invalidate past production files.
            </div>
          )}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 text-xs font-bold text-ink">Processing mode</div>
            <div className="grid gap-3 md:grid-cols-2">
              {MODE_OPTIONS.map((m) => {
                const active = mode === m.v;
                return (
                  <button
                    key={m.v}
                    type="button"
                    disabled={modeLocked}
                    onClick={() => setMode(m.v)}
                    className={`rounded-lg border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      active ? 'border-pink bg-pink/5' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xl">{m.emoji}</span>
                      <span className="font-bold text-ink">{m.label}</span>
                    </div>
                    <div className="text-[11px] leading-relaxed text-neutral-600">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-1 text-xs font-bold text-ink">Template selection</div>
            <p className="mb-3 text-[11px] text-neutral-500">
              Templates are pre-designed layouts that the customer&apos;s photo drops into. Assign templates in the <strong>Templates</strong> tab.
            </p>
            <div className="grid gap-2 md:grid-cols-3">
              {[
                { v: 'none' as const, label: 'No templates', desc: 'Customer uploads and configures directly' },
                { v: 'optional' as const, label: 'Optional', desc: 'Customer can pick a template OR upload their own' },
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
        </div>
      )}

      {/* AI settings */}
      {tab === 'ai' && mode !== 'photo-resize' && (
        <div className="max-w-4xl space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
          <div className="rounded border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900">
            These prompts and parameters control how the customer&apos;s uploaded photo is transformed for <strong>{GIFT_MODE_LABEL[mode]}</strong> production. Customers never see these settings.
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">Transformation prompt</span>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={5}
              className={`${inputCls} font-mono text-xs leading-relaxed`}
              placeholder={mode === 'laser'
                ? 'e.g. Convert this photo into high-contrast black-and-white line art suitable for laser engraving on wood. Bold outlines, no mid-tones.'
                : mode === 'uv'
                ? 'e.g. Stylise this photo as a flat cel-shaded illustration with bold saturated colours. Simplified features, solid colour regions.'
                : 'e.g. Simplify this photo into embroidery-ready art with no more than 8 solid colours. Bold shapes, no gradients, minimum feature size 1.5mm.'
              }
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">Negative prompt (optional)</span>
            <textarea
              value={aiNegative}
              onChange={(e) => setAiNegative(e.target.value)}
              rows={2}
              className={`${inputCls} font-mono text-xs`}
              placeholder="e.g. blurry, gradient, photorealistic, low contrast"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">Colour profile (optional)</span>
            <input
              value={colorProfile}
              onChange={(e) => setColorProfile(e.target.value)}
              className={inputCls}
              placeholder={mode === 'uv' ? 'printvolution-uv.icc' : mode === 'embroidery' ? 'madeira-classic' : ''}
            />
          </label>

          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-[11px] text-neutral-600">
            <strong>How it works:</strong> On customer upload, your prompt is passed to our image pipeline. The output is downscaled to a watermarked preview. At order placement, the <strong>full-resolution</strong> version is regenerated and saved as a 300 DPI production file — only visible to admins.
          </div>
        </div>
      )}

      {/* Pricing */}
      {tab === 'pricing' && (
        <div className="max-w-3xl space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Base price (S$)</span>
              <input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className={`${inputCls} max-w-[200px]`}
              />
              <span className="mt-1 block text-[11px] text-neutral-500">Price for a single unit if no volume tier applies.</span>
            </label>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink">Volume tiers (optional)</div>
                <div className="text-[11px] text-neutral-500">Cheaper per-unit price when customers buy in bulk.</div>
              </div>
              <button
                type="button"
                onClick={() => setPriceTiers([...priceTiers, { qty: '', price: '' }])}
                className="inline-flex items-center gap-1 rounded-full bg-pink px-3 py-1.5 text-[11px] font-bold text-white hover:bg-pink-dark"
              >
                <Plus size={12} /> Add tier
              </button>
            </div>
            {priceTiers.length === 0 ? (
              <div className="rounded border border-dashed border-neutral-300 p-6 text-center text-xs text-neutral-500">
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
      )}

      {/* Templates */}
      {tab === 'templates' && (
        <div className="max-w-4xl space-y-4">
          <div className="rounded border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink">Assigned templates</div>
                <div className="text-[11px] text-neutral-500">
                  Template mode: <strong>{templateMode}</strong> (change in Mode tab).
                </div>
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
        </div>
      )}

      {/* Production */}
      {tab === 'production' && (
        <div className="max-w-3xl space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Width (mm)</span>
              <input type="number" step="0.1" value={widthMm} onChange={(e) => setWidthMm(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Height (mm)</span>
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
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-[11px] text-neutral-600">
            <strong>Recommended:</strong> bleed <strong>2 mm</strong>, safe zone <strong>3 mm</strong>, minimum source <strong>{Math.ceil((Math.max(parseFloat(widthMm), parseFloat(heightMm)) / 25.4) * 300)} px</strong> for 300 DPI at your current dimensions.
          </div>
        </div>
      )}

      {/* SEO */}
      {tab === 'seo' && (
        <div className="max-w-3xl space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">SEO title</span>
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink">SEO description</span>
            <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} className={inputCls} />
          </label>
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
