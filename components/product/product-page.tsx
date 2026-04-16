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

  const visibleSteps = useMemo(
    () => product.configurator.filter((step) => !step.show_if || cfgState[step.show_if.step] === step.show_if.value),
    [product.configurator, cfgState]
  );

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

  const useCases = product.extras?.use_cases ?? [];

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

      {/* INTRO + HIGHLIGHTS */}
      {(product.extras?.intro || product.highlights.length > 0) && (
        <div className="pp3-section" style={{ background: '#fff' }}>
          <div className="pp3-section-in">
            {product.extras?.intro && (
              <p style={{ fontSize: 17, lineHeight: 1.75, color: '#333', maxWidth: 860, marginBottom: product.highlights.length > 0 ? 32 : 0 }}>
                {product.extras.intro}
              </p>
            )}
            {product.highlights.length > 0 && (
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
                {product.highlights.map((h, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid #f0f0f0', fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E91E8C', marginTop: 8, flexShrink: 0 }} />
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* PRICING + CONFIGURATOR */}
      <section id="pricing" className="pp3-section pp3-pricing-section">
        <div className="pp3-section-in">
          <div className="pp3-pricing-layout">
            <div>
              <div className="pp3-section-tag">Configure &amp; price</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,3vw,36px)', fontWeight: 700, color: '#0a0a0a', marginBottom: 28, lineHeight: 1.1 }}>
                Build your order.
              </h2>

              {visibleSteps.length === 0 ? (
                <p style={{ fontSize: 14, color: '#888' }}>This product has no options — choose quantity at checkout.</p>
              ) : (
                <div style={{ marginBottom: 32 }}>
                  {visibleSteps.map((step) => (
                    <div key={step.step_id} style={{ marginBottom: 22 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: 0.3, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 10 }}>
                        {step.label}
                        {step.required && <span style={{ fontSize: 9, fontWeight: 700, color: '#E91E8C' }}>Required</span>}
                      </label>

                      {step.type === 'swatch' && (
                        <div className="pp3-cfg-row">
                          {step.options.map((opt) => (
                            <button
                              key={opt.slug}
                              type="button"
                              className="pp3-cfg-btn"
                              onClick={() => setCfgState({ ...cfgState, [step.step_id]: opt.slug })}
                              style={cfgState[step.step_id] === opt.slug ? { borderColor: '#0D0D0D', background: '#0D0D0D', color: '#fff' } : undefined}
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
                          className="pv-checkout-input"
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

                      {step.type === 'qty' && (
                        <div className="pp3-cfg-row">
                          {(step.step_config?.presets ?? []).map((preset: number) => (
                            <button
                              key={preset}
                              type="button"
                              className="pp3-cfg-btn"
                              onClick={() => setCfgState({ ...cfgState, [step.step_id]: String(preset) })}
                              style={cfgState[step.step_id] === String(preset) ? { borderColor: '#E91E8C', background: '#E91E8C', color: '#fff' } : undefined}
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
                            className="pv-checkout-input"
                            style={{ width: 100 }}
                          />
                        </div>
                      )}

                      {step.step_config?.discount_note && (
                        <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{step.step_config.discount_note}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pricing table */}
              {product.pricing && product.pricing.rows.length > 0 && (
                <>
                  <div className="pp3-section-tag" style={{ marginTop: 24 }}>Pricing ladder</div>
                  <div style={{ overflowX: 'auto', border: '1px solid #e5e5e5', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#888', background: '#fafafa', borderBottom: '1px solid #e5e5e5' }}>Qty</th>
                          {product.pricing.configs.map((cfg, i) => (
                            <th
                              key={i}
                              onClick={() => setColIdx(i)}
                              style={{
                                padding: '14px 16px', textAlign: 'center', fontSize: 10,
                                fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
                                color: i === colIdx ? '#fff' : '#333',
                                background: i === colIdx ? '#E91E8C' : '#fafafa',
                                borderBottom: '1px solid #e5e5e5', cursor: 'pointer',
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
                            className={`pp3-pr-row ${ri === rowIdx ? 'active' : ''}`}
                          >
                            <td className="pp3-qty-cell" style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14 }}>{r.qty}</td>
                            {r.prices.map((p, ci) => (
                              <td
                                key={ci}
                                className={`pp3-price-cell ${ri === rowIdx && ci === colIdx ? 'active' : ''}`}
                                style={{ textAlign: 'center', fontSize: 14 }}
                              >
                                {typeof p === 'number' ? formatSGD(p) : p}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Specs sidebar */}
            <aside>
              <div className="pp3-specs-panel">
                <div className="pp3-specs-title">Specs</div>
                {product.specs.length > 0 ? (
                  <dl style={{ margin: 0 }}>
                    {product.specs.map((s, i) => (
                      <div key={i} style={{ display: 'flex', padding: '10px 0', borderBottom: i < product.specs.length - 1 ? '1px solid #f5f5f5' : 'none', fontSize: 12 }}>
                        <dt style={{ width: 110, fontWeight: 700, color: '#888', flexShrink: 0 }}>{s.label}</dt>
                        <dd style={{ flex: 1, margin: 0, color: '#0a0a0a', fontWeight: 600 }}>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div style={{ fontSize: 12, color: '#888' }}>Custom specs available on request.</div>
                )}

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>Your selection</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#666' }}>Qty {qty}</span>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, color: '#E91E8C' }}>
                      {product.pricing ? formatSGD(lineTotal) : 'Quote'}
                    </span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    style={{
                      display: 'block', width: '100%', padding: '12px 14px', marginTop: 12,
                      background: '#E91E8C', color: '#fff', fontSize: 12, fontWeight: 800,
                      letterSpacing: 0.5, textTransform: 'uppercase', border: 'none',
                      cursor: 'pointer', fontFamily: 'var(--sans)',
                    }}
                  >
                    {addedFlash ? '✓ Added to cart' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => { handleAddToCart(); router.push('/checkout'); }}
                    style={{
                      display: 'block', width: '100%', padding: '12px 14px', marginTop: 8,
                      background: '#fff', color: '#0a0a0a', fontSize: 12, fontWeight: 800,
                      letterSpacing: 0.5, textTransform: 'uppercase',
                      border: '1.5px solid #0a0a0a', cursor: 'pointer', fontFamily: 'var(--sans)',
                    }}
                  >
                    Order Now →
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      {useCases.length > 0 && (
        <section className="pp3-section pp3-use-section">
          <div className="pp3-section-in">
            <div className="pp3-section-tag">Use cases</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px,3vw,34px)', fontWeight: 700, color: '#0a0a0a', marginBottom: 4, lineHeight: 1.1 }}>
              Who orders this.
            </h2>
            <div className="pp3-use-grid">
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
                  <div key={i} className="pp3-use-card">
                    <div className="pp3-use-title">{title}</div>
                    {desc && <div className="pp3-use-desc">{desc}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* WHY US */}
      {product.extras?.why_us && product.extras.why_us.length > 0 && (
        <section className="pp3-section pp3-why-section">
          <div className="pp3-section-in">
            <div className="pp3-why-header">
              <div className="pp3-section-tag">Why us</div>
              {product.extras.why_headline && (
                <h2
                  style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,3.2vw,40px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, margin: 0 }}
                  dangerouslySetInnerHTML={{ __html: product.extras.why_headline }}
                />
              )}
            </div>
            <div className="pp3-why-grid">
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

      {/* FAQ */}
      {product.faqs.length > 0 && (
        <section className="pp3-section pp3-faq-section">
          <div className="pp3-section-in">
            <div className="pp3-faq-layout">
              <div>
                <div className="pp3-section-tag">FAQ</div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px,3vw,36px)', fontWeight: 700, color: '#0a0a0a', lineHeight: 1.1, margin: 0 }}>
                  Common<br />questions.
                </h2>
              </div>
              <div className="pp3-faq-list">
                {product.faqs.map((f, i) => (
                  <div key={i} className="pp3-faq-item">
                    <div className="pp3-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{f.question}</span>
                      <span className="pp3-faq-arr">{openFaq === i ? '−' : '+'}</span>
                    </div>
                    {openFaq === i && (
                      <div className="pp3-faq-a" style={{ display: 'block' }}>{f.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RELATED */}
      {product.related.length > 0 && (
        <section className="pp3-section" style={{ background: '#fff', borderTop: '1px solid #eee' }}>
          <div className="pp3-section-in">
            <div className="pp3-section-tag">Related products</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 700, color: '#0a0a0a', lineHeight: 1.1, margin: 0 }}>
              You might also like.
            </h2>
            <div className="pp3-rel-grid">
              {product.related.slice(0, 4).map((r) => (
                <Link
                  key={r.slug}
                  href={productHref(r.slug, productRoutes)}
                  className="pp3-rel-card"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="pp3-rel-icon">{r.icon ?? '📦'}</div>
                  <div className="pp3-rel-body">
                    <div className="pp3-rel-name" style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>{r.name}</div>
                    {r.min_price !== null && (
                      <div className="pp3-rel-price" style={{ fontSize: 11, color: '#E91E8C', fontWeight: 700 }}>
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
