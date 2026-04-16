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

  const [colIdx, setColIdx] = useState(0);
  const [rowIdx, setRowIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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

  const visibleSteps = useMemo(() =>
    product.configurator.filter((step) => !step.show_if || cfgState[step.show_if.step] === step.show_if.value)
  , [product.configurator, cfgState]);

  const basePrice = useMemo(() => {
    if (!product.pricing) return 0;
    const row = product.pricing.rows[rowIdx];
    return row?.prices[colIdx] ?? row?.prices[0] ?? 0;
  }, [product.pricing, rowIdx, colIdx]);

  const qty = useMemo(() => {
    const qtyStep = visibleSteps.find((s) => s.type === 'qty');
    if (!qtyStep) return 1;
    return parseInt(cfgState[qtyStep.step_id] || '1', 10) || 1;
  }, [visibleSteps, cfgState]);

  const addons = useMemo(() => {
    let total = 0;
    for (const step of visibleSteps) {
      if (step.type === 'swatch' || step.type === 'select') {
        const selected = cfgState[step.step_id];
        const opt = step.options.find((o) => o.slug === selected);
        if (opt?.price_formula) total += evaluateFormula(opt.price_formula, { qty, base: basePrice });
      }
    }
    return total;
  }, [visibleSteps, cfgState, qty, basePrice]);

  const unitPrice = product.pricing ? basePrice + Math.round(addons / qty) : 0;
  const lineTotal = product.pricing ? basePrice + addons : 0;

  const fromPrice = useMemo(() => {
    if (!product.pricing) return null;
    let min: number | null = null;
    for (const r of product.pricing.rows) for (const p of r.prices) if (typeof p === 'number' && (min === null || p < min)) min = p;
    return min;
  }, [product.pricing]);

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
    addToCart({
      product_slug: product.slug, product_name: product.name, icon: product.icon,
      config: configLabels, qty, unit_price_cents: unitPrice, line_total_cents: lineTotal,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  }

  return (
    <>
      {/* HERO */}
      <div className="pp3-hero" style={{ background: heroColor, color: 'white' }}>
        <div className="pp3-hero-inner">
          <div className="pp3-hero-left">
            <div className="pp3-bc">
              <Link href="/" style={{ color: 'inherit' }}>Home</Link>
              {' › '}
              {product.category && (
                <>
                  <Link href={`/shop?category=${product.category.slug}`} style={{ color: 'inherit' }}>
                    {product.category.name}
                  </Link>
                  {' › '}
                </>
              )}
              <span style={{ color: '#fff' }}>{product.name}</span>
            </div>
            {product.category && (
              <div className="pp3-cat-badge">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <circle cx="4" cy="4" r="3" stroke="#E91E8C" strokeWidth="1.5" />
                </svg>
                {product.category.name}
              </div>
            )}
            <h1 className="pp3-h1">
              {h1}
              {h1em && <em>{h1em}</em>}
            </h1>
            {product.tagline && <p className="pp3-tagline">{product.tagline}</p>}

            {product.extras?.chips && product.extras.chips.length > 0 && (
              <div className="pp3-trust-row">
                {product.extras.chips.slice(0, 4).map((c, i) => (
                  <div key={i} className="pp3-trust-badge">
                    {c.replace(/^[^a-zA-Z0-9(✓✗]+/, '').trim()}
                  </div>
                ))}
              </div>
            )}

            <div className="pp3-hero-cta">
              {fromPrice !== null && (
                <a href="#pricing" className="pp3-from-pill">
                  From <strong>{formatSGD(fromPrice)}</strong> · See Pricing →
                </a>
              )}
              <a href="https://wa.me/6585533497" target="_blank" rel="noopener noreferrer" className="pp3-hero-enquire">
                💬 Quick enquiry
              </a>
            </div>
          </div>

          <div className="pp3-hero-right">
            <div className="pp3-hero-art">
              <div className="pp3-art-bg">{heroBig}</div>
              <div className="pp3-art-frame">
                {product.extras?.image_url ? (
                  <img className="pp3-art-img" src={product.extras.image_url} alt={product.name} />
                ) : (
                  <div className="pp3-art-icon">{product.icon ?? '📦'}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INTRO */}
      {product.extras?.intro && (
        <section style={{ padding: '48px 28px', background: '#fff' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', fontSize: 17, lineHeight: 1.7, color: '#333' }}>
            {product.extras.intro}
          </div>
        </section>
      )}

      {/* WHY US */}
      {product.extras?.why_us && product.extras.why_us.length > 0 && (
        <section style={{ padding: '64px 28px', background: '#fafafa' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {product.extras.why_headline && (
              <h2
                style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,3.2vw,42px)', fontWeight: 700, textAlign: 'center', marginBottom: 40, color: '#0a0a0a', lineHeight: 1.15 }}
                dangerouslySetInnerHTML={{ __html: product.extras.why_headline }}
              />
            )}
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {product.extras.why_us.map((w, i) => (
                <div key={i} className="pp3-why-item">
                  <div className="pp3-why-num">0{i + 1}</div>
                  <div className="pp3-why-text">{w}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONFIGURATOR + PRICING */}
      <section id="pricing" style={{ padding: '64px 28px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 48, gridTemplateColumns: 'minmax(0,1fr) 380px' }} className="pp3-main-grid">
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#0a0a0a' }}>Configure your order</h2>

            {visibleSteps.length === 0 ? (
              <p style={{ fontSize: 14, color: '#888' }}>This product has no options. Choose quantity at checkout.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {visibleSteps.map((step) => (
                  <div key={step.step_id} className="pf3-group">
                    <label className="pf3-label">
                      {step.label}
                      {step.required && <span className="pf3-req">Required</span>}
                    </label>

                    {step.type === 'swatch' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {step.options.map((opt) => (
                          <button
                            key={opt.slug}
                            onClick={() => setCfgState({ ...cfgState, [step.step_id]: opt.slug })}
                            style={{
                              padding: '10px 18px', borderRadius: 999,
                              border: `2px solid ${cfgState[step.step_id] === opt.slug ? '#E91E8C' : '#e5e5e5'}`,
                              background: cfgState[step.step_id] === opt.slug ? '#E91E8C' : '#fff',
                              color: cfgState[step.step_id] === opt.slug ? '#fff' : '#333',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                              fontFamily: 'var(--sans)',
                            }}
                          >
                            {opt.label}
                            {opt.note && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>· {opt.note}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {step.type === 'select' && (
                      <select
                        value={cfgState[step.step_id] ?? ''}
                        onChange={(e) => setCfgState({ ...cfgState, [step.step_id]: e.target.value })}
                        className="pf3-input"
                      >
                        {step.options.map((opt) => (
                          <option key={opt.slug} value={opt.slug}>
                            {opt.label}{opt.note ? ` · ${opt.note}` : ''}
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
                        className="pf3-input"
                      />
                    )}

                    {step.type === 'number' && (
                      <input
                        type="number"
                        min={step.step_config?.min ?? 0}
                        step={step.step_config?.step ?? 1}
                        value={cfgState[step.step_id] ?? ''}
                        onChange={(e) => setCfgState({ ...cfgState, [step.step_id]: e.target.value })}
                        className="pf3-input"
                        style={{ width: 140 }}
                      />
                    )}

                    {step.type === 'qty' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {(step.step_config?.presets ?? []).map((preset: number) => (
                          <button
                            key={preset}
                            onClick={() => setCfgState({ ...cfgState, [step.step_id]: String(preset) })}
                            style={{
                              padding: '8px 16px', borderRadius: 999,
                              border: `2px solid ${cfgState[step.step_id] === String(preset) ? '#E91E8C' : '#e5e5e5'}`,
                              background: cfgState[step.step_id] === String(preset) ? '#E91E8C' : '#fff',
                              color: cfgState[step.step_id] === String(preset) ? '#fff' : '#333',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)',
                            }}
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
                          className="pf3-input"
                          style={{ width: 100 }}
                        />
                      </div>
                    )}

                    {step.step_config?.discount_note && (
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{step.step_config.discount_note}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pricing table */}
            {product.pricing && product.pricing.rows.length > 0 && (
              <div style={{ marginTop: 48 }} className="pp3-pricing-section">
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#0a0a0a' }}>Pricing ladder</h3>
                <div style={{ overflowX: 'auto', border: '2px solid #0a0a0a', borderRadius: 2 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#0a0a0a', color: '#fff' }}>
                        <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>Qty</th>
                        {product.pricing.configs.map((cfg, i) => (
                          <th
                            key={i}
                            onClick={() => setColIdx(i)}
                            className={`pp3-cfg-btn ${i === colIdx ? 'active' : ''}`}
                            style={{
                              padding: '14px 18px', textAlign: 'center', fontWeight: 700, cursor: 'pointer',
                              background: i === colIdx ? '#E91E8C' : 'transparent',
                              fontSize: 12, letterSpacing: 0.5,
                            }}
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
                          style={{
                            background: ri === rowIdx ? 'rgba(233,30,140,.06)' : '#fff',
                            cursor: 'pointer',
                            borderTop: '1px solid #eee',
                          }}
                        >
                          <td className="pp3-qty-cell" style={{ padding: '14px 18px', fontWeight: 700 }}>{r.qty}</td>
                          {r.prices.map((p, ci) => (
                            <td
                              key={ci}
                              style={{
                                padding: '14px 18px', textAlign: 'center', fontWeight: 600,
                                color: ri === rowIdx && ci === colIdx ? '#E91E8C' : '#333',
                              }}
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
          <aside>
            <div style={{
              position: 'sticky', top: 80, padding: 28, background: '#fff',
              border: '2px solid #0a0a0a', boxShadow: '6px 6px 0 #E91E8C',
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 6 }}>Your selection</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, marginBottom: 18, color: '#0a0a0a' }}>{product.name}</h3>

              <div style={{ marginBottom: 18, fontSize: 12, color: '#666', lineHeight: 2 }}>
                {product.pricing && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{product.pricing.label}:</span>
                    <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{product.pricing.configs[colIdx] ?? '-'}</span>
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
                    <div key={step.step_id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{step.label}:</span>
                      <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{label}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Qty:</span>
                  <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{qty}</span>
                </div>
              </div>

              <div style={{ borderTop: '2px solid #0a0a0a', paddingTop: 16, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#666' }}>Total</span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, color: '#E91E8C' }}>
                    {product.pricing ? formatSGD(lineTotal) : 'Quote'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                style={{
                  display: 'block', width: '100%', padding: '14px', borderRadius: 999,
                  background: '#E91E8C', color: '#fff', fontSize: 13, fontWeight: 800,
                  letterSpacing: 0.3, border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)',
                  marginBottom: 8,
                }}
              >
                {addedFlash ? '✓ Added to cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => { handleAddToCart(); router.push('/checkout'); }}
                style={{
                  display: 'block', width: '100%', padding: '14px', borderRadius: 999,
                  background: '#fff', color: '#0a0a0a', fontSize: 13, fontWeight: 800,
                  letterSpacing: 0.3, border: '2px solid #0a0a0a', cursor: 'pointer', fontFamily: 'var(--sans)',
                }}
              >
                Order Now →
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* SPECS */}
      {product.specs.length > 0 && (
        <section style={{ padding: '64px 28px', background: '#fafafa' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 20, color: '#0a0a0a' }}>Specs</h2>
            <dl style={{ background: '#fff', border: '1px solid #eee' }}>
              {product.specs.map((s, i) => (
                <div key={i} style={{ display: 'flex', padding: '16px 28px', fontSize: 14, borderBottom: i < product.specs.length - 1 ? '1px solid #eee' : 'none' }}>
                  <dt style={{ width: 180, fontWeight: 600, color: '#888' }}>{s.label}</dt>
                  <dd style={{ flex: 1, color: '#0a0a0a' }}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* FAQ */}
      {product.faqs.length > 0 && (
        <section style={{ padding: '64px 28px', background: '#fff' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 700, marginBottom: 32, color: '#0a0a0a' }}>FAQ</h2>
            <div style={{ background: '#fff', border: '1px solid #eee' }}>
              {product.faqs.map((f, i) => (
                <div key={i} className="pp3-faq-item" style={{ borderBottom: i < product.faqs.length - 1 ? '1px solid #eee' : 'none' }}>
                  <div
                    className="pp3-faq-q"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      padding: '18px 24px', fontSize: 14, fontWeight: 600, color: '#0a0a0a',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span>{f.question}</span>
                    <span className="pp3-faq-arr" style={{ fontSize: 16 }}>{openFaq === i ? '−' : '+'}</span>
                  </div>
                  {openFaq === i && (
                    <div style={{ padding: '0 24px 18px', fontSize: 13, color: '#555', lineHeight: 1.7 }}>{f.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {product.related.length > 0 && (
        <section style={{ padding: '64px 28px', background: '#fafafa' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#0a0a0a' }}>Related products</h2>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {product.related.slice(0, 4).map((r) => (
                <Link
                  key={r.slug}
                  href={productHref(r.slug, productRoutes)}
                  className="pp3-rel-card"
                  style={{
                    display: 'block', padding: 20, background: '#fff', border: '2px solid #eee',
                    transition: 'all .2s', textDecoration: 'none',
                  }}
                >
                  <div className="pp3-rel-icon" style={{ fontSize: 36, marginBottom: 12 }}>{r.icon ?? '📦'}</div>
                  <div className="pp3-rel-body">
                    <div className="pp3-rel-name" style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', marginBottom: 6 }}>{r.name}</div>
                    {r.min_price !== null && (
                      <div className="pp3-rel-price" style={{ fontSize: 12, color: '#E91E8C', fontWeight: 700 }}>
                        From {formatSGD(r.min_price)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
