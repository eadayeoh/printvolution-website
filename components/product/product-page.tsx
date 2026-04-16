'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatSGD } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import { evaluateFormula } from '@/lib/pricing';
import type { ProductDetail } from '@/lib/data/products';
import { ChevronDown } from 'lucide-react';
import { productHref, type ProductLookup } from '@/lib/data/navigation-types';

type Props = {
  product: ProductDetail;
  productRoutes: ProductLookup;
};

export function ProductPage({ product, productRoutes }: Props) {
  const router = useRouter();
  const addToCart = useCart((s) => s.add);

  const [colIdx, setColIdx] = useState(0);
  const [rowIdx, setRowIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [cfgState, setCfgState] = useState<Record<string, string>>(() => {
    // Pre-select first option in each required swatch/select step
    const initial: Record<string, string> = {};
    for (const step of product.configurator) {
      if (step.type === 'swatch' || step.type === 'select') {
        if (step.options && step.options.length > 0) {
          initial[step.step_id] = step.options[0].slug;
        }
      }
      if (step.type === 'qty') initial[step.step_id] = '1';
    }
    return initial;
  });
  const [addedFlash, setAddedFlash] = useState(false);

  // Filter configurator steps by show_if
  const visibleSteps = useMemo(() => {
    return product.configurator.filter((step) => {
      if (!step.show_if) return true;
      return cfgState[step.show_if.step] === step.show_if.value;
    });
  }, [product.configurator, cfgState]);

  // Base price from the selected row/column
  const basePrice = useMemo(() => {
    if (!product.pricing) return 0;
    const row = product.pricing.rows[rowIdx];
    if (!row) return 0;
    return row.prices[colIdx] ?? row.prices[0] ?? 0;
  }, [product.pricing, rowIdx, colIdx]);

  // Qty from cfg (if configurator has a qty step), else 1
  const qty = useMemo(() => {
    const qtyStep = visibleSteps.find((s) => s.type === 'qty');
    if (!qtyStep) return 1;
    return parseInt(cfgState[qtyStep.step_id] || '1', 10) || 1;
  }, [visibleSteps, cfgState]);

  // Add-ons: sum up non-base option formulas
  const addons = useMemo(() => {
    let total = 0;
    for (const step of visibleSteps) {
      if (step.type === 'swatch' || step.type === 'select') {
        const selected = cfgState[step.step_id];
        const opt = step.options.find((o) => o.slug === selected);
        if (opt?.price_formula) {
          total += evaluateFormula(opt.price_formula, { qty, base: basePrice });
        }
      }
    }
    return total;
  }, [visibleSteps, cfgState, qty, basePrice]);

  const unitPrice = product.pricing ? basePrice + Math.round(addons / qty) : 0;
  const lineTotal = product.pricing ? basePrice + addons : 0;

  // Minimum price across all cells (for "From")
  const fromPrice = useMemo(() => {
    if (!product.pricing) return null;
    let min: number | null = null;
    for (const r of product.pricing.rows) {
      for (const p of r.prices) {
        if (typeof p === 'number' && (min === null || p < min)) min = p;
      }
    }
    return min;
  }, [product.pricing]);

  const heroColor = product.extras?.hero_color ?? '#0D0D0D';
  const heroBig = product.extras?.hero_big ?? product.name.toUpperCase();
  const h1 = product.extras?.h1 ?? product.name;
  const h1em = product.extras?.h1em ?? '';

  function handleAddToCart() {
    // Build a config summary of selected option labels
    const configLabels: Record<string, string> = {};
    for (const step of visibleSteps) {
      const val = cfgState[step.step_id];
      if (!val) continue;
      if (step.type === 'swatch' || step.type === 'select') {
        const opt = step.options.find((o) => o.slug === val);
        if (opt) configLabels[step.label] = opt.label;
      } else {
        configLabels[step.label] = val;
      }
    }
    // Also append the selected pricing config (e.g. size)
    if (product.pricing && product.pricing.configs[colIdx]) {
      configLabels[product.pricing.label] = product.pricing.configs[colIdx];
    }

    addToCart({
      product_slug: product.slug,
      product_name: product.name,
      icon: product.icon,
      config: configLabels,
      qty,
      unit_price_cents: unitPrice,
      line_total_cents: lineTotal,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  }

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-16 lg:px-12 lg:py-24" style={{ background: heroColor, color: 'white' }}>
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative z-10">
            <div className="mb-4 text-xs text-white/60">
              <Link href="/" className="hover:text-pink">Home</Link>
              {' › '}
              {product.category && (
                <>
                  <Link href={`/shop?category=${product.category.slug}`} className="hover:text-pink">
                    {product.category.name}
                  </Link>
                  {' › '}
                </>
              )}
              <span className="text-white">{product.name}</span>
            </div>
            {product.category && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink/40 px-3 py-1 text-[11px] font-bold text-pink">
                <span className="inline-block h-2 w-2 rounded-full bg-pink" />
                {product.category.name}
              </div>
            )}
            <h1 className="mb-4 text-4xl font-black leading-[1.05] tracking-tight lg:text-6xl">
              {h1}
              {h1em && <em className="block font-light italic not-italic text-pink lg:text-5xl"><span className="italic">{h1em}</span></em>}
            </h1>
            {product.tagline && <p className="mb-6 text-base text-white/70 lg:text-lg">{product.tagline}</p>}

            {product.extras?.chips && product.extras.chips.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {product.extras.chips.slice(0, 4).map((c, i) => (
                  <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90">
                    {c}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {fromPrice !== null && (
                <a
                  href="#pricing"
                  className="inline-flex items-center rounded-full bg-pink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-pink-dark"
                >
                  From <strong className="mx-1.5">{formatSGD(fromPrice)}</strong> · See Pricing →
                </a>
              )}
              <a
                href="https://wa.me/6585533497"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                💬 Quick enquiry
              </a>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="pointer-events-none absolute -top-4 text-[160px] font-black leading-none text-white/5 lg:text-[220px]">
              {heroBig}
            </div>
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full border-4 border-white/10 bg-white/5 text-[140px] lg:h-96 lg:w-96">
              {product.icon ?? '📦'}
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      {product.extras?.intro && (
        <section className="px-6 py-12 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <p className="text-lg leading-relaxed text-neutral-700">{product.extras.intro}</p>
          </div>
        </section>
      )}

      {/* WHY US */}
      {product.extras?.why_us && product.extras.why_us.length > 0 && (
        <section className="bg-neutral-50 px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-5xl">
            {product.extras.why_headline && (
              <h2
                className="mb-10 text-center text-3xl font-black leading-tight text-ink lg:text-5xl"
                dangerouslySetInnerHTML={{ __html: product.extras.why_headline }}
              />
            )}
            <div className="grid gap-6 md:grid-cols-2">
              {product.extras.why_us.map((w, i) => (
                <div key={i} className="flex gap-4 rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
                  <div className="text-3xl font-black text-pink">0{i + 1}</div>
                  <div className="text-sm font-semibold text-ink">{w}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONFIGURATOR + PRICING */}
      <section id="pricing" className="px-6 py-16 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-5">
          {/* Configurator column */}
          <div className="lg:col-span-3">
            <h2 className="mb-6 text-2xl font-black text-ink">Configure your order</h2>
            {visibleSteps.length === 0 ? (
              <p className="text-sm text-neutral-500">This product has no options. Choose quantity at checkout.</p>
            ) : (
              <div className="space-y-5">
                {visibleSteps.map((step) => (
                  <div key={step.step_id}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-bold text-ink">{step.label}</label>
                      {step.required && <span className="text-[10px] font-bold text-pink">Required</span>}
                    </div>

                    {step.type === 'swatch' && (
                      <div className="flex flex-wrap gap-2">
                        {step.options.map((opt) => (
                          <button
                            key={opt.slug}
                            onClick={() => setCfgState({ ...cfgState, [step.step_id]: opt.slug })}
                            className={`rounded-full border-2 px-4 py-2 text-xs font-semibold transition-all ${
                              cfgState[step.step_id] === opt.slug
                                ? 'border-pink bg-pink text-white'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-pink'
                            }`}
                          >
                            {opt.label}
                            {opt.note && <span className="ml-1 text-[9px] opacity-70">· {opt.note}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {step.type === 'select' && (
                      <select
                        value={cfgState[step.step_id] ?? ''}
                        onChange={(e) => setCfgState({ ...cfgState, [step.step_id]: e.target.value })}
                        className="w-full rounded border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-pink focus:outline-none"
                      >
                        {step.options.map((opt) => (
                          <option key={opt.slug} value={opt.slug}>
                            {opt.label}
                            {opt.note ? ` · ${opt.note}` : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    {step.type === 'text' && (
                      <input
                        type="text"
                        value={cfgState[step.step_id] ?? ''}
                        onChange={(e) => setCfgState({ ...cfgState, [step.step_id]: e.target.value })}
                        placeholder={step.step_config?.note ?? ''}
                        className="w-full rounded border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-pink focus:outline-none"
                      />
                    )}

                    {step.type === 'number' && (
                      <input
                        type="number"
                        min={step.step_config?.min ?? 0}
                        step={step.step_config?.step ?? 1}
                        value={cfgState[step.step_id] ?? ''}
                        onChange={(e) => setCfgState({ ...cfgState, [step.step_id]: e.target.value })}
                        className="w-32 rounded border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-pink focus:outline-none"
                      />
                    )}

                    {step.type === 'qty' && (
                      <div className="flex flex-wrap items-center gap-2">
                        {step.step_config?.presets?.map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setCfgState({ ...cfgState, [step.step_id]: String(preset) })}
                            className={`rounded-full border-2 px-4 py-1.5 text-xs font-semibold transition-all ${
                              cfgState[step.step_id] === String(preset)
                                ? 'border-pink bg-pink text-white'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-pink'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                        <input
                          type="number"
                          min={step.step_config?.min ?? 1}
                          step={step.step_config?.step ?? 1}
                          value={cfgState[step.step_id] ?? '1'}
                          onChange={(e) => setCfgState({ ...cfgState, [step.step_id]: e.target.value })}
                          className="w-24 rounded border-2 border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium focus:border-pink focus:outline-none"
                        />
                      </div>
                    )}

                    {step.step_config?.discount_note && (
                      <div className="mt-1 text-[11px] text-neutral-500">{step.step_config.discount_note}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pricing table */}
            {product.pricing && product.pricing.rows.length > 0 && (
              <div className="mt-10">
                <h3 className="mb-4 text-lg font-black text-ink">Pricing ladder</h3>
                <div className="overflow-x-auto rounded-lg border-2 border-ink">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ink text-white">
                        <th className="px-4 py-3 text-left font-bold">Qty</th>
                        {product.pricing.configs.map((cfg, i) => (
                          <th
                            key={i}
                            onClick={() => setColIdx(i)}
                            className={`cursor-pointer px-4 py-3 text-center font-bold transition-colors ${
                              i === colIdx ? 'bg-pink' : 'hover:bg-white/10'
                            }`}
                          >
                            {cfg}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.pricing.rows.map((r, ri) => (
                        <tr
                          key={ri}
                          onClick={() => setRowIdx(ri)}
                          className={`cursor-pointer border-t border-neutral-200 transition-colors ${
                            ri === rowIdx ? 'bg-pink/5' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <td className="px-4 py-3 font-bold text-ink">{r.qty}</td>
                          {r.prices.map((p, ci) => (
                            <td
                              key={ci}
                              className={`px-4 py-3 text-center font-semibold ${
                                ri === rowIdx && ci === colIdx ? 'text-pink' : 'text-neutral-700'
                              }`}
                            >
                              {typeof p === 'number' ? formatSGD(p) : p}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sticky summary */}
          <aside className="lg:col-span-2">
            <div className="sticky top-20 rounded-lg border-2 border-ink bg-white p-6 shadow-brand">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-pink">Your selection</div>
              <h3 className="mb-4 text-xl font-black text-ink">{product.name}</h3>

              <div className="mb-4 space-y-1 text-xs text-neutral-600">
                {product.pricing && (
                  <div className="flex justify-between">
                    <span>{product.pricing.label}:</span>
                    <span className="font-semibold text-ink">{product.pricing.configs[colIdx] ?? '-'}</span>
                  </div>
                )}
                {visibleSteps.filter((s) => s.type !== 'qty').map((step) => {
                  const val = cfgState[step.step_id];
                  if (!val) return null;
                  let label = val;
                  if (step.type === 'swatch' || step.type === 'select') {
                    label = step.options.find((o) => o.slug === val)?.label ?? val;
                  }
                  return (
                    <div key={step.step_id} className="flex justify-between">
                      <span>{step.label}:</span>
                      <span className="font-semibold text-ink">{label}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between">
                  <span>Qty:</span>
                  <span className="font-semibold text-ink">{qty}</span>
                </div>
              </div>

              <div className="mb-4 border-t-2 border-ink pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-neutral-600">Total</span>
                  <span className="text-3xl font-black text-pink">
                    {product.pricing ? formatSGD(lineTotal) : 'Quote'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="mb-2 w-full rounded-full bg-pink py-3 text-sm font-bold text-white transition-colors hover:bg-pink-dark"
              >
                {addedFlash ? '✓ Added to cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => { handleAddToCart(); router.push('/checkout'); }}
                className="w-full rounded-full border-2 border-ink bg-white py-3 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-white"
              >
                Order Now →
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* SPECS */}
      {product.specs.length > 0 && (
        <section className="bg-neutral-50 px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-2xl font-black text-ink">Specs</h2>
            <dl className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
              {product.specs.map((s, i) => (
                <div key={i} className="flex px-6 py-4 text-sm">
                  <dt className="w-40 font-semibold text-neutral-500">{s.label}</dt>
                  <dd className="flex-1 text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* FAQ */}
      {product.faqs.length > 0 && (
        <section className="px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-3xl font-black text-ink lg:text-4xl">FAQ</h2>
            <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
              {product.faqs.map((f, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-ink transition-colors hover:bg-neutral-50"
                  >
                    <span>{f.question}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="bg-neutral-50 px-6 py-4 text-sm text-neutral-700">{f.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {product.related.length > 0 && (
        <section className="bg-neutral-50 px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-3xl font-black text-ink">Related products</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {product.related.slice(0, 4).map((r) => (
                <Link
                  key={r.slug}
                  href={productHref(r.slug, productRoutes)}
                  className="group flex flex-col rounded-lg border-2 border-neutral-200 bg-white p-5 transition-all hover:border-ink hover:shadow-brand"
                >
                  <div className="mb-3 flex h-24 items-center justify-center rounded bg-neutral-50 text-4xl">
                    {r.icon ?? '📦'}
                  </div>
                  <h3 className="mb-1 text-sm font-bold text-ink group-hover:text-pink">{r.name}</h3>
                  {r.min_price !== null && (
                    <span className="mt-auto text-xs font-black text-pink">From {formatSGD(r.min_price)}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
