'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatSGD } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import { evaluateFormula } from '@/lib/pricing';
import type { ProductDetail } from '@/lib/data/products';
import { productHref, type ProductLookup } from '@/lib/data/navigation-types';

type Props = {
  product: ProductDetail;
  productRoutes: ProductLookup;
};

const USE_CASE_COLORS = ['#E91E8C', '#00B8D9', '#FFD100', '#E91E8C', '#00B8D9', '#FFD100'];

export function ProductPage({ product, productRoutes }: Props) {
  const router = useRouter();
  const addToCart = useCart((s) => s.add);

  // colIdx is only used for the price-ladder + matrix fallback. If the
  // configurator has a 'size' step, it's derived from that selection; otherwise
  // it's a manual state (rare — only for products without a size step).
  const [manualColIdx, setManualColIdx] = useState(0);
  const [rowIdx, setRowIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [designFilesUrl, setDesignFilesUrl] = useState('');
  const [cfgState, setCfgState] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const step of product.configurator) {
      if (step.type === 'swatch' || step.type === 'select') {
        if (step.options && step.options.length > 0) initial[step.step_id] = step.options[0].slug;
      }
      if (step.type === 'qty') initial[step.step_id] = '1';
    }
    return initial;
  });
  const [addedFlash, setAddedFlash] = useState(false);

  const visibleSteps = useMemo(
    () => product.configurator.filter((step) => !step.show_if || cfgState[step.show_if.step] === step.show_if.value),
    [product.configurator, cfgState]
  );

  const qty = useMemo(() => {
    const qtyStep = visibleSteps.find((s) => s.type === 'qty');
    if (!qtyStep) return 1;
    return parseInt(cfgState[qtyStep.step_id] || '1', 10) || 1;
  }, [visibleSteps, cfgState]);

  // Derive colIdx from the configurator's "size" step if present.
  // This keeps the price ladder (which uses pricing.rows columns) in sync with
  // the user's configurator selection.
  const colIdx = useMemo(() => {
    const sizeStep = visibleSteps.find(
      (s) => (s.type === 'swatch' || s.type === 'select') && /size|dimension/i.test(s.label)
    ) || visibleSteps.find((s) => s.type === 'swatch' && s.options.length > 1);
    if (sizeStep && product.pricing) {
      const selected = cfgState[sizeStep.step_id];
      const idx = sizeStep.options.findIndex((o) => o.slug === selected);
      if (idx >= 0 && idx < product.pricing.configs.length) return idx;
    }
    return manualColIdx;
  }, [visibleSteps, cfgState, product.pricing, manualColIdx]);

  // Core pricing engine — sums formula-based options, falls back to matrix
  function computeTotal(useQty: number, useColIdx: number, useRowIdx: number): {
    total: number; breakdown: Array<{ label: string; amount: number }>;
  } {
    const breakdown: Array<{ label: string; amount: number }> = [];
    let formulaSum = 0;

    // Options with price_formula — these ARE the line items (not add-ons)
    for (const step of visibleSteps) {
      if (step.type !== 'swatch' && step.type !== 'select') continue;
      const selected = cfgState[step.step_id];
      const opt = step.options.find((o) => o.slug === selected);
      if (opt?.price_formula) {
        const value = evaluateFormula(opt.price_formula, { qty: useQty, base: 0 });
        formulaSum += value;
        breakdown.push({ label: `${step.label}: ${opt.label}`, amount: value });
      }
    }

    // If no formulas at all, use the pricing matrix row × col
    if (formulaSum === 0 && product.pricing) {
      const row = product.pricing.rows[useRowIdx] ?? product.pricing.rows[0];
      const matrixPrice = row?.prices[useColIdx] ?? 0;
      if (matrixPrice > 0) {
        breakdown.push({
          label: `${product.pricing.label}: ${product.pricing.configs[useColIdx] ?? ''} (${row?.qty ?? ''})`,
          amount: matrixPrice,
        });
        formulaSum = matrixPrice;
      }
    }

    return { total: formulaSum, breakdown };
  }

  const { total: lineTotal, breakdown } = useMemo(
    () => computeTotal(qty, colIdx, rowIdx),
    [qty, colIdx, rowIdx, cfgState, visibleSteps, product.pricing]
  );

  const unitPrice = qty > 0 ? Math.round(lineTotal / qty) : 0;

  const fromPrice = useMemo(() => {
    // Minimum reachable price: try qty=1 with each size column
    if (!product.pricing) return null;
    let min: number | null = null;
    for (let i = 0; i < product.pricing.configs.length; i++) {
      const { total } = computeTotal(1, i, 0);
      if (total > 0 && (min === null || total < min)) min = total;
    }
    // Fallback to matrix if no formulas produced a price
    if (min === null) {
      for (const r of product.pricing.rows) for (const p of r.prices) if (typeof p === 'number' && p > 0 && (min === null || p < min)) min = p;
    }
    return min;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.pricing, cfgState]);

  // Price at every quantity — RECOMPUTES via formulas at each tier
  const priceLadder = useMemo(() => {
    if (!product.pricing) return [];
    // Compute at qty=1 for per-piece baseline (for "you save" comparison)
    const { total: singleTotal } = computeTotal(1, colIdx, 0);
    return product.pricing.rows.map((r, rIdx) => {
      const qtyNum = parseInt((r.qty.match(/\d+/) ?? ['1'])[0], 10) || 1;
      const { total } = computeTotal(qtyNum, colIdx, rIdx);
      const undiscountedTotal = singleTotal * qtyNum;
      return {
        qty: r.qty,
        total,
        perPiece: qtyNum > 0 ? total / qtyNum : total,
        saves: Math.max(0, undiscountedTotal - total),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.pricing, colIdx, cfgState, visibleSteps]);

  const heroColor = product.extras?.hero_color ?? '#0D0D0D';
  const heroBig = product.extras?.hero_big ?? product.name.toUpperCase();
  const h1 = product.extras?.h1 ?? product.name;
  const h1em = product.extras?.h1em ?? '';

  function handleAddToCart() {
    const configLabels: Record<string, string> = {};
    for (const step of visibleSteps) {
      const val = cfgState[step.step_id];
      if (!val) continue;
      if (step.type === 'swatch' || step.type === 'select') {
        const opt = step.options.find((o) => o.slug === val);
        if (opt) configLabels[step.label] = opt.label;
      } else configLabels[step.label] = val;
    }
    if (product.pricing && product.pricing.configs[colIdx]) {
      configLabels[product.pricing.label] = product.pricing.configs[colIdx];
    }
    if (designFilesUrl.trim()) configLabels['Design files'] = designFilesUrl.trim();
    addToCart({
      product_slug: product.slug, product_name: product.name, icon: product.icon,
      config: configLabels, qty, unit_price_cents: unitPrice, line_total_cents: lineTotal,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  }

  const useCases = product.extras?.use_cases ?? [];

  const DOTTED_BG = {
    background: '#fafaf7',
    backgroundImage: 'radial-gradient(circle, #e8e4dc 1.2px, transparent 1.2px)',
    backgroundSize: '22px 22px',
  };

  // Render either an image URL or an emoji for the product icon
  function ProductImage({ src, fallback, size }: { src: string | null; fallback: string; size: number }) {
    if (src && (src.startsWith('http') || src.startsWith('/'))) {
      return <img src={src} alt="" style={{ width: size, height: size, objectFit: 'cover' }} />;
    }
    return <span style={{ fontSize: size * 0.8, lineHeight: 1 }}>{src || fallback}</span>;
  }

  return (
    <>
      {/* HERO — editorial split, pink pill, serif h1 em, green CTA */}
      <section style={{ ...DOTTED_BG, padding: '64px 28px 80px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            {' › '}
            {product.category && (
              <Link href={`/shop?category=${product.category.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {product.category.name}
              </Link>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 48, alignItems: 'center' }} className="pv-hero-split-grid">
            <div>
              {product.category && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 18px', border: '2px solid #E91E8C', borderRadius: 999,
                  fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
                  color: '#E91E8C', background: '#fff', marginBottom: 28,
                }}>
                  <span style={{ fontSize: 16, lineHeight: 0 }}>◎</span>
                  {product.category.name}
                </div>
              )}

              <h1 style={{
                fontFamily: 'var(--sans)', fontSize: 'clamp(42px, 6vw, 84px)',
                fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.02em',
                margin: 0, color: '#0a0a0a',
              }}>
                {h1}
              </h1>
              {h1em && (
                <h2 style={{
                  fontFamily: 'var(--sans)', fontSize: 'clamp(32px, 4.5vw, 64px)',
                  fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em',
                  margin: '12px 0 0', color: '#E91E8C',
                }}>
                  {h1em}
                </h2>
              )}

              {product.tagline && (
                <p style={{ fontSize: 16, color: '#555', lineHeight: 1.6, margin: '28px 0 22px', maxWidth: 520 }}>
                  {product.tagline}
                </p>
              )}

              {product.extras?.chips && product.extras.chips.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
                  {product.extras.chips.slice(0, 4).map((c, i) => (
                    <span key={i} style={{
                      padding: '8px 14px', border: '1.5px solid #e5e5e5',
                      borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#555',
                      background: '#fff',
                    }}>
                      {c.replace(/^[^a-zA-Z0-9]+/, '').trim()}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {fromPrice !== null && (
                  <a
                    href="#pricing"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '16px 26px', borderRadius: 999,
                      background: '#22c55e', color: '#fff',
                      fontSize: 14, fontWeight: 800, letterSpacing: 0.3,
                      textDecoration: 'none', border: 'none',
                      boxShadow: '0 4px 0 #0a0a0a',
                    }}
                  >
                    From <strong style={{ fontSize: 16 }}>{formatSGD(fromPrice)}</strong> &middot; See Pricing →
                  </a>
                )}
                <a
                  href="https://wa.me/6585533497"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '16px 26px', borderRadius: 999,
                    background: '#fff', color: '#0a0a0a',
                    fontSize: 14, fontWeight: 800, letterSpacing: 0.3,
                    textDecoration: 'none', border: '2px solid #22c55e',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', background: '#22c55e',
                    color: '#fff', display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12,
                  }}>💬</span>
                  WhatsApp Us
                </a>
              </div>
            </div>

            {/* Hero art — large watermark + device-frame mockup */}
            <div style={{ position: 'relative', minHeight: 520 }}>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  fontFamily: 'var(--sans)', fontWeight: 900, fontSize: 'clamp(80px, 12vw, 160px)',
                  letterSpacing: '-0.04em', color: 'rgba(233,30,140,0.08)',
                  textAlign: 'center', lineHeight: 0.9,
                }}>
                  {heroBig}
                </div>
              </div>
              <div style={{
                position: 'relative', width: 320, height: 460, margin: '0 auto',
                borderRadius: 32, border: '4px solid #0a0a0a',
                boxShadow: '12px 12px 0 #E91E8C',
                background: product.extras?.image_url ? `url(${product.extras.image_url}) center/cover` : '#fff',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
                padding: 18, overflow: 'hidden',
              }}>
                {!product.extras?.image_url && (
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: '#0a0a0a',
                  }}>
                    {product.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CMYK bar separator */}
      <div style={{ display: 'flex', height: 6 }}>
        <div style={{ flex: 1, background: '#E91E8C' }} />
        <div style={{ flex: 1, background: '#00B8D9' }} />
        <div style={{ flex: 1, background: '#FFD100' }} />
        <div style={{ flex: 1, background: '#0a0a0a' }} />
      </div>

      {/* CONFIGURATOR + STICKY ORDER */}
      <section id="pricing" style={{ ...DOTTED_BG, padding: '64px 28px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 40 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 20 }}>
              Configure your order
            </div>

            {/* Configurator steps (single source of truth). For each swatch/select
                option that has a price_formula, show its price at current qty inline. */}
            {visibleSteps.map((step) => {
              if (step.type === 'qty') return null; // qty rendered separately below
              return (
                <div key={step.step_id} style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 10 }}>
                    {step.label} {step.required && <span style={{ color: '#E91E8C' }}>*</span>}
                  </label>

                  {(step.type === 'swatch' || step.type === 'select') && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {step.options.map((opt, oi) => {
                        const isActive = cfgState[step.step_id] === opt.slug;
                        // Compute this option's price at current qty for inline label
                        const optPrice = opt.price_formula
                          ? evaluateFormula(opt.price_formula, { qty, base: 0 })
                          : null;
                        // Show price only if > 0 (skip 'add-on' options with price 0)
                        const showPrice = optPrice !== null && optPrice > 0;
                        return (
                          <button
                            key={opt.slug}
                            type="button"
                            onClick={() => setCfgState({ ...cfgState, [step.step_id]: opt.slug })}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 10,
                              padding: '12px 20px', borderRadius: 8,
                              border: `2px solid ${isActive ? '#E91E8C' : '#e5e5e5'}`,
                              background: '#fff', cursor: 'pointer',
                              fontFamily: 'var(--sans)',
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{opt.label}</span>
                            {showPrice && (
                              <span style={{ fontSize: 12, color: isActive ? '#E91E8C' : '#888', fontWeight: 700 }}>
                                {formatSGD(optPrice)}
                              </span>
                            )}
                            {opt.note && (
                              <span style={{
                                fontSize: 9, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
                                color: isActive ? '#E91E8C' : '#888',
                              }}>
                                {opt.note}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {step.type === 'text' && (
                    <input
                      type="text"
                      value={cfgState[step.step_id] ?? ''}
                      onChange={(e) => setCfgState({ ...cfgState, [step.step_id]: e.target.value })}
                      placeholder={step.step_config?.note ?? ''}
                      className="pv-checkout-input"
                    />
                  )}

                  {step.type === 'number' && (
                    <input
                      type="number"
                      min={step.step_config?.min ?? 0}
                      step={step.step_config?.step ?? 1}
                      value={cfgState[step.step_id] ?? ''}
                      onChange={(e) => setCfgState({ ...cfgState, [step.step_id]: e.target.value })}
                      className="pv-checkout-input"
                      style={{ width: 160 }}
                    />
                  )}
                </div>
              );
            })}

            {/* Quantity block */}
            {(() => {
              const qtyStep = visibleSteps.find((s) => s.type === 'qty');
              if (!qtyStep) return null;
              return (
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 10 }}>
                    Quantity {qtyStep.required && <span style={{ color: '#E91E8C' }}>*</span>}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <input
                      type="number"
                      min={qtyStep.step_config?.min ?? 1}
                      step={qtyStep.step_config?.step ?? 1}
                      value={cfgState[qtyStep.step_id] ?? '1'}
                      onChange={(e) => setCfgState({ ...cfgState, [qtyStep.step_id]: e.target.value })}
                      className="pv-checkout-input"
                      style={{ width: 110 }}
                    />
                    <span style={{ fontSize: 12, color: '#888' }}>
                      Min {qtyStep.step_config?.min ?? 1} pc &middot; Price updates automatically
                    </span>
                  </div>
                  {qtyStep.step_config?.discount_note && (
                    <div style={{
                      marginTop: 12, padding: '10px 14px', border: '1px solid #bbf7d0',
                      background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 600,
                      borderRadius: 6,
                    }}>
                      💚 {qtyStep.step_config.discount_note}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Price line */}
            {product.pricing && (
              <div style={{ marginTop: 8, padding: '20px 24px', background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 8 }}>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 26, fontWeight: 800, color: '#0a0a0a' }}>
                  {formatSGD(lineTotal)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#E91E8C' }}>
                  {formatSGD(unitPrice)}/pc
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                  Estimated price &middot; Final confirmed at checkout
                </div>
              </div>
            )}
          </div>

          {/* Sticky "Your order" panel */}
          <aside>
            <div style={{ position: 'sticky', top: 80 }}>
              <div style={{
                background: '#fff', border: '2px solid #0a0a0a',
                boxShadow: '6px 6px 0 #E91E8C', overflow: 'hidden',
              }}>
                <div style={{
                  background: '#E91E8C', color: '#fff',
                  padding: '14px 22px', fontSize: 11, fontWeight: 800,
                  letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  Your Order
                </div>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 800, color: '#0a0a0a' }}>
                    {product.name}
                  </div>
                </div>

                <dl style={{ padding: '14px 22px 4px', margin: 0 }}>
                  {visibleSteps.filter((s) => s.type !== 'qty').map((step) => {
                    const val = cfgState[step.step_id];
                    if (!val) return null;
                    let label = val;
                    if (step.type === 'swatch' || step.type === 'select') {
                      label = step.options.find((o) => o.slug === val)?.label ?? val;
                    }
                    return <Row key={step.step_id} label={step.label} value={label} />;
                  })}
                  <Row label="Quantity" value={`${qty} pc${qty !== 1 ? 's' : ''}`} />
                </dl>

                {/* Price breakdown */}
                {breakdown.length > 0 && (
                  <div style={{ padding: '10px 22px 14px', borderTop: '1px dashed #f0f0f0' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>
                      Price breakdown
                    </div>
                    {breakdown.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', padding: '3px 0', gap: 12 }}>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.label}</span>
                        <span style={{ fontWeight: 700, color: '#0a0a0a', fontVariantNumeric: 'tabular-nums' }}>{formatSGD(b.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ padding: '14px 22px', background: 'rgba(233,30,140,.04)', borderTop: '1px dashed #f0c9dc', borderBottom: '1px dashed #f0c9dc' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#888' }}>Total</span>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 32, fontWeight: 900, color: '#E91E8C', letterSpacing: '-0.02em' }}>
                      {product.pricing ? formatSGD(lineTotal) : 'Quote'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '18px 22px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 8 }}>
                    Design files
                  </div>
                  <input
                    type="text"
                    value={designFilesUrl}
                    onChange={(e) => setDesignFilesUrl(e.target.value)}
                    placeholder="Paste Drive, Dropbox or WeTransfer link"
                    className="pv-checkout-input"
                    style={{ marginBottom: 6 }}
                  />
                  <div style={{ fontSize: 11, color: '#888' }}>
                    Or send your files later via WhatsApp after ordering.
                  </div>
                </div>

                <div style={{ padding: '0 22px 22px' }}>
                  <button
                    onClick={handleAddToCart}
                    style={{
                      display: 'block', width: '100%', padding: '14px',
                      borderRadius: 999, background: '#E91E8C', color: '#fff',
                      fontSize: 13, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
                      border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)',
                    }}
                  >
                    {addedFlash ? '✓ Added to cart' : 'Add to Cart'}
                  </button>
                </div>

                <div style={{ padding: '14px 22px', background: '#fafafa', fontSize: 12, color: '#555', lineHeight: 2 }}>
                  <div>✓ Pre-press file check</div>
                  <div>✓ Mockup before print</div>
                  <div>✓ Island-wide delivery</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* PRICE AT EVERY QUANTITY */}
      {priceLadder.length > 1 && (
        <section style={{ ...DOTTED_BG, padding: '0 28px 64px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{
              border: '2px solid #0a0a0a', boxShadow: '6px 6px 0 #E91E8C',
              background: '#fff', overflow: 'hidden',
            }}>
              <div style={{ background: '#0a0a0a', color: '#fff', padding: '14px 22px', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
                Price at every quantity
              </div>
              <div style={{ padding: '10px 22px', fontSize: 12, color: '#888', borderBottom: '1px solid #eee' }}>
                Based on your current selections — updates as you configure
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0a0a0a', color: '#fff' }}>
                    <th style={{ padding: '12px 22px', textAlign: 'left', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>QTY</th>
                    <th style={{ padding: '12px 22px', textAlign: 'left', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>TOTAL PRICE</th>
                    <th style={{ padding: '12px 22px', textAlign: 'left', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>PER PIECE</th>
                    <th style={{ padding: '12px 22px', textAlign: 'left', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>YOU SAVE</th>
                  </tr>
                </thead>
                <tbody>
                  {priceLadder.map((r, i) => (
                    <tr
                      key={i}
                      onClick={() => setRowIdx(i)}
                      style={{
                        background: i === rowIdx ? 'rgba(233,30,140,.06)' : '#fff',
                        cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                      }}
                    >
                      <td style={{ padding: '14px 22px', fontSize: 14, fontWeight: 700, color: i === rowIdx ? '#E91E8C' : '#0a0a0a' }}>{r.qty}</td>
                      <td style={{ padding: '14px 22px', fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>{formatSGD(r.total)}</td>
                      <td style={{ padding: '14px 22px', fontSize: 13, color: '#888' }}>{formatSGD(Math.round(r.perPiece))}/pc</td>
                      <td style={{ padding: '14px 22px', fontSize: 13, color: r.saves > 0 ? '#22c55e' : '#bbb', fontWeight: r.saves > 0 ? 700 : 400 }}>
                        {r.saves > 0 ? `Save ${formatSGD(r.saves)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* DESCRIPTION + SPECIFICATIONS */}
      {(product.extras?.intro || product.specs.length > 0) && (
        <section style={{ ...DOTTED_BG, padding: '0 28px 64px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 48, alignItems: 'start' }} className="pv-desc-grid">
              <div>
                {product.extras?.intro && (
                  <p style={{ fontSize: 16, color: '#333', lineHeight: 1.75, marginBottom: 24 }}>
                    {product.extras.intro}
                  </p>
                )}
                {product.highlights.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                    {product.highlights.map((h, i) => (
                      <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, color: '#333' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E91E8C', marginTop: 8, flexShrink: 0 }} />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {product.specs.length > 0 && (
                <aside style={{
                  background: '#fff', border: '2px solid #0a0a0a',
                  boxShadow: '6px 6px 0 #FFD100', padding: '22px 26px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
                    Specifications
                  </div>
                  <dl style={{ margin: 0 }}>
                    {product.specs.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < product.specs.length - 1 ? '1px solid #f5f5f5' : 'none', fontSize: 12, gap: 12 }}>
                        <dt style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#888' }}>{s.label}</dt>
                        <dd style={{ margin: 0, color: '#0a0a0a', fontWeight: 600, textAlign: 'right' }}>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </aside>
              )}
            </div>
          </div>
        </section>
      )}

      {/* USE CASES — CMYK-bordered cards */}
      {useCases.length > 0 && (
        <section style={{ ...DOTTED_BG, padding: '64px 28px', borderTop: '1px solid #e8e4dc' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{
              display: 'inline-block', padding: '6px 14px', border: '1.5px solid #E91E8C',
              borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: 2,
              textTransform: 'uppercase', color: '#E91E8C', marginBottom: 24,
            }}>
              Who orders this
            </div>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(32px,4.5vw,60px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', margin: '0 0 6px', color: '#0a0a0a' }}>
              Built for
            </h2>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(32px,4.5vw,60px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', margin: '0 0 36px', color: '#E91E8C' }}>
              every scenario.
            </h2>

            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {useCases.map((uc: any, i: number) => {
                let title = '', desc = '';
                if (typeof uc === 'string') {
                  const parts = uc.split('—');
                  title = (parts[0] ?? '').trim();
                  desc = (parts[1] ?? '').trim();
                } else {
                  title = uc.title ?? '';
                  desc = uc.desc ?? '';
                }
                const color = USE_CASE_COLORS[i % USE_CASE_COLORS.length];
                return (
                  <div
                    key={i}
                    style={{
                      background: '#fff', padding: '22px 26px',
                      border: '2px solid #0a0a0a',
                      boxShadow: `6px 6px 0 ${color}`,
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a', marginBottom: 8, letterSpacing: '-0.01em' }}>
                      {title}
                    </div>
                    {desc && <div style={{ fontSize: 13, color: '#555', lineHeight: 1.65 }}>{desc}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* WHY US — dark section */}
      {product.extras?.why_us && product.extras.why_us.length > 0 && (
        <section style={{ background: '#0a0a0a', color: '#fff', padding: '72px 28px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{
              display: 'inline-block', padding: '6px 14px', border: '1.5px solid #E91E8C',
              borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: 2,
              textTransform: 'uppercase', color: '#E91E8C', marginBottom: 20,
            }}>
              Why us
            </div>
            {product.extras.why_headline && (
              <h2
                style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(30px,4vw,56px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '0 0 40px', color: '#fff' }}
                dangerouslySetInnerHTML={{ __html: product.extras.why_headline }}
              />
            )}
            <div style={{
              display: 'grid', gap: 1,
              gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
              background: '#1a1a1a', border: '1px solid #1a1a1a',
            }}>
              {product.extras.why_us.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 18, padding: '30px 26px', background: '#0a0a0a', alignItems: 'flex-start' }}>
                  <div style={{
                    fontFamily: 'var(--sans)', fontSize: 34, fontWeight: 900,
                    color: USE_CASE_COLORS[i % USE_CASE_COLORS.length], lineHeight: 1,
                    flexShrink: 0, letterSpacing: '-0.02em',
                  }}>
                    0{i + 1}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', lineHeight: 1.7 }}>{w}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {product.faqs.length > 0 && (
        <section style={{ ...DOTTED_BG, padding: '64px 28px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{
              display: 'inline-block', padding: '6px 14px', border: '1.5px solid #E91E8C',
              borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: 2,
              textTransform: 'uppercase', color: '#E91E8C', marginBottom: 20,
            }}>
              FAQ
            </div>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '0 0 32px', color: '#0a0a0a' }}>
              Common questions.
            </h2>
            <div style={{ background: '#fff', border: '2px solid #0a0a0a', boxShadow: '6px 6px 0 #00B8D9' }}>
              {product.faqs.map((f, i) => (
                <div key={i} style={{ borderBottom: i < product.faqs.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      padding: '18px 24px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', cursor: 'pointer', gap: 16,
                      fontSize: 14, fontWeight: 700, color: '#0a0a0a',
                    }}
                  >
                    <span>{f.question}</span>
                    <span style={{ fontSize: 18, color: '#E91E8C', flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
                  </div>
                  {openFaq === i && (
                    <div style={{ padding: '0 24px 18px', fontSize: 13, color: '#555', lineHeight: 1.75 }}>{f.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RELATED */}
      {product.related.length > 0 && (
        <section style={{ background: '#fff', padding: '64px 28px', borderTop: '1px solid #eee' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 8 }}>
              Related products
            </div>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 24px', color: '#0a0a0a' }}>
              You might also like.
            </h2>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {product.related.slice(0, 4).map((r) => (
                <Link
                  key={r.slug}
                  href={productHref(r.slug, productRoutes)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 18,
                    background: '#fff', border: '2px solid #e5e5e5',
                    textDecoration: 'none', transition: 'all .15s',
                  }}
                >
                  <div style={{ width: 48, height: 48, background: '#fafaf7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    <ProductImage src={r.icon} fallback="📦" size={40} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>{r.name}</div>
                    {r.min_price !== null && (
                      <div style={{ fontSize: 11, color: '#E91E8C', fontWeight: 700 }}>From {formatSGD(r.min_price)}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          .pv-hero-split-grid { grid-template-columns: 1fr !important; }
          .pv-desc-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1000px) {
          section[id="pricing"] > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: 12, gap: 12 }}>
      <dt style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#888' }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0a0a0a', textAlign: 'right' }}>{value}</dd>
    </div>
  );
}
