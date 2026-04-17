'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [stickyVisible, setStickyVisible] = useState(false);
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

  // Sticky bar appears once the hero scrolls away
  useEffect(() => {
    function onScroll() {
      setStickyVisible(window.scrollY > 520);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    const { total: singleTotal } = computeTotal(1, colIdx, 0);

    // 1. If product has an explicit pricing matrix (with quantity rows),
    //    use those rows — that's the canonical ladder.
    if (product.pricing && product.pricing.rows.length > 0) {
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
    }

    // 2. Otherwise, if any configurator option has a price formula that
    //    varies by quantity (volume discount baked into the formula),
    //    synthesise a ladder at common tiers so the customer can see the
    //    savings curve.
    const hasFormula = product.configurator.some(
      (s) => (s.type === 'swatch' || s.type === 'select') && (s.options ?? []).some((o) => !!o.price_formula)
    );
    if (!hasFormula || singleTotal <= 0) return [];

    // Walk qty 1→12 and find the point at which savings plateau (i.e.
    // the formula's discount cap has been reached). Typical volume
    // discounts cap around $10 off per piece, so extra qty beyond the
    // cap doesn't save any MORE per unit. Show tiers up to that cap
    // plus one beyond for context. This keeps the ladder realistic
    // ("nobody buys 100 roll-up banners").
    const sample: Array<{ qty: number; total: number; perPiece: number; saves: number }> = [];
    let prevPerPiece = singleTotal;
    let plateauAt: number | null = null;
    for (let q = 1; q <= 20; q++) {
      const { total } = computeTotal(q, colIdx, 0);
      const perPiece = total / q;
      const saves = Math.max(0, singleTotal * q - total);
      sample.push({ qty: q, total, perPiece, saves });
      if (q > 1 && Math.abs(perPiece - prevPerPiece) < 1 && plateauAt === null) {
        plateauAt = q; // discount has fully kicked in by this qty
      }
      prevPerPiece = perPiece;
    }

    // Show tiers: 1, 2, 3, plateau-point, plateau+2 (or similar).
    const stopAt = plateauAt ? Math.min(plateauAt + 1, 10) : 10;
    const tierQtys = new Set<number>([1, 2, 3]);
    // Fill evenly up to stopAt
    if (stopAt >= 5) tierQtys.add(5);
    if (stopAt >= 10) tierQtys.add(10);
    tierQtys.add(stopAt);
    const sorted = Array.from(tierQtys).filter((q) => q >= 1 && q <= 12).sort((a, b) => a - b);
    return sorted.map((q) => {
      const s = sample[q - 1];
      return {
        qty: q === 1 ? '1 pc' : `${q} pcs`,
        qtyNum: q,
        total: s.total,
        perPiece: s.perPiece,
        saves: s.saves,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.pricing, product.configurator, colIdx, cfgState, visibleSteps]);

  const iconIsUrl = !!product.icon && (product.icon.startsWith('http') || product.icon.startsWith('/'));
  const heroImg = product.extras?.image_url || (iconIsUrl ? product.icon : null);
  // Hero uses a fixed light cream background with brand design elements;
  // legacy `hero_color` is ignored.
  const heroBig = product.extras?.hero_big || product.name.split(' ').pop()?.toUpperCase() || '';
  const h1 = product.extras?.h1 ?? product.name;
  const h1em = product.extras?.h1em ?? '';
  const intro = product.extras?.intro ?? product.description ?? '';
  const whyHeadlineHtml = product.extras?.why_headline ?? '';
  const chips = (product.extras?.chips ?? []).filter(Boolean);
  const whyUs = (product.extras?.why_us ?? []).filter(Boolean);
  const useCases = (product.extras?.use_cases ?? []) as Array<{ title: string; desc: string }>;
  const related = (product.related ?? []).slice(0, 4);

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

  const displayPrice = lineTotal > 0 ? lineTotal : (fromPrice ?? 0);
  const isBase = lineTotal <= 0 || lineTotal === fromPrice;

  // JSON-LD
  const jsonLdProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: intro || product.description || '',
    brand: { '@type': 'Brand', name: 'Printvolution' },
    category: product.category?.name,
    ...(heroImg ? { image: heroImg } : {}),
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'SGD',
      price: ((fromPrice ?? 0) / 100).toFixed(2),
    },
  };
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://printvolution.sg/' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://printvolution.sg/shop' },
      product.category && { '@type': 'ListItem', position: 3, name: product.category.name, item: `https://printvolution.sg/shop?category=${product.category.slug}` },
      { '@type': 'ListItem', position: 4, name: product.name },
    ].filter(Boolean),
  };
  const jsonLdFaq = product.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: product.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  return (
    <article className="pp3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      {jsonLdFaq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />}

      {/* =============== STICKY PRICE BAR =============== */}
      <div
        className="pp3-sticky-bar"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
          background: '#fff', borderBottom: '1px solid #e5e5e5',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          transform: stickyVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform .25s ease',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {heroImg ? (
              <img src={heroImg} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 24 }}>{product.icon && !iconIsUrl ? product.icon : '📦'}</span>
            )}
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.name}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#E91E8C' }}>{formatSGD(displayPrice)}</div>
            <button onClick={handleAddToCart} style={{ padding: '9px 18px', background: '#E91E8C', color: '#fff', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3 }}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* =============== SECTION 1 — HERO (editorial, light, image-led) =============== */}
      <section
        className="pvHero"
        style={{
          position: 'relative',
          background: '#FBF7F1',
          overflow: 'hidden',
        }}
      >
        {/* Grid-paper texture (subtle) */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(10,10,10,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.035) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '-1px -1px',
        }} />

        <div
          className="pvHeroInner"
          style={{
            position: 'relative',
            maxWidth: 1320,
            margin: '0 auto',
            padding: 'clamp(40px, 5vw, 72px) clamp(24px, 4vw, 56px)',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 6fr) minmax(0, 7fr)',
            alignItems: 'center',
            gap: 'clamp(32px, 4vw, 64px)',
          }}
        >
          {/* LEFT — text */}
          <div className="pvHeroText">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" style={{ fontSize: 12, color: '#888', marginBottom: 22, letterSpacing: 0.3, fontWeight: 600 }}>
              <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
              <span style={{ margin: '0 8px' }}>/</span>
              {product.category ? (
                <Link href={`/shop?category=${product.category.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {product.category.name}
                </Link>
              ) : <Link href="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>Shop</Link>}
            </nav>

            {/* CMYK dots + eyebrow */}
            {product.category && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
                color: '#0a0a0a', marginBottom: 20,
              }}>
                <span aria-hidden style={{ display: 'inline-flex', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B8D9' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E91E8C' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD100' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0a0a0a' }} />
                </span>
                {product.category.name}
              </div>
            )}

            {/* H1 — big editorial */}
            <h1 style={{
              fontSize: 'clamp(40px, 5.6vw, 72px)',
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              margin: '0 0 20px',
              color: '#0a0a0a',
            }}>
              {h1}
              {h1em && (
                <>
                  <br />
                  <em style={{
                    fontFamily: 'var(--serif, "Cormorant Garamond", Georgia, serif)',
                    fontStyle: 'italic',
                    fontWeight: 500,
                    fontSize: '0.82em',
                    color: '#E91E8C',
                    letterSpacing: '-0.01em',
                  }}>
                    {h1em}
                  </em>
                </>
              )}
            </h1>

            {product.tagline && (
              <p style={{
                fontSize: 18,
                color: '#555',
                lineHeight: 1.55,
                margin: '0 0 32px',
                maxWidth: 520,
                fontWeight: 400,
              }}>
                {product.tagline}
              </p>
            )}

            {/* Trust chips */}
            {chips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                {chips.slice(0, 3).map((c, i) => (
                  <div key={i} style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '7px 14px',
                    background: '#fff',
                    border: '1px solid #E8E0D3',
                    color: '#333',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                  }}>
                    {c}
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <a
                href="#pricing"
                onClick={(e) => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '15px 26px',
                  borderRadius: 999,
                  background: '#0a0a0a',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: 'none',
                  letterSpacing: 0.4,
                  boxShadow: '0 10px 30px -8px rgba(0,0,0,0.35)',
                }}
              >
                {fromPrice !== null && (
                  <>From <strong style={{ fontSize: 15 }}>{formatSGD(fromPrice)}</strong><span style={{ opacity: 0.6 }}>·</span></>
                )}
                See Pricing →
              </a>
              <a
                href="https://wa.me/6591234567"
                target="_blank"
                rel="noopener"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '15px 24px',
                  borderRadius: 999,
                  color: '#0a0a0a',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                💬 Quick enquiry →
              </a>
            </div>
          </div>

          {/* RIGHT — image with dark ink frame + CMYK corner marks */}
          <div className="pvHeroImage" style={{ position: 'relative' }}>
            {/* Offset dark block behind image (ink swatch) */}
            <div aria-hidden style={{
              position: 'absolute',
              inset: 0,
              background: '#0a0a0a',
              borderRadius: 20,
              transform: 'translate(14px, 14px)',
              zIndex: 0,
            }} />
            {/* Image wrapper */}
            <div style={{
              position: 'relative',
              aspectRatio: '4 / 3',
              width: '100%',
              borderRadius: 20,
              overflow: 'hidden',
              zIndex: 1,
              background: '#0a0a0a',
              boxShadow: '0 30px 80px -30px rgba(0,0,0,0.3)',
            }}>
              {heroImg ? (
                <img
                  src={heroImg}
                  alt={product.name}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)',
                  color: 'rgba(255,255,255,0.08)',
                  fontSize: 'clamp(70px, 11vw, 180px)',
                  fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1,
                  fontFamily: 'var(--serif, "Cormorant Garamond", Georgia, serif)',
                  fontStyle: 'italic',
                }}>
                  {heroBig || product.name.split(' ')[0]}
                </div>
              )}
            </div>

            {/* CMYK registration marks — printer's signature */}
            <div aria-hidden style={{
              position: 'absolute',
              top: -14, right: -14,
              display: 'flex', gap: 4,
              padding: '6px 10px',
              background: '#fff',
              borderRadius: 999,
              boxShadow: '0 6px 20px -6px rgba(0,0,0,0.2)',
              zIndex: 2,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00B8D9' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E91E8C' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD100' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0a0a0a' }} />
            </div>
          </div>
        </div>
      </section>

      {/* =============== SECTION 1B — Template Feature Row (standard across all products) =============== */}
      <section style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {[
            { icon: '✓', title: 'Pre-press file check', desc: 'We inspect every file before it hits the printer.' },
            { icon: '🖼', title: 'Digital mockup', desc: 'Preview your design before we produce it.' },
            { icon: '🚚', title: 'Island-wide delivery', desc: 'Or free pickup at Paya Lebar Square.' },
            { icon: '⚡', title: 'Express available', desc: '24-hour turnaround for rush jobs — ask us.' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: '#FFE4F1', color: '#E91E8C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900,
              }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0a0a0a', marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =============== SECTION 3 — PRICING + CONFIGURATOR =============== */}
      <section id="pricing" className="pp3-section" style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'start' }} className="pp3-pricing-layout">
            {/* LEFT: configurator */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 8 }}>
                Configure
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 28px', color: '#0a0a0a' }}>
                Build your order.
              </h2>

              {visibleSteps.length === 0 && (
                <p style={{ color: '#666', fontSize: 14 }}>This product has no configuration options — add it straight to cart.</p>
              )}

              {visibleSteps.map((step) => {
                if (step.type === 'qty') {
                  const currentQty = parseInt(cfgState[step.step_id] || '1', 10) || 1;
                  return (
                    <div key={step.step_id} style={{ marginBottom: 28 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 10 }}>
                        {step.label} {step.required && <span style={{ color: '#E91E8C' }}>*</span>}
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setCfgState((s) => ({ ...s, [step.step_id]: String(Math.max(1, currentQty - 1)) }))}
                          style={{ width: 44, height: 44, border: '1.5px solid #0a0a0a', background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
                        >−</button>
                        <input
                          type="number"
                          value={currentQty}
                          min={1}
                          onChange={(e) => setCfgState((s) => ({ ...s, [step.step_id]: e.target.value }))}
                          style={{ width: 72, height: 44, textAlign: 'center', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 16, fontWeight: 800 }}
                        />
                        <button
                          type="button"
                          onClick={() => setCfgState((s) => ({ ...s, [step.step_id]: String(currentQty + 1) }))}
                          style={{ width: 44, height: 44, border: '1.5px solid #0a0a0a', background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
                        >+</button>
                        <div style={{ marginLeft: 12, fontSize: 12, color: '#666' }}>Min 1 pc · price scales with quantity</div>
                      </div>
                      {(step as any).discount_note && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 12, color: '#166534', fontWeight: 600 }}>
                          💚 {(step as any).discount_note}
                        </div>
                      )}
                    </div>
                  );
                }
                if (step.type === 'swatch' || step.type === 'select') {
                  return (
                    <div key={step.step_id} style={{ marginBottom: 28 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 10 }}>
                        {step.label} {step.required && <span style={{ color: '#E91E8C' }}>*</span>}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                        {step.options.map((opt) => {
                          const active = cfgState[step.step_id] === opt.slug;
                          const optCents = opt.price_formula
                            ? Math.round(evaluateFormula(opt.price_formula, { qty: 1, base: 0 }) * 100)
                            : null;
                          return (
                            <button
                              key={opt.slug}
                              type="button"
                              onClick={() => setCfgState((s) => ({ ...s, [step.step_id]: opt.slug }))}
                              style={{
                                textAlign: 'left', padding: '14px 16px',
                                border: active ? '2px solid #0a0a0a' : '2px solid #e5e5e5',
                                background: active ? '#0a0a0a' : '#fff',
                                color: active ? '#fff' : '#0a0a0a',
                                borderRadius: 10, cursor: 'pointer',
                                transition: 'all .15s', position: 'relative',
                              }}
                            >
                              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: optCents || opt.note ? 4 : 0 }}>{opt.label}</div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, opacity: active ? 0.8 : 0.65 }}>
                                {optCents !== null && optCents > 0 && <span style={{ fontWeight: 700 }}>{formatSGD(optCents)}</span>}
                                {opt.note && <span style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>· {opt.note}</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                if (step.type === 'text') {
                  return (
                    <div key={step.step_id} style={{ marginBottom: 28 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 10 }}>
                        {step.label}
                      </label>
                      <input
                        value={cfgState[step.step_id] || ''}
                        onChange={(e) => setCfgState((s) => ({ ...s, [step.step_id]: e.target.value }))}
                        style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 14 }}
                        placeholder="Type here…"
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* RIGHT: dark order summary card */}
            <aside style={{ position: 'sticky', top: 80 }}>
              <div style={{ background: '#0a0a0a', color: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 20px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>Your order</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>{product.name}</div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, marginBottom: 14 }}>
                  {breakdown.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '5px 0', color: 'rgba(255,255,255,0.8)' }}>
                      <span>{b.label}</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatSGD(b.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '5px 0', color: 'rgba(255,255,255,0.8)' }}>
                    <span>Quantity</span>
                    <span style={{ fontWeight: 700 }}>× {qty}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>{isBase ? 'From' : 'Total'}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>{formatSGD(displayPrice)}</div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                    Design files (optional)
                  </label>
                  <input
                    type="url"
                    value={designFilesUrl}
                    onChange={(e) => setDesignFilesUrl(e.target.value)}
                    placeholder="Paste Google Drive / WeTransfer link"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: '#fff', borderRadius: 8, fontSize: 12 }}
                  />
                </div>

                <button
                  onClick={handleAddToCart}
                  style={{
                    width: '100%', padding: '14px 18px',
                    background: addedFlash ? '#16a34a' : '#E91E8C', color: '#fff',
                    border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 800,
                    cursor: 'pointer', letterSpacing: 0.3,
                    boxShadow: '0 10px 24px -6px rgba(233,30,140,0.5)',
                  }}
                >
                  {addedFlash ? '✓ Added to Cart' : 'Add to Cart'}
                </button>

                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>✓ Pre-press file check on every order</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>✓ Digital mockup before we print</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>✓ Island-wide delivery or Paya Lebar pickup</div>
                </div>
              </div>
            </aside>
          </div>

          {/* =============== SECTION 4 — PRICE LADDER =============== */}
          {priceLadder.length > 1 && (
            <div style={{ marginTop: 56 }}>
              {(() => {
                const anySaves = priceLadder.some((r) => r.saves > 0);
                const maxSave = Math.max(...priceLadder.map((r) => r.saves || 0));
                return (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C' }}>
                        Volume Pricing
                      </div>
                      {anySaves && (
                        <span style={{ background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          💚 Buy more, save up to {formatSGD(maxSave)}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0a0a0a' }}>
                      {anySaves ? 'Price drops as you order more.' : 'Price at every quantity.'}
                    </h3>
                    <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
                      Click any tier to set that quantity — the total updates automatically.
                    </p>
                  </div>
                );
              })()}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {priceLadder.map((r, i) => {
                  const isCurrent = i === rowIdx;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRowIdx(i)}
                      style={{
                        textAlign: 'left', padding: '16px 18px',
                        border: isCurrent ? '2px solid #0a0a0a' : '2px solid #e5e5e5',
                        background: isCurrent ? '#fafaf7' : '#fff',
                        borderRadius: 12, cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>{r.qty}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#0a0a0a' }}>{formatSGD(r.total)}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{formatSGD(Math.round(r.perPiece))} /pc</div>
                      {r.saves > 0 && (
                        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: '#16a34a' }}>Save {formatSGD(r.saves)}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =============== SECTION 5 — ABOUT / INTRO + HIGHLIGHTS + SPECS =============== */}
      {(intro || product.highlights.length > 0 || product.specs.length > 0) && (
        <section className="pp3-about" style={{ background: '#fafaf7', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'start' }} className="pp3-about-layout">
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 8 }}>About</div>
              <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 20px', color: '#0a0a0a' }}>
                Why this one<br />
                <em style={{ fontFamily: 'var(--serif, Cormorant Garamond, Georgia, serif)', fontStyle: 'italic', fontWeight: 500, color: '#E91E8C' }}>
                  works so well.
                </em>
              </h2>
              {intro && (
                <p style={{ fontSize: 16, lineHeight: 1.7, color: '#333', margin: '0 0 24px' }}>{intro}</p>
              )}
              {product.highlights.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                  {product.highlights.map((h, i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: '#0a0a0a', lineHeight: 1.55 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E91E8C', flexShrink: 0, marginTop: 7 }} />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {product.specs.length > 0 && (
              <div style={{ background: '#fff', border: '2px solid #0a0a0a', borderRadius: 14, padding: 26 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: 18 }}>Specifications</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {product.specs.map((s, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 16, paddingBottom: 10, borderBottom: i === product.specs.length - 1 ? 'none' : '1px dashed #e5e5e5' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =============== SECTION 6 — USE CASES =============== */}
      {useCases.length > 0 && (
        <section className="pp3-use" style={{ background: '#fff', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 8 }}>
                Who Orders This
              </div>
              <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0a0a0a' }}>
                Built for<br />
                <em style={{ fontFamily: 'var(--serif, Cormorant Garamond, Georgia, serif)', fontStyle: 'italic', fontWeight: 500, color: '#E91E8C' }}>
                  every scenario.
                </em>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {useCases.map((u, i) => (
                <div key={i} style={{ background: '#fafaf7', border: '1px solid #eee', borderRadius: 14, padding: 26 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a', marginBottom: 8 }}>{u.title}</div>
                  <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{u.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =============== SECTION 8 — WHY US (dark) =============== */}
      {whyUs.length > 0 && (
        <section className="pp3-why" style={{ background: '#0a0a0a', color: '#fff', padding: '80px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 48, maxWidth: 620 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 10 }}>
                Why Us
              </div>
              {whyHeadlineHtml ? (
                <h2
                  style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#fff', lineHeight: 1.1 }}
                  dangerouslySetInnerHTML={{ __html: whyHeadlineHtml }}
                />
              ) : (
                <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#fff', lineHeight: 1.1 }}>
                  Why buyers<br />
                  <em style={{ fontFamily: 'var(--serif, Cormorant Garamond, Georgia, serif)', fontStyle: 'italic', fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>
                    come back.
                  </em>
                </h2>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {whyUs.map((w, i) => (
                <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 28 }}>
                  <div style={{ fontSize: 34, fontWeight: 900, color: '#E91E8C', marginBottom: 10, letterSpacing: '-0.02em' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>{w}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =============== SECTION 9 — FAQ =============== */}
      {product.faqs.length > 0 && (
        <section className="pp3-faq" style={{ background: '#fff', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 48, alignItems: 'start' }} className="pp3-faq-layout">
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 10 }}>FAQ</div>
              <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#0a0a0a' }}>
                Common<br />
                <em style={{ fontFamily: 'var(--serif, Cormorant Garamond, Georgia, serif)', fontStyle: 'italic', fontWeight: 500, color: '#E91E8C' }}>
                  questions.
                </em>
              </h2>
              <p style={{ fontSize: 14, color: '#666', margin: '16px 0 0', lineHeight: 1.6 }}>
                Can&apos;t find the answer? <a href="https://wa.me/6591234567" target="_blank" rel="noopener" style={{ color: '#E91E8C', fontWeight: 700 }}>Ask on WhatsApp →</a>
              </p>
            </div>
            <div>
              {product.faqs.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '22px 0',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', gap: 18,
                        alignItems: 'center', fontSize: 16, fontWeight: 700, color: '#0a0a0a',
                      }}
                    >
                      <span>{f.question}</span>
                      <span style={{ fontSize: 24, color: '#E91E8C', fontWeight: 400, lineHeight: 1 }}>
                        {open ? '−' : '+'}
                      </span>
                    </button>
                    {open && (
                      <div style={{ paddingBottom: 22, fontSize: 15, color: '#555', lineHeight: 1.65, maxWidth: 640 }}>
                        {f.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =============== SECTION 10 — RELATED =============== */}
      {related.length > 0 && (
        <section style={{ background: '#fafaf7', padding: '56px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#E91E8C', marginBottom: 18 }}>
              Related Products
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {related.map((r) => {
                const href = productHref(r.slug, productRoutes) ?? '#';
                const rIconIsUrl = !!r.icon && (r.icon.startsWith('http') || r.icon.startsWith('/'));
                return (
                  <Link
                    key={r.slug}
                    href={href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: 18, background: '#fff', border: '1px solid #eee',
                      borderRadius: 12, textDecoration: 'none', color: '#0a0a0a',
                      transition: 'border-color .15s, transform .15s',
                    }}
                  >
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: '#fafaf7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {rIconIsUrl ? (
                        <img src={r.icon!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 28 }}>{r.icon || '📦'}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{r.name}</div>
                      {r.min_price !== null && (
                        <div style={{ fontSize: 12, color: '#E91E8C', fontWeight: 700 }}>From {formatSGD(r.min_price)}</div>
                      )}
                    </div>
                    <span style={{ color: '#888', fontSize: 18 }}>→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =============== SECTION 11 — SEO BODY TEXT =============== */}
      <section style={{ background: '#fff', padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', fontSize: 13, color: '#777', lineHeight: 1.75 }}>
          <p style={{ margin: 0 }}>
            Looking for {product.name.toLowerCase()} in Singapore? Printvolution offers fast, high-quality{' '}
            {product.name.toLowerCase()} printing with island-wide delivery or free pickup at Paya Lebar Square.
            {fromPrice !== null && <> Prices start from <strong>{formatSGD(fromPrice)}</strong> with volume discounts available.</>}
            {' '}All orders go through pre-press file checks and digital mockup review before we print, so what you approve is what you get. Need it fast? Express turnaround is available — message us on WhatsApp for rush jobs and custom specs.
          </p>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 960px) {
          .pvHeroInner {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .pvHeroImage {
            margin-right: 14px;
          }
          .pp3-pricing-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
          .pp3-pricing-layout aside { position: static !important; }
          .pp3-about-layout { grid-template-columns: 1fr !important; gap: 32px !important; }
          .pp3-faq-layout { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </article>
  );
}
