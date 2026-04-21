'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { MagazineEditor, type MagValue } from './product-magazine-editor';
// HowWePrintEditor removed — the "How we print" cards are site-wide now.
// Edit them at /admin/settings.
import { updateProduct } from '@/app/admin/products/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import { OptionImagePicker } from '@/components/admin/option-image-picker';
import { MatcherEditor, type MatcherValue } from '@/components/admin/product-matcher-editor';
import { FormulaBuilder } from '@/components/admin/formula-builder';
import type { ProductDetail } from '@/lib/data/products';

type Cat = { id: string; slug: string; name: string; parent_id: string | null };
type Tab = 'basics' | 'pricing' | 'faqs' | 'content';

export function ProductEditor({ product, categories, defaultSeoBody }: { product: ProductDetail; categories: Cat[]; defaultSeoBody?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedFlash, setSavedFlash] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('basics');

  // All editable fields (local state)
  const [name, setName] = useState(product.name);
  // Legacy per-product icon (emoji fallback) — not edited from admin
  // anymore; the hero banner is the canonical product image. Kept on
  // the save payload so existing emoji values aren't wiped.
  const icon = product.icon ?? '';
  const [tagline, setTagline] = useState(product.tagline ?? '');
  const [description, setDescription] = useState(product.description ?? '');
  const topCats = categories.filter((c) => !c.parent_id);
  const [categoryId, setCategoryId] = useState<string>(
    topCats.find((c) => c.name === product.category?.name)?.id ?? topCats[0]?.id ?? ''
  );
  const subCats = categories.filter((c) => c.parent_id === categoryId);
  const [subcategoryId, setSubcategoryId] = useState<string>(
    subCats.find((c) => c.name === product.subcategory?.name)?.id ?? ''
  );
  const [isActive, setIsActive] = useState(true);
  const [isGift, setIsGift] = useState(product.is_gift ?? false);
  const [leadTimeDays, setLeadTimeDays] = useState<string>(
    product.lead_time_days != null ? String(product.lead_time_days) : ''
  );
  const [printMode, setPrintMode] = useState(product.print_mode ?? '');

  // Extras
  const [seoTitle, setSeoTitle] = useState(product.extras?.seo_title ?? '');
  const [seoDesc, setSeoDesc] = useState(product.extras?.seo_desc ?? '');
  // Prefill with the live fallback text so the admin edits the paragraph
  // they actually see on the page, instead of staring at an empty field.
  const [seoBody, setSeoBody] = useState(product.extras?.seo_body ?? defaultSeoBody ?? '');
  const [heroBig, setHeroBig] = useState(product.extras?.hero_big ?? '');
  const [h1, setH1] = useState(product.extras?.h1 ?? '');
  const [h1em, setH1em] = useState(product.extras?.h1em ?? '');
  const [intro, setIntro] = useState(product.extras?.intro ?? '');
  const [imageUrl, setImageUrl] = useState(product.extras?.image_url ?? '');
  // Per-product overrides — null means "use the auto-generated default"
  // (SEO Magazine tailored to product name+configurator, or site-wide
  // Site Settings features for How We Print).
  const [seoMagazine, setSeoMagazine] = useState<MagValue | null>(
    (product.extras?.seo_magazine as MagValue) ?? null,
  );
  const [matcher, setMatcher] = useState<MatcherValue | null>(
    (product.extras?.matcher as MatcherValue) ?? null,
  );
  // "How we print" is site-wide — edit at /admin/settings. Kept as a
  // null payload on save so existing per-product overrides are cleared.

  // Pricing (cents in backend, dollars in UI)
  const [pricingLabel, setPricingLabel] = useState(product.pricing?.label ?? 'Size');
  const [pricingConfigs, setPricingConfigs] = useState<string[]>(product.pricing?.configs ?? ['Standard']);
  const [pricingRows, setPricingRows] = useState<Array<{ qty: string; prices: string[] }>>(
    (product.pricing?.rows ?? [{ qty: '1 pc', prices: [0] }]).map((r) => ({
      qty: r.qty,
      prices: r.prices.map((p) => (p / 100).toFixed(2)),
    }))
  );

  // Qty-tier adjust — admin-editable signed $ offset per qty tier on the
  // pricing_table. UI stores dollars as a string ("0" = no change,
  // "-20" = $20 off, "15" = +$15). Converted to signed cents on save.
  const initialAdjust: Record<string, string> = {};
  for (const t of product.pricing_table?.qty_tiers ?? []) {
    const cents = product.pricing_table?.qty_adjust?.[String(t)];
    initialAdjust[String(t)] = cents != null ? (cents / 100).toFixed(2) : '0';
  }
  const [qtyAdjust, setQtyAdjust] = useState<Record<string, string>>(initialAdjust);

  // Qty tier prices editor — lets admin add / remove qty tiers and set
  // dollar prices per axis combo. Shape: rows = qty tiers, columns =
  // cartesian product of axes. UI stores dollars as strings.
  const axisOrder = product.pricing_table?.axis_order ?? [];
  const axes = product.pricing_table?.axes ?? {};
  const axisCombos: Array<{ key: string; label: string }> = (() => {
    if (axisOrder.length === 0) return [];
    const combos: Array<{ key: string; label: string }> = [{ key: '', label: '' }];
    for (const axisName of axisOrder) {
      const opts = axes[axisName] ?? [];
      const next: Array<{ key: string; label: string }> = [];
      for (const c of combos) {
        for (const o of opts) {
          next.push({
            key: c.key ? `${c.key}:${o.slug}` : o.slug,
            label: c.label ? `${c.label} · ${o.label}` : o.label,
          });
        }
      }
      combos.splice(0, combos.length, ...next);
    }
    return combos;
  })();
  type TierRow = { qty: string; prices: Record<string, string> };
  const initialTierRows: TierRow[] = (product.pricing_table?.qty_tiers ?? []).map((t) => {
    const prices: Record<string, string> = {};
    for (const c of axisCombos) {
      const key = `${c.key}:${t}`;
      const cents = product.pricing_table?.prices?.[key];
      prices[c.key] = cents != null ? (cents / 100).toFixed(2) : '';
    }
    return { qty: String(t), prices };
  });
  const [tierRows, setTierRows] = useState<TierRow[]>(initialTierRows);
  const [newTierQty, setNewTierQty] = useState('');

  // Configurator
  const [configurator, setConfigurator] = useState(product.configurator);

  // FAQs
  const [faqs, setFaqs] = useState(product.faqs);

  async function handleSave() {
    setErr(null);
    startTransition(async () => {
      const input = {
        name, icon: icon || null, tagline: tagline || null,
        description: description || null,
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        is_active: isActive,
        is_gift: isGift,
        lead_time_days: leadTimeDays.trim() === '' ? null : (parseInt(leadTimeDays, 10) || null),
        print_mode: printMode.trim() === '' ? null : printMode.trim(),
        seo_title: seoTitle || null, seo_desc: seoDesc || null, seo_body: seoBody || null,
        hero_big: heroBig || null,
        h1: h1 || null, h1em: h1em || null,
        intro: intro || null,
        image_url: imageUrl || null,
        matcher,
        seo_magazine: seoMagazine,
        how_we_print: null,
        pricing: {
          label: pricingLabel,
          configs: pricingConfigs,
          rows: pricingRows.map((r) => ({
            qty: r.qty,
            prices: r.prices.map((p) => Math.round((parseFloat(p) || 0) * 100)),
          })),
        },
        configurator: configurator.map((c) => ({
          step_id: c.step_id,
          label: c.label,
          type: c.type,
          required: c.required,
          options: c.options ?? [],
          show_if: c.show_if ?? null,
          step_config: c.step_config ?? null,
        })),
        faqs,
        // Convert UI $ strings → signed cents. Only include tiers the
        // pricing_table already knows about so we don't create orphan
        // keys. 0 entries are stripped server-side.
        qty_adjust: (() => {
          if (!product.pricing_table?.qty_tiers?.length) return null;
          const out: Record<string, number> = {};
          for (const t of product.pricing_table.qty_tiers) {
            const raw = qtyAdjust[String(t)];
            const dollars = parseFloat(raw ?? '0');
            if (!Number.isFinite(dollars)) continue;
            out[String(t)] = Math.round(dollars * 100);
          }
          return out;
        })(),
        // Rebuild qty_tiers + prices from the tier-price editor rows.
        // Null = don't touch (product without a pricing_table).
        qty_tier_prices: (() => {
          if (!product.pricing_table) return null;
          const tiers: number[] = [];
          const prices: Record<string, number> = {};
          for (const row of tierRows) {
            const qty = parseInt(row.qty, 10);
            if (!Number.isFinite(qty) || qty <= 0) continue;
            tiers.push(qty);
            for (const c of axisCombos) {
              const dollars = parseFloat(row.prices[c.key] ?? '');
              if (!Number.isFinite(dollars) || dollars < 0) continue;
              prices[`${c.key}:${qty}`] = Math.round(dollars * 100);
            }
          }
          return { qty_tiers: tiers, prices };
        })(),
      };
      const result = await updateProduct(product.slug, input);
      if (result.ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
        router.refresh();
      } else {
        setErr(result.error ?? 'Save failed');
      }
    });
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {(['basics', 'content', 'pricing', 'faqs'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t px-4 py-2 text-xs font-bold transition-colors ${
              tab === t ? 'bg-ink text-white' : 'text-neutral-600 hover:text-ink'
            }`}
          >
            {t === 'basics' && 'Basics'}
            {t === 'content' && 'SEO'}
            {t === 'pricing' && `Pricing & Options${configurator.length > 0 ? ` (${configurator.length})` : ''}`}
            {t === 'faqs' && `FAQs (${faqs.length})`}
          </button>
        ))}
      </div>

      {/* Basics — ordered to match the front-end render sequence */}
      {tab === 'basics' && (
        <div className="max-w-4xl space-y-6">
          {/* Identity */}
          <Section title="Identity" desc="Name, category, visibility. Shown in the hero breadcrumb and category pill.">
            <Field label="Product name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Category">
                <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(''); }} className={inputCls}>
                  {topCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              {subCats.length > 0 && (
                <Field label="Subcategory">
                  <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className={inputCls}>
                    <option value="">— none —</option>
                    {subCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
              )}
            </div>
            <div className="flex flex-wrap gap-5 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span className="font-semibold text-ink">Active (visible on the site)</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
                <span className="font-semibold text-ink">Personalised gift</span>
              </label>
            </div>
          </Section>

          {/* Hero — first section customers see */}
          <Section title="Hero section" desc="The top of the product page — H1, tagline, banner, CTAs.">
            <Field label="Hero banner image (landscape)">
              <ImageUpload value={imageUrl} onChange={setImageUrl} prefix={`hero-${product.slug}`} aspect={16 / 9} label="Hero banner" size="lg" />
              <p className="mt-1 text-[10px] text-neutral-500">
                Cropped to 16:9. Also used as the thumbnail on shop grid cards, cart, related products, and admin orders.
              </p>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="H1 text">
                <input value={h1} onChange={(e) => setH1(e.target.value)} className={inputCls} placeholder={name} />
                <p className="mt-1 text-[10px] text-neutral-500">Leave blank to use the product name.</p>
              </Field>
              <Field label="H1 italic sub (em)">
                <input value={h1em} onChange={(e) => setH1em(e.target.value)} className={inputCls} placeholder="Built for Singapore's Outdoors." />
              </Field>
            </div>
            <Field label="Tagline (1-line hook)">
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} />
              <p className="mt-1 text-[10px] text-neutral-500">Drives shop listings, nav hover preview, and the hero-sub fallback when Short description is empty.</p>
            </Field>
            <Field label="Hero big text (watermark fallback)">
              <input value={heroBig} onChange={(e) => setHeroBig(e.target.value)} className={inputCls} placeholder="PVC CANVAS" />
              <p className="mt-1 text-[10px] text-neutral-500">Shown large and italic when no banner image is uploaded.</p>
            </Field>
          </Section>

          {/* Short description — hero sub-copy + schema + meta fallback */}
          <Section title="Product description" desc="Shown as the hero sub-copy on the product page, and used in JSON-LD schema + search-engine meta description fallback.">
            <Field label="Short description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
              <p className="mt-1 text-[10px] text-neutral-500">One or two sentences. Shows on the product-page hero; also feeds the generated SEO Magazine lede. If left empty, the hero falls back to the Tagline above.</p>
            </Field>
          </Section>

          {/* Production metadata — shown as chips in the hero */}
          <Section title="Production details" desc="Shown as small chips below the tagline on the product page. Leave blank to hide.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Lead time (working days)">
                <input
                  type="number"
                  min={0}
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 7"
                />
                <p className="mt-1 text-[10px] text-neutral-500">Integer only. Rendered as "{leadTimeDays || 'N'} working days".</p>
              </Field>
              <Field label="Print method">
                <input
                  value={printMode}
                  onChange={(e) => setPrintMode(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Offset, Digital, UV, Embroidery"
                />
                <p className="mt-1 text-[10px] text-neutral-500">Free text. Rendered in magenta next to the Print chip.</p>
              </Field>
            </div>
          </Section>

          {/* Pointers to other tabs so admins know where to edit the other
              things that appear on the product page. */}
          <div className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-4 text-xs text-neutral-600 leading-relaxed">
            <div className="mb-2 font-bold text-ink">Where to edit the rest of this product page:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Calculator / Configurator</strong> (size, paper, finish, quantity steps + live price matrix) → <strong>Pricing &amp; Options</strong> tab.</li>
              <li><strong>&quot;Everything worth knowing&quot;</strong> (long-form magazine) → <strong>SEO</strong> tab, JSON override field.</li>
              <li><strong>FAQ</strong> → <strong>FAQs</strong> tab.</li>
              <li><strong>&quot;How we print&quot;</strong> (4 cards, same on every product) → <a className="font-bold text-pink underline" href="/admin/settings">Site Settings</a>.</li>
              <li><strong>Related products</strong> → managed automatically via same-category links.</li>
            </ul>
          </div>
        </div>
      )}

      {/* SEO — metadata only */}
      {tab === 'content' && (
        <div className="grid max-w-4xl gap-5 rounded-lg border border-neutral-200 bg-white p-6">
          <div className="text-xs text-neutral-500">
            Metadata for search engines and social sharing. Content fields (H1, tagline, intro, etc.)
            now live on the <strong>Basics</strong> tab in the order they appear on the page.
          </div>
          <Field label="SEO title">
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
            <p className="mt-1 text-[10px] text-neutral-500">Keep under ~60 characters. Shown in the browser tab and Google results.</p>
          </Field>
          <Field label="SEO description">
            <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} className={inputCls} />
            <p className="mt-1 text-[10px] text-neutral-500">Under ~155 characters. Shown below the title in search results.</p>
          </Field>
          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-ink">SEO body paragraph (bottom of product page)</span>
              {defaultSeoBody && seoBody !== defaultSeoBody && (
                <button
                  type="button"
                  onClick={() => setSeoBody(defaultSeoBody)}
                  className="text-[10px] font-bold text-pink hover:underline"
                >
                  Reset to default
                </button>
              )}
            </div>
            <textarea
              value={seoBody}
              onChange={(e) => setSeoBody(e.target.value)}
              rows={7}
              className={inputCls}
            />
            <p className="mt-1 text-[10px] text-neutral-500">
              Prefilled with the live default generated from the product name and lowest price. Edit freely — it&apos;s rendered as-is at the bottom of the product page and indexed by Google for long-tail keywords. Clear the field to revert to the auto-generated version.
            </p>
          </div>

          <div className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-4 text-xs text-neutral-600">
            <div className="mb-1 font-bold text-ink">How we print (4 cards)</div>
            <p>
              This section is now site-wide — the same four cards appear on every product page.
              Edit them at{' '}
              <a className="font-bold text-pink underline" href="/admin/settings">
                Site Settings
              </a>
              .
            </p>
          </div>
          <MatcherEditor value={matcher} onChange={setMatcher} />
          <MagazineEditor value={seoMagazine} onChange={setSeoMagazine} />
        </div>
      )}

      {/* Pricing & Options (merged) */}
      {tab === 'pricing' && (
        <div className="max-w-5xl space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <strong>How pricing works:</strong> Simple products use only the <em>quantity tiers matrix</em> below.
            Complex products (with size/material/color variants that change price) add <em>configurator steps</em> — each option's{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono">price_formula</code> overrides the matrix.
          </div>

          {/* Section 1: matrix */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="mb-1 text-sm font-bold text-ink">1. Quantity tiers & base pricing</h3>
            <p className="mb-4 text-xs text-neutral-500">The price ladder shown on the product page. Columns are variants (e.g. Matte / Glossy). Prices in S$.</p>
          <div className="mb-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <Field label="Dimension label (e.g. Size, Material, Color)">
              <input value={pricingLabel} onChange={(e) => setPricingLabel(e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Config columns */}
          <div className="mb-3 text-xs font-bold text-ink">Columns (config options):</div>
          <div className="mb-4 flex flex-wrap gap-2">
            {pricingConfigs.map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  value={c}
                  onChange={(e) => setPricingConfigs(pricingConfigs.map((x, j) => j === i ? e.target.value : x))}
                  className={`${inputCls} w-40`}
                />
                <button type="button" onClick={() => {
                  setPricingConfigs(pricingConfigs.filter((_, j) => j !== i));
                  setPricingRows(pricingRows.map((r) => ({ ...r, prices: r.prices.filter((_, j) => j !== i) })));
                }} className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={() => {
              setPricingConfigs([...pricingConfigs, 'New']);
              setPricingRows(pricingRows.map((r) => ({ ...r, prices: [...r.prices, '0.00'] })));
            }} className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
              <Plus size={12} /> Add column
            </button>
          </div>

          {/* Rows */}
          <div className="mb-2 text-xs font-bold text-ink">Rows (quantity tiers, prices in S$):</div>
          <div className="overflow-x-auto rounded border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-500">
                <tr>
                  <th className="p-2 text-left">Qty</th>
                  {pricingConfigs.map((c, i) => <th key={i} className="p-2 text-center">{c}</th>)}
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pricingRows.map((r, ri) => (
                  <tr key={ri}>
                    <td className="p-2">
                      <input
                        value={r.qty}
                        onChange={(e) => setPricingRows(pricingRows.map((x, j) => j === ri ? { ...x, qty: e.target.value } : x))}
                        className={`${inputCls} w-24`}
                        placeholder="100pcs"
                      />
                    </td>
                    {r.prices.map((p, ci) => (
                      <td key={ci} className="p-2">
                        <input
                          value={p}
                          onChange={(e) => setPricingRows(pricingRows.map((x, j) => j === ri ? { ...x, prices: x.prices.map((pp, k) => k === ci ? e.target.value : pp) } : x))}
                          className={`${inputCls} w-24 text-right`}
                          placeholder="0.00"
                        />
                      </td>
                    ))}
                    <td className="p-2">
                      <button type="button" onClick={() => setPricingRows(pricingRows.filter((_, j) => j !== ri))}
                        className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setPricingRows([...pricingRows, { qty: 'new', prices: pricingConfigs.map(() => '0.00') }])}
            className="mt-3 flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
            <Plus size={12} /> Add row
          </button>
          </div>

          {/* Section 1b-prime: qty tier prices editor — lets admin add / remove
              tiers and set a dollar price per axis combo. */}
          {product.pricing_table ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h3 className="mb-1 text-sm font-bold text-ink">1b. Qty tier prices</h3>
              <p className="mb-4 text-xs text-neutral-500">
                Pricing ladder used by the customer-facing calculator. Each row is a qty tier; each column is an axis combo (e.g. size, finish, material).
                Add rows for every qty/price point you want to offer. Prices in S$.
                {product.pricing_table.qty_mode === 'per_unit_at_tier_rate' && (
                  <> Mode: <strong>per-sheet rate at tier</strong> — typed qty scales linearly using the per-sheet rate of the nearest tier floor.</>
                )}
              </p>
              <div className="overflow-x-auto rounded border border-neutral-200">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-500">
                    <tr>
                      <th className="p-2 text-left">Qty</th>
                      {axisCombos.map((c) => (
                        <th key={c.key} className="p-2 text-right">{c.label || 'Price'}</th>
                      ))}
                      <th className="p-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {tierRows.map((row, ri) => (
                      <tr key={ri}>
                        <td className="p-2">
                          <input
                            value={row.qty}
                            onChange={(e) => setTierRows(tierRows.map((r, j) => j === ri ? { ...r, qty: e.target.value } : r))}
                            className={`${inputCls} w-24`}
                            placeholder="10"
                          />
                        </td>
                        {axisCombos.map((c) => (
                          <td key={c.key} className="p-2">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-neutral-500">S$</span>
                              <input
                                value={row.prices[c.key] ?? ''}
                                onChange={(e) => setTierRows(tierRows.map((r, j) => j === ri ? { ...r, prices: { ...r.prices, [c.key]: e.target.value } } : r))}
                                className={`${inputCls} w-24 text-right`}
                                placeholder="0.00"
                              />
                            </div>
                          </td>
                        ))}
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => setTierRows(tierRows.filter((_, j) => j !== ri))}
                            className="text-red-600 hover:text-red-700"
                            title="Remove tier"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={newTierQty}
                  onChange={(e) => setNewTierQty(e.target.value)}
                  placeholder="New qty (e.g. 10)"
                  className={`${inputCls} w-40`}
                  type="number"
                  min={1}
                />
                <button
                  type="button"
                  onClick={() => {
                    const q = parseInt(newTierQty, 10);
                    if (!Number.isFinite(q) || q <= 0) return;
                    if (tierRows.some((r) => parseInt(r.qty, 10) === q)) return;
                    const blank: Record<string, string> = {};
                    for (const c of axisCombos) blank[c.key] = '';
                    setTierRows([...tierRows, { qty: String(q), prices: blank }].sort((a, b) => parseInt(a.qty, 10) - parseInt(b.qty, 10)));
                    setNewTierQty('');
                  }}
                  className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink"
                >
                  <Plus size={12} /> Add tier
                </button>
              </div>
            </div>
          ) : null}

          {/* Section 1c: qty-tier $ offset — only when pricing_table has tiers */}
          {product.pricing_table?.qty_tiers?.length ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h3 className="mb-1 text-sm font-bold text-ink">1c. Qty tier $ adjustment</h3>
              <p className="mb-4 text-xs text-neutral-500">
                Signed dollar offset added to the base <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono">pricing_table</code> price at each qty tier.
                <strong> 0 = no change</strong>, <strong>−20</strong> = $20 off, <strong>15</strong> = +$15. Applied to the tier across every paper / material / finish combo. Minimum final price is $0.
              </p>
              <div className="overflow-x-auto rounded border border-neutral-200">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-[11px] font-bold uppercase text-neutral-500">
                    <tr>
                      <th className="p-2 text-left">Qty tier</th>
                      <th className="p-2 text-right">Adjustment (S$)</th>
                      <th className="p-2 text-left" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {product.pricing_table.qty_tiers.map((t) => {
                      const key = String(t);
                      const raw = qtyAdjust[key] ?? '0';
                      const dollars = parseFloat(raw);
                      const active = Number.isFinite(dollars) && dollars !== 0;
                      return (
                        <tr key={key} className={active ? 'bg-yellow-50' : ''}>
                          <td className="p-2 font-mono text-xs">{t.toLocaleString()}</td>
                          <td className="p-2">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-neutral-500">S$</span>
                              <input
                                value={raw}
                                onChange={(e) => setQtyAdjust({ ...qtyAdjust, [key]: e.target.value })}
                                className={`${inputCls} w-24 text-right`}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="p-2 text-[11px] text-neutral-500">
                            {active ? (dollars > 0 ? `+ S$${dollars.toFixed(2)} per tier row` : `− S$${Math.abs(dollars).toFixed(2)} off per tier row`) : 'no change'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => {
                  const reset: Record<string, string> = {};
                  for (const t of product.pricing_table?.qty_tiers ?? []) reset[String(t)] = '0';
                  setQtyAdjust(reset);
                }}
                className="mt-3 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink"
              >
                Reset all to $0
              </button>
            </div>
          ) : null}

          {/* Section 2: configurator */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="mb-1 text-sm font-bold text-ink">2. Product options (configurator steps)</h3>
            <p className="mb-4 text-xs text-neutral-500">
              Optional. Add interactive options (size, material, color, quantity input). Each option can override the base price via a formula using{' '}
              <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono">qty</code>, <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono">+ - * /</code>, parentheses, and{' '}
              <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono">Math.min/max</code>. Leave blank to use the matrix price.
            </p>
            <ConfiguratorEditor steps={configurator} setSteps={setConfigurator} />
          </div>
        </div>
      )}

      {/* FAQs */}
      {tab === 'faqs' && (
        <div className="max-w-4xl rounded-lg border border-neutral-200 bg-white p-6">
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded border border-neutral-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500">FAQ {i + 1}</span>
                  <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                    className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
                </div>
                <input
                  value={f.question}
                  onChange={(e) => setFaqs(faqs.map((x, j) => j === i ? { ...x, question: e.target.value } : x))}
                  placeholder="Question"
                  className={`${inputCls} mb-2 font-semibold`}
                />
                <textarea
                  value={f.answer}
                  onChange={(e) => setFaqs(faqs.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))}
                  placeholder="Answer"
                  rows={3}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
            className="mt-4 flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
            <Plus size={12} /> Add FAQ
          </button>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-4 rounded-lg border-2 border-ink bg-white p-4 shadow-brand">
        <div className="text-xs text-neutral-500">
          {err && <span className="font-bold text-red-600">{err}</span>}
          {savedFlash && <span className="font-bold text-green-600">✓ Saved</span>}
          {!err && !savedFlash && <span>Changes are saved per-product.</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full bg-pink px-6 py-2 text-sm font-bold text-white hover:bg-pink-dark disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

/** Configurator editor — redesigned for clarity */
/** show_if in the DB supports two axes:
 *    • multiple clauses — AND across different steps (all must match).
 *    • `value` as string[] — OR within a single step's options.
 *
 *  The admin UI models each row as one step + N selected values (OR),
 *  and each row is AND-combined. Because AND-ing two clauses on the
 *  *same* step is logically impossible (a step only takes one value),
 *  normalizeShowIf merges same-step clauses into one OR clause on load
 *  — this auto-heals rules that were saved as multiple same-step rows
 *  before the multi-value UI existed. On save we collapse back to the
 *  smallest on-disk shape (scalar vs array, object vs array of objects).
 */
type ShowIfClauseDb = { step: string; value: string | string[] };
type ShowIfEditorClause = { step: string; values: string[] };
function normalizeShowIf(raw: unknown): ShowIfEditorClause[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  const byStep = new Map<string, string[]>();
  const order: string[] = [];
  for (const c of arr) {
    if (!c || typeof c !== 'object') continue;
    const step = (c as any).step;
    if (typeof step !== 'string') continue;
    const rawVal = (c as any).value;
    const vals = Array.isArray(rawVal)
      ? rawVal.filter((v): v is string => typeof v === 'string')
      : typeof rawVal === 'string' ? [rawVal] : [];
    if (vals.length === 0) continue;
    if (!byStep.has(step)) {
      byStep.set(step, []);
      order.push(step);
    }
    const existing = byStep.get(step)!;
    for (const v of vals) if (!existing.includes(v)) existing.push(v);
  }
  return order.map((step) => ({ step, values: byStep.get(step)! }));
}
/** Collapse editor state back to the smallest DB-friendly shape. */
function denormalizeShowIf(
  clauses: ShowIfEditorClause[],
): ShowIfClauseDb | ShowIfClauseDb[] | null {
  const valid = clauses.filter((c) => c.step && c.values.length > 0);
  if (valid.length === 0) return null;
  const db: ShowIfClauseDb[] = valid.map((c) => ({
    step: c.step,
    value: c.values.length === 1 ? c.values[0] : c.values,
  }));
  return db.length === 1 ? db[0] : db;
}

function ShowIfEditor({
  label,
  hint,
  value,
  otherSteps,
  onChange,
}: {
  label: string;
  hint: string;
  value: ShowIfEditorClause[];
  otherSteps: ProductDetail['configurator'];
  onChange: (next: ShowIfClauseDb | ShowIfClauseDb[] | null) => void;
}) {
  // Only swatch/select steps can be gated on — they're the ones with
  // pickable option slugs that make sense as a show_if value.
  const candidateSteps = otherSteps.filter((s) => s.type === 'swatch' || s.type === 'select');
  const clauses = value;

  function commit(next: ShowIfEditorClause[]) {
    onChange(denormalizeShowIf(next));
  }
  function updateClause(i: number, patch: Partial<ShowIfEditorClause>) {
    commit(clauses.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }
  function removeClause(i: number) {
    commit(clauses.filter((_, j) => j !== i));
  }
  function toggleValue(i: number, slug: string) {
    const clause = clauses[i];
    if (!clause) return;
    const next = clause.values.includes(slug)
      ? clause.values.filter((v) => v !== slug)
      : [...clause.values, slug];
    updateClause(i, { values: next });
  }
  function addClause() {
    // Pick the first step not already used, so two rows can't target
    // the same step (that combo is AND-impossible; use multi-value
    // within one row instead).
    const usedSteps = new Set(clauses.map((c) => c.step));
    const target = candidateSteps.find((s) => !usedSteps.has(s.step_id));
    if (!target) return;
    const firstOptSlug = target.options?.[0]?.slug ?? '';
    commit([...clauses, { step: target.step_id, values: firstOptSlug ? [firstOptSlug] : [] }]);
  }
  const allStepsUsed = clauses.length >= candidateSteps.length;

  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
        {label}
      </div>
      <p className="mb-3 text-[11px] leading-snug text-neutral-500">
        {hint}
        {clauses.length > 1 && (
          <span className="ml-1 font-semibold text-neutral-700">Different rows = AND. Multiple values in a row = OR.</span>
        )}
      </p>

      {clauses.length === 0 ? (
        <button
          type="button"
          onClick={addClause}
          disabled={candidateSteps.length === 0}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add condition
        </button>
      ) : (
        <div className="space-y-2">
          {clauses.map((clause, i) => {
            const picked = candidateSteps.find((s) => s.step_id === clause.step);
            // For the step dropdown, offer this row's current step plus
            // any others not already used by another row.
            const usedElsewhere = new Set(
              clauses.filter((_, j) => j !== i).map((c) => c.step),
            );
            const availableSteps = candidateSteps.filter(
              (s) => s.step_id === clause.step || !usedElsewhere.has(s.step_id),
            );
            return (
              <div key={i} className="rounded-md bg-white p-2 ring-1 ring-neutral-200">
                <div className="flex items-start gap-2">
                  <label className="block flex-1">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                      Depends on step
                    </span>
                    <select
                      value={clause.step}
                      onChange={(e) => {
                        const step = e.target.value;
                        const target = candidateSteps.find((s) => s.step_id === step);
                        const firstOptSlug = target?.options?.[0]?.slug ?? '';
                        updateClause(i, { step, values: firstOptSlug ? [firstOptSlug] : [] });
                      }}
                      className={inputCls}
                    >
                      {availableSteps.map((s) => (
                        <option key={s.step_id} value={s.step_id}>{s.label || s.step_id}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeClause(i)}
                    className="mt-4 shrink-0 rounded-md border border-neutral-300 bg-white px-2 py-2 text-neutral-500 hover:border-red-400 hover:text-red-600"
                    title="Remove condition"
                    aria-label="Remove condition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                      When value is
                    </span>
                    {clause.values.length > 1 && (
                      <span className="text-[10px] font-semibold text-neutral-500">OR — any selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(picked?.options ?? []).map((o) => {
                      const active = clause.values.includes(o.slug);
                      return (
                        <button
                          key={o.slug}
                          type="button"
                          onClick={() => toggleValue(i, o.slug)}
                          className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            active
                              ? 'border-ink bg-ink text-white'
                              : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                          }`}
                        >
                          {o.label || o.slug}
                        </button>
                      );
                    })}
                  </div>
                  {clause.values.length === 0 && (
                    <p className="mt-1 text-[10px] italic text-red-600">Pick at least one value.</p>
                  )}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addClause}
            disabled={allStepsUsed}
            title={allStepsUsed ? 'All available steps are already used — add more values within an existing row instead.' : undefined}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add condition
          </button>
        </div>
      )}
    </div>
  );
}

function ConfiguratorEditor({ steps, setSteps }: { steps: ProductDetail['configurator']; setSteps: (s: ProductDetail['configurator']) => void }) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  function update(i: number, patch: Partial<ProductDetail['configurator'][0]>) {
    setSteps(steps.map((s, j) => j === i ? { ...s, ...patch } as any : s));
  }
  function autoSlug(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'step';
  }
  function moveStep(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= steps.length || to >= steps.length) return;
    const next = [...steps];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    // Re-assign step_order so the saved payload matches the visual order.
    setSteps(next.map((s, idx) => ({ ...s, step_order: idx } as any)));
  }

  const TYPES: Array<{ v: string; label: string; hint: string; icon: string }> = [
    { v: 'swatch', label: 'Swatches', hint: 'Visual buttons (size, color, material)', icon: '🎨' },
    { v: 'select', label: 'Dropdown', hint: 'Simple list for long option lists', icon: '📋' },
    { v: 'qty', label: 'Quantity', hint: 'Number stepper (quantity of items)', icon: '#' },
    { v: 'text', label: 'Text input', hint: 'Free text (name to engrave, etc.)', icon: '✍' },
    { v: 'number', label: 'Number', hint: 'Numeric input (custom size, etc.)', icon: '🔢' },
  ];

  return (
    <div className="max-w-5xl space-y-4">
      {steps.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-white p-8 text-center">
          <div className="mb-2 text-sm font-bold text-neutral-400">No options yet</div>
          <div className="text-xs text-neutral-500">Add a step below to let customers pick a size, material, etc.</div>
        </div>
      )}

      {steps.map((s, i) => (
        <div
          key={i}
          onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) setDragOverIdx(i); }}
          onDragLeave={() => { if (dragOverIdx === i) setDragOverIdx(null); }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIdx !== null) moveStep(dragIdx, i);
            setDragIdx(null); setDragOverIdx(null);
          }}
          className={`overflow-hidden rounded-lg border-2 bg-white transition-colors ${
            dragOverIdx === i ? 'border-pink ring-2 ring-pink/30' :
            dragIdx === i ? 'border-neutral-300 opacity-50' :
            'border-neutral-200'
          }`}
        >
          {/* Step header bar — draggable by the grip handle */}
          <div
            draggable
            onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; }}
            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
            className="flex cursor-grab items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-pink/5 to-transparent px-5 py-3 active:cursor-grabbing"
          >
            <div className="flex items-center gap-3">
              <div className="text-neutral-400" title="Drag to reorder">
                <GripVertical size={16} />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11px] font-black text-white">
                {i + 1}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">Step {i + 1}</div>
                <div className="text-sm font-bold text-ink">{s.label || 'Untitled step'}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSteps(steps.filter((_, j) => j !== i))}
              className="rounded p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Remove step"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="space-y-5 p-5">
            {/* Label + required */}
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-600">
                  What do customers pick?
                </span>
                <input
                  value={s.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    // Auto-update slug only if it was still auto-generated (looks default)
                    const prevAuto = autoSlug(s.label);
                    const shouldUpdateSlug = !s.step_id || s.step_id === prevAuto || /^step\d+$/.test(s.step_id);
                    update(i, { label, ...(shouldUpdateSlug ? { step_id: autoSlug(label) } : {}) });
                  }}
                  placeholder="Size, Material, Colour, etc."
                  className={`${inputCls} text-base font-semibold`}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded border-2 border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold text-ink">
                <input
                  type="checkbox"
                  checked={s.required}
                  onChange={(e) => update(i, { required: e.target.checked })}
                  className="h-4 w-4"
                />
                Required
              </label>
            </div>

            {/* Type picker as visual pills */}
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-600">
                How do they pick?
              </div>
              <div className="grid grid-cols-5 gap-2">
                {TYPES.map((t) => {
                  const active = s.type === t.v;
                  return (
                    <button
                      key={t.v}
                      type="button"
                      onClick={() => update(i, { type: t.v as any })}
                      title={t.hint}
                      className={`group rounded-lg border-2 p-3 text-center transition-all ${
                        active
                          ? 'border-ink bg-ink text-white shadow-sm'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <div className="text-lg leading-none">{t.icon}</div>
                      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wide">{t.label}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 text-[10px] text-neutral-500">
                {TYPES.find((t) => t.v === s.type)?.hint}
              </div>
            </div>

            {/* Show-if rule — gate this step on another step's value */}
            <ShowIfEditor
              label="Visibility rule (optional)"
              hint="Show this step only when another step equals a specific value. Leave blank to always show."
              value={normalizeShowIf(s.show_if)}
              otherSteps={steps.filter((x, idx) => idx !== i)}
              onChange={(v) => update(i, { show_if: v })}
            />

            {/* Options (swatch / select) */}
            {(s.type === 'swatch' || s.type === 'select') && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-600">
                      Options
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {(s.options ?? []).length} option{(s.options ?? []).length === 1 ? '' : 's'} — click to edit pricing
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => update(i, { options: [...(s.options ?? []), { slug: `option-${((s.options ?? []).length) + 1}`, label: 'New option', price_formula: '' }] })}
                    className="inline-flex items-center gap-1 rounded-full bg-pink px-3 py-1.5 text-[11px] font-bold text-white hover:bg-pink-dark"
                  >
                    <Plus size={12} /> Add option
                  </button>
                </div>

                <OptionList
                  options={s.options ?? []}
                  inputCls={inputCls}
                  otherSteps={steps.filter((_, idx) => idx !== i)}
                  onReorder={(next) => update(i, { options: next })}
                  onChange={(oi, patch) => update(i, { options: (s.options ?? []).map((x, j) => j === oi ? { ...x, ...patch } as any : x) })}
                  onRemove={(oi) => update(i, { options: (s.options ?? []).filter((_, j) => j !== oi) })}
                />
              </div>
            )}

            {/* Qty type info + config */}
            {s.type === 'qty' && (
              <QtyStepConfig
                step={s}
                inputCls={inputCls}
                onChange={(patch) => update(i, { step_config: { ...(s.step_config ?? {}), ...patch } })}
              />
            )}

            {(s.type === 'text' || s.type === 'number') && (
              <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-[11px] text-neutral-600">
                Free {s.type === 'text' ? 'text' : 'number'} input — customers type their own value (engraved name, custom dimensions, etc). No price impact on its own.
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setSteps([...steps, {
          step_id: `step${steps.length + 1}`, label: '', type: 'swatch', required: false, step_order: steps.length,
          options: [], show_if: null, step_config: null,
        } as any])}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 bg-white px-4 py-4 text-sm font-bold text-neutral-500 transition-colors hover:border-ink hover:text-ink"
      >
        <Plus size={16} /> Add another step
      </button>
    </div>
  );
}

/**
 * Qty-step config panel. Kept as its own component so the "preset
 * buttons" input can hold a local text state and only parse into the
 * numeric array on blur. The earlier inline version regenerated the
 * input's value from the parsed array on every keystroke, which meant
 * typing a comma got filtered back out before the next digit could
 * land — the user literally could not type a comma.
 */
function QtyStepConfig({
  step,
  inputCls,
  onChange,
}: {
  step: ProductDetail['configurator'][0];
  inputCls: string;
  onChange: (patch: { note?: string | null; min?: number | null; presets?: number[] | null }) => void;
}) {
  const presetsArray = Array.isArray(step.step_config?.presets) ? (step.step_config!.presets as number[]) : [];
  const [presetText, setPresetText] = useState(presetsArray.join(', '));

  function commitPresets(raw: string) {
    const parts = raw
      .split(',')
      .map((x) => parseInt(x.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    // Re-write the text with a canonical "50, 100, 200" shape on commit,
    // so the next render matches what was saved.
    setPresetText(parts.join(', '));
    onChange({ presets: parts.length > 0 ? parts : [] });
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
      <div className="text-[11px] text-neutral-600">
        Customers see a <strong>− / + stepper</strong>. Price scales with quantity using the <em>Pricing & base pricing</em> matrix above, or any option-level formulas that reference <code>qty</code>.
      </div>

      <label className="block">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-600">
          Helper note (shown next to the stepper)
        </span>
        <input
          value={step.step_config?.note ?? ''}
          onChange={(e) => onChange({ note: e.target.value || null })}
          placeholder="e.g. Order 5 or more to unlock the 5% bulk discount."
          className={inputCls}
        />
        <p className="mt-1 text-[10px] text-neutral-500">Leave blank to hide. Shown directly next to the quantity input.</p>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-600">
            Minimum quantity
          </span>
          <input
            type="number"
            value={step.step_config?.min ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? null : Math.max(1, parseInt(e.target.value, 10) || 1);
              onChange({ min: v });
            }}
            placeholder="1"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-600">
            Preset quantity buttons (comma-separated)
          </span>
          <input
            value={presetText}
            onChange={(e) => setPresetText(e.target.value)}
            onBlur={(e) => commitPresets(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitPresets((e.target as HTMLInputElement).value);
              }
            }}
            placeholder="e.g. 50, 100, 200, 500"
            className={inputCls}
          />
          <p className="mt-1 text-[10px] text-neutral-500">
            Type the numbers separated by commas. Press Enter or click away to save. Leave blank for no buttons — any non-empty list will show on the product page.
          </p>
        </label>
      </div>
    </div>
  );
}

/** Collapsible option card with pricing preview */
function OptionList({
  options,
  inputCls,
  otherSteps,
  onReorder,
  onChange,
  onRemove,
}: {
  options: ProductDetail['configurator'][0]['options'];
  inputCls: string;
  otherSteps: ProductDetail['configurator'];
  onReorder: (next: ProductDetail['configurator'][0]['options']) => void;
  onChange: (idx: number, patch: any) => void;
  onRemove: (idx: number) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= options.length || to >= options.length) return;
    const next = [...options];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  }

  return (
    <div className="space-y-2">
      {options.map((opt, oi) => (
        <div
          key={oi}
          onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== oi) setDragOverIdx(oi); }}
          onDragLeave={() => { if (dragOverIdx === oi) setDragOverIdx(null); }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIdx !== null) move(dragIdx, oi);
            setDragIdx(null); setDragOverIdx(null);
          }}
          className={`rounded-lg transition-colors ${
            dragOverIdx === oi ? 'ring-2 ring-pink/60' :
            dragIdx === oi ? 'opacity-50' : ''
          }`}
        >
          <OptionCard
            option={opt}
            index={oi}
            inputCls={inputCls}
            otherSteps={otherSteps}
            onDragStart={() => setDragIdx(oi)}
            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
            onChange={(patch) => onChange(oi, patch)}
            onRemove={() => onRemove(oi)}
          />
        </div>
      ))}
      {options.length === 0 && (
        <div className="rounded border border-dashed border-neutral-300 bg-white p-6 text-center text-xs text-neutral-500">
          No options yet. Click <strong>Add option</strong> above.
        </div>
      )}
    </div>
  );
}

function OptionCard({
  option,
  index,
  inputCls,
  otherSteps,
  onDragStart,
  onDragEnd,
  onChange,
  onRemove,
}: {
  option: { slug: string; label: string; note?: string | null; price_formula?: string | null; image_url?: string | null; lead_time_days?: number | null; print_mode?: string | null; show_if?: unknown };
  index: number;
  inputCls: string;
  otherSteps: ProductDetail['configurator'];
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onChange: (patch: Partial<{ slug: string; label: string; note: string | null; price_formula: string | null; image_url: string | null; lead_time_days: number | null; print_mode: string | null; show_if: ShowIfClauseDb | ShowIfClauseDb[] | null }>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(!option.label || option.label === 'New option');

  return (
    <div className={`rounded-lg border-2 bg-white transition-colors ${open ? 'border-ink' : 'border-neutral-200'}`}>
      {/* Collapsed summary row — drag handle on the left activates
          HTML5 drag for reordering options within this step. */}
      <div className="flex items-stretch">
        <div
          draggable={!!onDragStart}
          onDragStart={(e) => { onDragStart?.(); e.dataTransfer.effectAllowed = 'move'; }}
          onDragEnd={onDragEnd}
          className="flex cursor-grab items-center px-2 text-neutral-300 hover:text-neutral-600 active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex flex-1 items-center justify-between gap-3 py-3 pr-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${open ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-500'}`}>
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-ink">{option.label || 'Untitled option'}</div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              {option.price_formula ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 font-bold text-green-700">
                    💲 Priced
                  </span>
                </>
              ) : (
                <span className="text-neutral-400">No price rule set</span>
              )}
              {option.note && <span className="truncate">· {option.note}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-neutral-400 transition-transform ${open ? 'rotate-90' : ''}`}>▸</div>
        </div>
      </button>
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="space-y-4 border-t border-neutral-100 px-4 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                Option label
              </span>
              <input
                value={option.label}
                onChange={(e) => onChange({ label: e.target.value })}
                placeholder="e.g. 85cm × 200cm"
                className={`${inputCls} font-semibold`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                Badge (optional)
              </span>
              <input
                value={option.note ?? ''}
                onChange={(e) => onChange({ note: e.target.value || null })}
                placeholder='e.g. "Most popular" or "Standard"'
                className={inputCls}
              />
            </label>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              Option image (optional)
            </div>
            <OptionImagePicker
              value={option.image_url ?? ''}
              onChange={(url) => onChange({ image_url: url || null })}
              defaultLabel={option.label || ''}
            />
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              Price rule
            </div>
            <FormulaBuilder
              value={option.price_formula ?? ''}
              onChange={(formula) => onChange({ price_formula: formula || null })}
            />
          </div>

          <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              Per-option production overrides (optional)
            </div>
            <p className="mb-3 text-[11px] leading-snug text-neutral-500">
              Use when this option changes the turnaround or print method — e.g. a "Print Method" step where Digital = 1 day and Offset = 7 days. Leave blank to fall back to the product-level Lead time / Print method set in Basics.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                  Lead time for this option (working days)
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={option.lead_time_days ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    onChange({ lead_time_days: raw === '' ? null : Math.max(0, parseInt(raw, 10) || 0) });
                  }}
                  placeholder="e.g. 1"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                  Print method for this option
                </span>
                <input
                  value={option.print_mode ?? ''}
                  onChange={(e) => onChange({ print_mode: e.target.value || null })}
                  placeholder="e.g. Digital"
                  className={inputCls}
                />
              </label>
            </div>
          </div>

          <ShowIfEditor
            label="Visibility rule (optional)"
            hint="Hide this option unless another step equals a specific value — e.g. hide 310gsm card paper unless size is A5. Leave blank to always show."
            value={normalizeShowIf(option.show_if)}
            otherSteps={otherSteps}
            onChange={(v) => onChange({ show_if: v })}
          />

          <div className="flex justify-end border-t border-neutral-100 pt-3">
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={12} /> Remove option
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  // Use <div>, not <label>: nested <label> around ImageUpload causes the
  // browser to double-fire clicks (div's onClick + label's implicit
  // activate-form-control), which race and swallow the file input's
  // change event on Safari.
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-bold text-ink">{label}</span>
      {children}
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="mb-4 border-b border-neutral-100 pb-3">
        <div className="text-sm font-black text-ink">{title}</div>
        {desc && <div className="mt-0.5 text-[11px] text-neutral-500">{desc}</div>}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
