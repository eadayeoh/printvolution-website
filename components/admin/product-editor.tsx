'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';
import { updateProduct } from '@/app/admin/products/actions';
import { ImageUpload } from '@/components/admin/image-upload';
import type { ProductDetail } from '@/lib/data/products';
import { formatSGD } from '@/lib/utils';

type Cat = { id: string; slug: string; name: string; parent_id: string | null };
type Tab = 'basics' | 'pricing' | 'faqs' | 'content';

export function ProductEditor({ product, categories }: { product: ProductDetail; categories: Cat[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedFlash, setSavedFlash] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('basics');

  // All editable fields (local state)
  const [name, setName] = useState(product.name);
  const [icon, setIcon] = useState(product.icon ?? '');
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
  const [isGift, setIsGift] = useState(product.is_gift);
  const [highlights, setHighlights] = useState(product.highlights.join('\n'));
  const [specs, setSpecs] = useState<Array<{ label: string; value: string }>>(product.specs);

  // Extras
  const [seoTitle, setSeoTitle] = useState(product.extras?.seo_title ?? '');
  const [seoDesc, setSeoDesc] = useState(product.extras?.seo_desc ?? '');
  const [heroColor, setHeroColor] = useState(product.extras?.hero_color ?? '#0D0D0D');
  const [heroBig, setHeroBig] = useState(product.extras?.hero_big ?? '');
  const [h1, setH1] = useState(product.extras?.h1 ?? '');
  const [h1em, setH1em] = useState(product.extras?.h1em ?? '');
  const [intro, setIntro] = useState(product.extras?.intro ?? '');
  const [whyHeadline, setWhyHeadline] = useState(product.extras?.why_headline ?? '');
  const [whyUs, setWhyUs] = useState((product.extras?.why_us ?? []).join('\n'));
  const [chips, setChips] = useState((product.extras?.chips ?? []).join('\n'));
  const [imageUrl, setImageUrl] = useState(product.extras?.image_url ?? '');

  // Pricing (cents in backend, dollars in UI)
  const [pricingLabel, setPricingLabel] = useState(product.pricing?.label ?? 'Size');
  const [pricingConfigs, setPricingConfigs] = useState<string[]>(product.pricing?.configs ?? ['Standard']);
  const [pricingRows, setPricingRows] = useState<Array<{ qty: string; prices: string[] }>>(
    (product.pricing?.rows ?? [{ qty: '1 pc', prices: [0] }]).map((r) => ({
      qty: r.qty,
      prices: r.prices.map((p) => (p / 100).toFixed(2)),
    }))
  );

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
        highlights: highlights.split('\n').map((s) => s.trim()).filter(Boolean),
        specs: specs.filter((s) => s.label.trim() || s.value.trim()),
        seo_title: seoTitle || null, seo_desc: seoDesc || null,
        hero_color: heroColor || null, hero_big: heroBig || null,
        h1: h1 || null, h1em: h1em || null,
        intro: intro || null, why_headline: whyHeadline || null,
        why_us: whyUs.split('\n').map((s) => s.trim()).filter(Boolean),
        chips: chips.split('\n').map((s) => s.trim()).filter(Boolean),
        image_url: imageUrl || null,
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
            {t === 'content' && 'SEO & Content'}
            {t === 'pricing' && `Pricing & Options${configurator.length > 0 ? ` (${configurator.length})` : ''}`}
            {t === 'faqs' && `FAQs (${faqs.length})`}
          </button>
        ))}
      </div>

      {/* Basics */}
      {tab === 'basics' && (
        <div className="grid max-w-4xl gap-5 rounded-lg border border-neutral-200 bg-white p-6">
          <Field label="Product name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Thumbnail image">
            <ImageUpload value={icon} onChange={setIcon} prefix={`product-${product.slug}`} label="Thumbnail" />
          </Field>
          <Field label="Tagline (1-line hook)">
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
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
          <Field label="Highlights (one per line)">
            <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={5} className={inputCls} />
          </Field>
          <div>
            <div className="mb-1 text-xs font-bold text-ink">Specs</div>
            {specs.map((s, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input
                  value={s.label}
                  onChange={(e) => setSpecs(specs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  placeholder="Label"
                  className={`${inputCls} w-40`}
                />
                <input
                  value={s.value}
                  onChange={(e) => setSpecs(specs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                  placeholder="Value"
                  className={`${inputCls} flex-1`}
                />
                <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="text-red-600 hover:text-red-700">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setSpecs([...specs, { label: '', value: '' }])}
              className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
              <Plus size={12} /> Add spec
            </button>
          </div>
          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
              <span className="font-semibold text-ink">Gift product</span>
            </label>
          </div>
        </div>
      )}

      {/* SEO & Content */}
      {tab === 'content' && (
        <div className="grid max-w-4xl gap-5 rounded-lg border border-neutral-200 bg-white p-6">
          <Field label="SEO title">
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="SEO description">
            <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} className={inputCls} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Hero background color">
              <input type="color" value={heroColor} onChange={(e) => setHeroColor(e.target.value)} className="h-10 w-20 cursor-pointer rounded" />
            </Field>
            <Field label='Hero big text (watermark behind icon)'>
              <input value={heroBig} onChange={(e) => setHeroBig(e.target.value)} className={inputCls} placeholder="BANNERS" />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="H1 text">
              <input value={h1} onChange={(e) => setH1(e.target.value)} className={inputCls} />
            </Field>
            <Field label="H1 italic sub (em)">
              <input value={h1em} onChange={(e) => setH1em(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Intro paragraph">
            <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={4} className={inputCls} />
          </Field>
          <Field label="Why us headline (HTML ok, e.g. 'Line 1<br><em>Line 2</em>')">
            <input value={whyHeadline} onChange={(e) => setWhyHeadline(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Why us bullets (one per line)">
            <textarea value={whyUs} onChange={(e) => setWhyUs(e.target.value)} rows={4} className={inputCls} />
          </Field>
          <Field label="Trust chips (one per line, shown in hero)">
            <textarea value={chips} onChange={(e) => setChips(e.target.value)} rows={3} className={inputCls} />
          </Field>
          <Field label="Hero image (shown on product page hero)">
            <ImageUpload value={imageUrl} onChange={setImageUrl} prefix={`hero-${product.slug}`} label="Hero image" size="lg" />
          </Field>
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

/** Configurator editor as a separate sub-component */
function ConfiguratorEditor({ steps, setSteps }: { steps: ProductDetail['configurator']; setSteps: (s: ProductDetail['configurator']) => void }) {
  function update(i: number, patch: Partial<ProductDetail['configurator'][0]>) {
    setSteps(steps.map((s, j) => j === i ? { ...s, ...patch } as any : s));
  }
  return (
    <div className="max-w-5xl space-y-4">
      {steps.map((s, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <input value={s.step_id} onChange={(e) => update(i, { step_id: e.target.value })}
                className={`${inputCls} w-28 font-mono text-xs`} placeholder="step_id" />
              <input value={s.label} onChange={(e) => update(i, { label: e.target.value })}
                className={`${inputCls} w-56`} placeholder="Label" />
              <select value={s.type} onChange={(e) => update(i, { type: e.target.value as any })}
                className={`${inputCls} w-32`}>
                <option value="swatch">swatch</option>
                <option value="select">select</option>
                <option value="text">text</option>
                <option value="qty">qty</option>
                <option value="number">number</option>
              </select>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={s.required} onChange={(e) => update(i, { required: e.target.checked })} />
                required
              </label>
            </div>
            <button type="button" onClick={() => setSteps(steps.filter((_, j) => j !== i))}
              className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
          </div>

          {(s.type === 'swatch' || s.type === 'select') && (
            <div>
              <div className="mb-2 text-[11px] font-bold text-neutral-500">Options:</div>
              <div className="space-y-1">
                {(s.options ?? []).map((opt, oi) => (
                  <div key={oi} className="flex gap-1">
                    <input
                      value={opt.slug}
                      onChange={(e) => update(i, { options: (s.options ?? []).map((x, j) => j === oi ? { ...x, slug: e.target.value } : x) })}
                      placeholder="slug"
                      className={`${inputCls} w-24 font-mono text-[11px]`}
                    />
                    <input
                      value={opt.label}
                      onChange={(e) => update(i, { options: (s.options ?? []).map((x, j) => j === oi ? { ...x, label: e.target.value } : x) })}
                      placeholder="Label"
                      className={`${inputCls} flex-1`}
                    />
                    <input
                      value={opt.note ?? ''}
                      onChange={(e) => update(i, { options: (s.options ?? []).map((x, j) => j === oi ? { ...x, note: e.target.value } : x) })}
                      placeholder="Note"
                      className={`${inputCls} w-32`}
                    />
                    <input
                      value={opt.price_formula ?? ''}
                      onChange={(e) => update(i, { options: (s.options ?? []).map((x, j) => j === oi ? { ...x, price_formula: e.target.value } : x) })}
                      placeholder="price_formula"
                      className={`${inputCls} w-48 font-mono text-[11px]`}
                    />
                    <button type="button" onClick={() => update(i, { options: (s.options ?? []).filter((_, j) => j !== oi) })}
                      className="text-red-600 hover:text-red-700"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => update(i, { options: [...(s.options ?? []), { slug: 'new', label: 'New', price_formula: '0' }] })}
                className="mt-2 flex items-center gap-1 rounded border border-neutral-200 px-2 py-0.5 text-[11px] font-bold text-ink hover:border-ink">
                <Plus size={10} /> Add option
              </button>
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={() => setSteps([...steps, {
        step_id: `step${steps.length + 1}`, label: 'New step', type: 'swatch', required: false, step_order: steps.length,
        options: [], show_if: null, step_config: null,
      } as any])}
        className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1 text-xs font-bold text-ink hover:border-ink">
        <Plus size={12} /> Add configurator step
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}
const inputCls = 'w-full rounded border-2 border-neutral-200 bg-white px-3 py-2 text-sm focus:border-pink focus:outline-none';
