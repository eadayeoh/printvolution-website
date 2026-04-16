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

export function ProductPage({ product, productRoutes }: Props) {
  const router = useRouter();
  const addToCart = useCart((s) => s.add);

  const [manualColIdx, setManualColIdx] = useState(0);
  const [rowIdx, setRowIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [designFilesUrl, setDesignFilesUrl] = useState('');
  const [tab, setTab] = useState<'description' | 'specs' | 'faq'>('description');
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

  function computeTotal(useQty: number, useColIdx: number, useRowIdx: number) {
    const breakdown: Array<{ label: string; amount: number }> = [];
    let sum = 0;
    let anyFormula = false;

    for (const step of visibleSteps) {
      if (step.type !== 'swatch' && step.type !== 'select') continue;
      const selected = cfgState[step.step_id];
      const opt = step.options.find((o) => o.slug === selected);
      if (opt?.price_formula) {
        anyFormula = true;
        const valueCents = Math.round(evaluateFormula(opt.price_formula, { qty: useQty, base: 0 }) * 100);
        sum += valueCents;
        if (valueCents > 0) breakdown.push({ label: `${step.label}: ${opt.label}`, amount: valueCents });
      }
    }

    if (!anyFormula && product.pricing) {
      const row = product.pricing.rows[useRowIdx] ?? product.pricing.rows[0];
      const matrixPrice = row?.prices[useColIdx] ?? 0;
      if (matrixPrice > 0) {
        breakdown.push({
          label: `${product.pricing.label}: ${product.pricing.configs[useColIdx] ?? ''}`,
          amount: matrixPrice,
        });
        sum = matrixPrice;
      }
    }

    return { total: sum, breakdown };
  }

  const { total: lineTotal, breakdown } = useMemo(
    () => computeTotal(qty, colIdx, rowIdx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qty, colIdx, rowIdx, cfgState, visibleSteps, product.pricing]
  );

  const unitPrice = qty > 0 ? Math.round(lineTotal / qty) : 0;

  const fromPrice = useMemo(() => {
    let min: number | null = null;
    if (product.pricing) {
      for (let i = 0; i < product.pricing.configs.length; i++) {
        const { total } = computeTotal(1, i, 0);
        if (total > 0 && (min === null || total < min)) min = total;
      }
    }
    if (min === null) {
      for (const step of product.configurator) {
        if (step.type !== 'swatch' && step.type !== 'select') continue;
        for (const opt of step.options ?? []) {
          if (!opt.price_formula) continue;
          const cents = Math.round(evaluateFormula(opt.price_formula, { qty: 1, base: 0 }) * 100);
          if (cents > 0 && (min === null || cents < min)) min = cents;
        }
      }
    }
    if (min === null && product.pricing) {
      for (const r of product.pricing.rows) for (const p of r.prices) if (typeof p === 'number' && p > 0 && (min === null || p < min)) min = p;
    }
    return min;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.pricing, product.configurator, cfgState]);

  const priceLadder = useMemo(() => {
    if (!product.pricing) return [];
    const { total: singleTotal } = computeTotal(1, colIdx, 0);
    return product.pricing.rows.map((r, rIdx) => {
      const qtyNum = parseInt((r.qty.match(/\d+/) ?? ['1'])[0], 10) || 1;
      const { total } = computeTotal(qtyNum, colIdx, rIdx);
      const undiscountedTotal = singleTotal * qtyNum;
      return {
        qty: r.qty,
        qtyNum,
        total,
        perPiece: qtyNum > 0 ? total / qtyNum : total,
        saves: Math.max(0, undiscountedTotal - total),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.pricing, colIdx, cfgState, visibleSteps]);

  const iconIsUrl = !!product.icon && (product.icon.startsWith('http') || product.icon.startsWith('/'));
  const heroImg = product.extras?.image_url || (iconIsUrl ? product.icon : null);
  const headline = product.extras?.h1 ?? product.name;
  const subheadline = product.extras?.h1em ?? '';

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
    if (designFilesUrl.trim()) configLabels['Design files'] = designFilesUrl.trim();
    addToCart({
      product_slug: product.slug, product_name: product.name, icon: product.icon,
      config: configLabels, qty, unit_price_cents: unitPrice, line_total_cents: lineTotal,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  }

  const useCases = (product.extras?.use_cases ?? []) as any[];

  return (
    <article itemScope itemType="https://schema.org/Product">
      <meta itemProp="name" content={product.name} />
      {product.description && <meta itemProp="description" content={product.description} />}
      {heroImg && <meta itemProp="image" content={heroImg} />}

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ padding: '20px 28px 0', maxWidth: 1280, margin: '0 auto', fontSize: 12, color: '#666' }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        {' / '}
        <Link href="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>Shop</Link>
        {product.category && (
          <>
            {' / '}
            <Link href={`/shop?category=${product.category.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {product.category.name}
            </Link>
          </>
        )}
        {' / '}
        <span style={{ color: '#0a0a0a' }}>{product.name}</span>
      </nav>

      {/* HERO: image left, info + sticky buy-box right */}
      <section style={{ padding: '24px 28px 48px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 48, alignItems: 'start' }} className="pv-product-hero">
          {/* Product image */}
          <div>
            <div style={{
              aspectRatio: '1 / 1', background: '#fafaf7',
              border: '1px solid #e5e5e5', borderRadius: 12,
              overflow: 'hidden', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {heroImg ? (
                <img src={heroImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  {product.icon && !iconIsUrl && (
                    <div style={{ fontSize: 120, lineHeight: 1 }}>{product.icon}</div>
                  )}
                  <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: '#666' }}>
                    {product.name}
                  </div>
                </div>
              )}
            </div>

            {/* Trust chips under image */}
            {product.extras?.chips && product.extras.chips.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.extras.chips.slice(0, 4).map((c, i) => (
                  <span key={i} style={{
                    padding: '6px 12px', background: '#f5f5f5',
                    borderRadius: 999, fontSize: 12, color: '#555',
                  }}>
                    {c.replace(/^[^a-zA-Z0-9(]+/, '').trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Product info + buy box */}
          <div style={{ position: 'sticky', top: 80 }}>
            {product.category && (
              <Link
                href={`/shop?category=${product.category.slug}`}
                style={{
                  display: 'inline-block', padding: '4px 12px',
                  background: '#fff0f8', border: '1px solid #E91E8C',
                  borderRadius: 999, fontSize: 11, fontWeight: 800,
                  letterSpacing: 1, textTransform: 'uppercase',
                  color: '#E91E8C', textDecoration: 'none', marginBottom: 12,
                }}
              >
                {product.category.name}
              </Link>
            )}

            <h1
              itemProp="name"
              style={{
                fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em',
                color: '#0a0a0a', margin: '0 0 4px',
              }}
            >
              {headline}
            </h1>

            {subheadline && (
              <h2 style={{
                fontFamily: 'var(--sans)', fontSize: 'clamp(18px, 2.4vw, 24px)',
                fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em',
                color: '#E91E8C', margin: '0 0 16px',
              }}>
                {subheadline}
              </h2>
            )}

            {product.tagline && (
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, margin: '0 0 20px' }}>
                {product.tagline}
              </p>
            )}

            {/* Price display */}
            {fromPrice !== null && (
              <div
                itemProp="offers" itemScope itemType="https://schema.org/Offer"
                style={{
                  padding: '16px 0', borderTop: '2px solid #f0f0f0', borderBottom: '2px solid #f0f0f0',
                  marginBottom: 20,
                }}
              >
                <meta itemProp="priceCurrency" content="SGD" />
                <meta itemProp="price" content={(fromPrice / 100).toFixed(2)} />
                <meta itemProp="availability" content="https://schema.org/InStock" />
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#888', marginRight: 8 }}>
                      From
                    </span>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 32, fontWeight: 900, color: '#E91E8C', letterSpacing: '-0.02em' }}>
                      {formatSGD(fromPrice)}
                    </span>
                  </div>
                  {lineTotal > 0 && lineTotal !== fromPrice && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current total</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0a0a0a' }}>{formatSGD(lineTotal)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Configurator inline */}
            {visibleSteps.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {visibleSteps.map((step) => {
                  if (step.type === 'qty') return null;
                  return (
                    <div key={step.step_id} style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 8 }}>
                        {step.label}
                        {step.required && <span style={{ color: '#E91E8C' }}> *</span>}
                      </label>

                      {(step.type === 'swatch' || step.type === 'select') && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {step.options.map((opt) => {
                            const active = cfgState[step.step_id] === opt.slug;
                            const optCents = opt.price_formula
                              ? Math.round(evaluateFormula(opt.price_formula, { qty, base: 0 }) * 100)
                              : null;
                            const showPrice = optCents !== null && optCents > 0;
                            return (
                              <button
                                key={opt.slug}
                                type="button"
                                onClick={() => setCfgState({ ...cfgState, [step.step_id]: opt.slug })}
                                style={{
                                  padding: '8px 14px', borderRadius: 6,
                                  border: `1.5px solid ${active ? '#0a0a0a' : '#e5e5e5'}`,
                                  background: active ? '#0a0a0a' : '#fff',
                                  color: active ? '#fff' : '#333',
                                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  fontFamily: 'var(--sans)',
                                }}
                              >
                                <span>{opt.label}</span>
                                {showPrice && (
                                  <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 600 }}>
                                    {formatSGD(optCents)}
                                  </span>
                                )}
                                {opt.note && (
                                  <span style={{ fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.75 }}>
                                    · {opt.note}
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
                          style={{ width: 140 }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Quantity */}
                {(() => {
                  const qtyStep = visibleSteps.find((s) => s.type === 'qty');
                  if (!qtyStep) return null;
                  return (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 8 }}>
                        Quantity
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'inline-flex', border: '1.5px solid #e5e5e5', borderRadius: 6, overflow: 'hidden' }}>
                          <button
                            type="button"
                            onClick={() => setCfgState({ ...cfgState, [qtyStep.step_id]: String(Math.max(qtyStep.step_config?.min ?? 1, qty - 1)) })}
                            style={{ padding: '8px 14px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={qtyStep.step_config?.min ?? 1}
                            value={qty}
                            onChange={(e) => setCfgState({ ...cfgState, [qtyStep.step_id]: e.target.value })}
                            style={{ width: 56, border: 'none', borderLeft: '1.5px solid #e5e5e5', borderRight: '1.5px solid #e5e5e5', textAlign: 'center', fontSize: 14, fontWeight: 700, outline: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => setCfgState({ ...cfgState, [qtyStep.step_id]: String(qty + 1) })}
                            style={{ padding: '8px 14px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}
                          >
                            +
                          </button>
                        </div>
                        <span style={{ fontSize: 11, color: '#888' }}>
                          Min {qtyStep.step_config?.min ?? 1} pc · Price updates automatically
                        </span>
                      </div>
                      {qtyStep.step_config?.discount_note && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                          💚 {qtyStep.step_config.discount_note}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Design files */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 8 }}>
                Design files <span style={{ color: '#888', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={designFilesUrl}
                onChange={(e) => setDesignFilesUrl(e.target.value)}
                placeholder="Paste Google Drive, Dropbox, or WeTransfer link"
                className="pv-checkout-input"
              />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                Or send via WhatsApp after ordering. We check every file before printing.
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                onClick={handleAddToCart}
                style={{
                  flex: 1, padding: '14px 24px', borderRadius: 999,
                  background: '#E91E8C', color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'var(--sans)',
                }}
              >
                {addedFlash ? '✓ Added to cart' : 'Add to Cart'}
              </button>
              <a
                href="https://wa.me/6585533497"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '14px 20px', borderRadius: 999,
                  background: '#fff', color: '#0a0a0a',
                  border: '1.5px solid #0a0a0a',
                  fontSize: 13, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
                  textDecoration: 'none', fontFamily: 'var(--sans)',
                }}
              >
                💬 Chat
              </a>
            </div>

            {/* Guarantees */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12, color: '#555' }}>
              <li style={{ padding: '4px 0' }}>✓ Pre-press file check on every order</li>
              <li style={{ padding: '4px 0' }}>✓ Digital mockup before we print</li>
              <li style={{ padding: '4px 0' }}>✓ Island-wide delivery (S$8) or free pickup at Paya Lebar Square</li>
            </ul>

            {/* Price breakdown */}
            {breakdown.length > 0 && (
              <details style={{ marginTop: 16, borderTop: '1px dashed #e5e5e5', paddingTop: 14 }}>
                <summary style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#888', cursor: 'pointer' }}>
                  How is the price calculated?
                </summary>
                <div style={{ marginTop: 10 }}>
                  {breakdown.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', padding: '4px 0' }}>
                      <span>{b.label}</span>
                      <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{formatSGD(b.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, padding: '8px 0 0', borderTop: '1px solid #f0f0f0', marginTop: 6 }}>
                    <span>Total</span>
                    <span>{formatSGD(lineTotal)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                    {formatSGD(unitPrice)}/pc · Estimated — final confirmed at checkout.
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      </section>

      {/* Price at every quantity */}
      {priceLadder.length > 1 && (
        <section style={{ padding: '24px 28px 48px', maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--sans)', fontSize: 22, fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 16px', color: '#0a0a0a' }}>
            Price breaks
          </h2>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
            Based on your current selection. Updates as you change options above.
          </p>
          <div style={{ overflowX: 'auto', border: '1px solid #e5e5e5', borderRadius: 8, background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#666' }}>Qty</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#666' }}>Total</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#666' }}>Per piece</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#666' }}>You save</th>
                </tr>
              </thead>
              <tbody>
                {priceLadder.map((r, i) => {
                  const isCurrent = r.qtyNum === qty;
                  return (
                    <tr key={i} style={{ background: isCurrent ? '#fff0f8' : '#fff', borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 20px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#E91E8C' : '#0a0a0a' }}>{r.qty}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, color: '#0a0a0a' }}>{formatSGD(r.total)}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', color: '#666' }}>{formatSGD(Math.round(r.perPiece))}/pc</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', color: r.saves > 0 ? '#15803d' : '#bbb', fontWeight: r.saves > 0 ? 700 : 400 }}>
                        {r.saves > 0 ? formatSGD(r.saves) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tabbed content: Description / Specs / FAQ */}
      <section style={{ padding: '24px 28px 48px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e5e5', marginBottom: 24 }}>
          {(
            [
              ['description', 'Description'],
              ['specs', `Specifications${product.specs.length > 0 ? ` (${product.specs.length})` : ''}`],
              ['faq', `FAQ${product.faqs.length > 0 ? ` (${product.faqs.length})` : ''}`],
            ] as Array<['description' | 'specs' | 'faq', string]>
          ).map(([key, label]) => {
            const active = tab === key;
            const disabled = (key === 'specs' && product.specs.length === 0) || (key === 'faq' && product.faqs.length === 0);
            return (
              <button
                key={key}
                onClick={() => !disabled && setTab(key)}
                disabled={disabled}
                style={{
                  padding: '12px 24px',
                  background: 'none', border: 'none',
                  borderBottom: active ? '2px solid #E91E8C' : '2px solid transparent',
                  marginBottom: -2,
                  fontSize: 13, fontWeight: 800,
                  color: disabled ? '#ccc' : active ? '#E91E8C' : '#666',
                  cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === 'description' && (
          <div itemProp="description" style={{ maxWidth: 760, fontSize: 15, color: '#333', lineHeight: 1.75 }}>
            {product.extras?.intro && <p style={{ margin: '0 0 16px' }}>{product.extras.intro}</p>}
            {product.description && <p style={{ margin: '0 0 16px' }}>{product.description}</p>}
            {product.highlights.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', display: 'grid', gap: 8 }}>
                {product.highlights.map((h, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E91E8C', marginTop: 10, flexShrink: 0 }} />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'specs' && product.specs.length > 0 && (
          <dl style={{ maxWidth: 760, margin: 0, border: '1px solid #e5e5e5', borderRadius: 8, background: '#fff' }}>
            {product.specs.map((s, i) => (
              <div key={i} style={{ display: 'flex', padding: '14px 20px', borderBottom: i < product.specs.length - 1 ? '1px solid #f0f0f0' : 'none', fontSize: 14, gap: 20 }}>
                <dt style={{ width: 180, fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>{s.label}</dt>
                <dd style={{ flex: 1, margin: 0, color: '#0a0a0a', fontWeight: 500 }}>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {tab === 'faq' && product.faqs.length > 0 && (
          <div style={{ maxWidth: 760, display: 'grid', gap: 8 }}>
            {product.faqs.map((f, i) => (
              <div
                key={i}
                itemScope itemProp="mainEntity" itemType="https://schema.org/Question"
                style={{ border: '1px solid #e5e5e5', borderRadius: 8, background: '#fff', overflow: 'hidden' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: '100%', padding: '16px 20px',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: 14, fontWeight: 700, color: '#0a0a0a', gap: 16, fontFamily: 'var(--sans)',
                  }}
                >
                  <span itemProp="name">{f.question}</span>
                  <span style={{ fontSize: 18, color: '#E91E8C', flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div
                    itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer"
                    style={{ padding: '0 20px 16px', fontSize: 14, color: '#555', lineHeight: 1.7 }}
                  >
                    <span itemProp="text">{f.answer}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Use cases (SEO + conversion) */}
      {useCases.length > 0 && (
        <section style={{ background: '#fafafa', padding: '64px 28px', borderTop: '1px solid #eee' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 8px', color: '#0a0a0a' }}>
              Who orders {product.name.toLowerCase()}
            </h2>
            <p style={{ fontSize: 14, color: '#666', margin: '0 0 32px' }}>
              Common scenarios and industries we print for.
            </p>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
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
                return (
                  <div key={i} style={{ background: '#fff', padding: '20px 24px', borderRadius: 10, border: '1px solid #e5e5e5' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{title}</h3>
                    {desc && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 }}>{desc}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Why us — simple, SEO-friendly */}
      {product.extras?.why_us && product.extras.why_us.length > 0 && (
        <section style={{ padding: '64px 28px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {product.extras.why_headline && (
              <h2
                style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 32px', color: '#0a0a0a' }}
                dangerouslySetInnerHTML={{ __html: product.extras.why_headline.replace(/<br>/g, ' ') }}
              />
            )}
            <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {product.extras.why_us.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                    background: '#fff0f8', color: '#E91E8C',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#333', lineHeight: 1.7 }}>{w}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related products */}
      {product.related.length > 0 && (
        <section style={{ background: '#fafafa', padding: '64px 28px', borderTop: '1px solid #eee' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(20px,2.4vw,28px)', fontWeight: 900, letterSpacing: '-0.01em', margin: '0 0 24px', color: '#0a0a0a' }}>
              You might also like
            </h2>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {product.related.slice(0, 4).map((r) => {
                const rIsUrl = !!r.icon && (r.icon.startsWith('http') || r.icon.startsWith('/'));
                return (
                  <Link
                    key={r.slug}
                    href={productHref(r.slug, productRoutes)}
                    style={{
                      display: 'block', background: '#fff', borderRadius: 10,
                      border: '1px solid #e5e5e5', overflow: 'hidden',
                      textDecoration: 'none', transition: 'border-color .15s',
                    }}
                  >
                    <div style={{ aspectRatio: '1 / 1', background: '#fafaf7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {rIsUrl ? (
                        <img src={r.icon!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 48 }}>{r.icon ?? '📦'}</span>
                      )}
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>{r.name}</div>
                      {r.min_price !== null && (
                        <div style={{ fontSize: 11, color: '#E91E8C', fontWeight: 700 }}>From {formatSGD(r.min_price)}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          .pv-product-hero { grid-template-columns: 1fr !important; gap: 24px !important; }
          .pv-product-hero > div:last-child { position: static !important; }
        }
      `}</style>
    </article>
  );
}
