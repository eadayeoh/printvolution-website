'use client';

import { useEffect, useMemo, useState } from 'react';

// Business-day math for the "ready by" calendar card. Weekends are
// skipped; SG public holidays are not (the lead time is a quote, and
// admin can always bump the per-product day count to absorb holidays).
function nextBusinessDay(from: Date): Date {
  const d = new Date(from);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}
function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  return d;
}
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function DateTile({
  label,
  date,
  tone,
}: {
  label: string;
  date: Date;
  tone: 'muted' | 'highlight';
}) {
  const isHi = tone === 'highlight';
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: isHi ? 'var(--pv-magenta)' : 'var(--pv-muted)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          border: `2px solid ${isHi ? 'var(--pv-magenta)' : 'var(--pv-ink)'}`,
          background: isHi ? 'var(--pv-yellow)' : '#fff',
          padding: '6px 10px 8px',
          display: 'inline-block',
          minWidth: 80,
        }}
      >
        <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--pv-ink)' }}>
          {WEEKDAY_SHORT[date.getDay()]}
        </div>
        <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 32, lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--pv-ink)', margin: '2px 0' }}>
          {date.getDate()}
        </div>
        <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--pv-ink)' }}>
          {MONTH_SHORT[date.getMonth()]}
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';
import { formatSGD, isImageUrl } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import { evaluateFormula } from '@/lib/pricing';
import type { ProductDetail } from '@/lib/data/products';
import { defaultProductSeoBody } from '@/lib/data/product-seo';
import { productHref, type ProductLookup } from '@/lib/data/navigation-types';
import { DEFAULT_PRODUCT_FEATURES, type ProductFeature } from '@/lib/data/site-settings-types';
import { ProductMatcher, DEFAULT_MATCHER, type MatcherData } from './product-matcher';
import { SeoMagazine, DEFAULT_NAME_CARD_MAGAZINE, buildDefaultMagazine, type SeoMagazineData } from './seo-magazine';

type Props = {
  product: ProductDetail;
  productRoutes: ProductLookup;
  features?: ProductFeature[];
};

export function ProductPage({ product, productRoutes, features }: Props) {
  // "How we print" cards are site-wide — sourced from Site Settings
  // (admin at /admin/settings). The per-product override column
  // product_extras.how_we_print is ignored now; same 4 cards on every
  // product page.
  const productFeatures: ProductFeature[] =
    features && features.length > 0 ? features : DEFAULT_PRODUCT_FEATURES;
  const addToCart = useCart((s) => s.add);

  // Column index used when no size/dimension configurator step is
  // present. Always 0 today — kept as a named constant so the
  // computeTotal / colIdx memo below reads clearly.
  const manualColIdx = 0;
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
      if (step.type === 'qty') {
        const presets = step.step_config?.presets;
        const defaultQty =
          (Array.isArray(presets) && presets.length > 0 && typeof presets[0] === 'number')
            ? presets[0]
            : (step.step_config?.min ?? 1);
        initial[step.step_id] = String(defaultQty);
      }
    }
    return initial;
  });
  const [addedFlash, setAddedFlash] = useState(false);

  useEffect(() => {
    function onScroll() {
      setStickyVisible(window.scrollY > 520);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ready-by calendar. Deferred until after mount so SSR vs client
  // date drift can't cause a hydration mismatch.
  const [readyBy, setReadyBy] = useState<{ today: Date; ready: Date } | null>(null);
  useEffect(() => {
    if (!product.lead_time_days || product.lead_time_days <= 0) return;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const jobStart = nextBusinessDay(tomorrow);
    const ready = addBusinessDays(jobStart, product.lead_time_days - 1);
    setReadyBy({ today, ready });
  }, [product.lead_time_days]);


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

  // Snap any user-entered quantity to the nearest pricing tier at or
  // below it. Below the first tier → first tier.
  function snapToTier(q: number, tiers: number[]): number {
    if (!tiers.length) return q;
    let best = tiers[0];
    for (const t of tiers) {
      if (t <= q) best = t;
      else break;
    }
    return best;
  }

  function computeTotal(useQty: number, useColIdx: number, useRowIdx: number) {
    const breakdown: Array<{ label: string; amount: number }> = [];
    let sum = 0;

    // 1. Multi-axis pricing_table lookup wins if present (e.g. car decals
    //    priced by size × view × qty).
    if (product.pricing_table) {
      const pt = product.pricing_table;
      const tier = snapToTier(useQty, pt.qty_tiers);
      const axisKeys = pt.axis_order.map((axis) => cfgState[axis] ?? '');
      const key = `${axisKeys.join(':')}:${tier}`;
      const tablePrice = pt.prices[key] ?? 0;
      if (tablePrice > 0) {
        // Readable breakdown — "Size: 90mm × 54mm · Face In / Face Out View"
        const parts: string[] = [];
        for (const axis of pt.axis_order) {
          const selectedSlug = cfgState[axis];
          const opts = pt.axes[axis] ?? [];
          const match = opts.find((o) => o.slug === selectedSlug);
          if (match) parts.push(match.label);
        }
        breakdown.push({
          label: `${parts.join(' · ')} × ${tier} pcs`,
          amount: tablePrice,
        });
        sum = tablePrice;
      }
      return { total: sum, breakdown };
    }

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
    [qty, colIdx, rowIdx, cfgState, visibleSteps, product.pricing, product.pricing_table]
  );


  const unitPrice = qty > 0 ? Math.round(lineTotal / qty) : 0;

  const { savings, undiscountedTotal } = useMemo(() => {
    if (qty <= 1 || lineTotal <= 0) return { savings: 0, undiscountedTotal: 0 };
    // For pricing_table products, "single unit price" is meaningless
    // (quantities below the smallest tier are snapped to it). Use the
    // smallest-tier per-piece price × qty as the "no discount" baseline.
    if (product.pricing_table) {
      const pt = product.pricing_table;
      const firstTier = pt.qty_tiers[0];
      const axisKeys = pt.axis_order.map((axis) => cfgState[axis] ?? '').join(':');
      const firstTierPrice = pt.prices[`${axisKeys}:${firstTier}`] ?? 0;
      if (!firstTierPrice || !firstTier) return { savings: 0, undiscountedTotal: 0 };
      const perPieceAtSmallestTier = firstTierPrice / firstTier;
      const undiscounted = Math.round(perPieceAtSmallestTier * qty);
      return {
        savings: Math.max(0, undiscounted - lineTotal),
        undiscountedTotal: undiscounted,
      };
    }
    const { total: singleTotal } = computeTotal(1, colIdx, 0);
    const undiscounted = singleTotal * qty;
    return {
      savings: Math.max(0, undiscounted - lineTotal),
      undiscountedTotal: undiscounted,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, colIdx, cfgState, visibleSteps, product.pricing, product.pricing_table, lineTotal]);
  const savingsPct = undiscountedTotal > 0 ? Math.round((savings / undiscountedTotal) * 100) : 0;

  const fromPrice = useMemo(() => {
    let min: number | null = null;
    // pricing_table wins when present — min over the entire lookup.
    if (product.pricing_table) {
      for (const v of Object.values(product.pricing_table.prices)) {
        if (typeof v === 'number' && v > 0 && (min === null || v < min)) min = v;
      }
      return min;
    }
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
  }, [product.pricing, product.pricing_table, product.configurator, cfgState]);

  const priceLadder = useMemo(() => {
    const { total: singleTotal } = computeTotal(1, colIdx, 0);

    // pricing_table: one ladder row per qty tier, for the
    // currently-selected axes (size + view).
    if (product.pricing_table) {
      const pt = product.pricing_table;
      const axisKeys = pt.axis_order.map((axis) => cfgState[axis] ?? '').join(':');
      const baselinePerPiece = (pt.prices[`${axisKeys}:${pt.qty_tiers[0]}`] ?? 0) / pt.qty_tiers[0];
      return pt.qty_tiers
        .map((q) => {
          const total = pt.prices[`${axisKeys}:${q}`] ?? 0;
          if (total <= 0) return null;
          const perPiece = total / q;
          const undiscounted = baselinePerPiece * q;
          return {
            qty: `${q} pcs`,
            qtyNum: q,
            total,
            perPiece,
            saves: Math.max(0, undiscounted - total),
          };
        })
        .filter(Boolean) as Array<{ qty: string; qtyNum: number; total: number; perPiece: number; saves: number }>;
    }

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

    const hasFormula = product.configurator.some(
      (s) => (s.type === 'swatch' || s.type === 'select') && (s.options ?? []).some((o) => !!o.price_formula)
    );
    if (!hasFormula || singleTotal <= 0) return [];

    const sample: Array<{ qty: number; total: number; perPiece: number; saves: number }> = [];
    let prevPerPiece = singleTotal;
    let plateauAt: number | null = null;
    for (let q = 1; q <= 20; q++) {
      const { total } = computeTotal(q, colIdx, 0);
      const perPiece = total / q;
      const saves = Math.max(0, singleTotal * q - total);
      sample.push({ qty: q, total, perPiece, saves });
      if (q > 1 && Math.abs(perPiece - prevPerPiece) < 1 && plateauAt === null) {
        plateauAt = q;
      }
      prevPerPiece = perPiece;
    }

    const stopAt = plateauAt ? Math.min(plateauAt + 1, 10) : 10;
    const tierQtys = new Set<number>([1, 2, 3]);
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
  }, [product.pricing, product.pricing_table, product.configurator, colIdx, cfgState, visibleSteps]);

  const iconIsUrl = isImageUrl(product.icon);
  const heroImg = product.extras?.image_url || null;
  const heroBig = product.extras?.hero_big || product.name.split(' ').pop()?.toUpperCase() || '';
  const h1 = product.extras?.h1 ?? product.name;
  const h1em = product.extras?.h1em ?? '';
  const intro = product.extras?.intro ?? product.description ?? '';
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
      product_slug: product.slug, product_name: product.name,
      icon: product.extras?.image_url || product.icon,
      config: configLabels, qty, unit_price_cents: unitPrice, line_total_cents: lineTotal,
    });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
  }

  const displayPrice = lineTotal > 0 ? lineTotal : (fromPrice ?? 0);
  const isBase = lineTotal <= 0 || lineTotal === fromPrice;

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
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      {jsonLdFaq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />}

      {/* STICKY PRICE BAR */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
          background: '#fff',
          borderBottom: '2px solid var(--pv-ink)',
          transform: stickyVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        <div style={{ maxWidth: 1560, margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {heroImg ? (
              <img src={heroImg} alt="" style={{ width: 36, height: 36, border: '2px solid var(--pv-ink)', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 24 }}>{product.icon && !iconIsUrl ? product.icon : '📦'}</span>
            )}
            <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 16, letterSpacing: '-0.02em', color: 'var(--pv-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.name}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, color: 'var(--pv-magenta)' }}>{formatSGD(displayPrice)}</div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="pv-btn"
              style={{
                padding: '10px 16px',
                fontSize: 12,
                background: 'var(--pv-orange)',
                color: '#fff',
                borderColor: 'var(--pv-ink)',
              }}
            >
              Add to Cart →
            </button>
          </div>
        </div>
      </div>

      {/* BREADCRUMB */}
      <div
        style={{
          padding: '14px 24px',
          fontFamily: 'var(--pv-f-mono)',
          fontSize: 12,
          color: 'var(--pv-muted)',
          letterSpacing: '0.04em',
          borderBottom: '1px solid var(--pv-rule)',
        }}
      >
        <div style={{ maxWidth: 1560, margin: '0 auto' }}>
          <Link href="/" style={{ color: 'var(--pv-ink)', fontWeight: 600 }}>Home</Link>
          <span style={{ margin: '0 8px', color: 'var(--pv-rule)' }}>/</span>
          {product.category ? (
            <>
              <Link href={`/shop?category=${product.category.slug}`} style={{ color: 'var(--pv-ink)', fontWeight: 600 }}>
                {product.category.name}
              </Link>
              <span style={{ margin: '0 8px', color: 'var(--pv-rule)' }}>/</span>
            </>
          ) : (
            <>
              <Link href="/shop" style={{ color: 'var(--pv-ink)', fontWeight: 600 }}>Shop</Link>
              <span style={{ margin: '0 8px', color: 'var(--pv-rule)' }}>/</span>
            </>
          )}
          <span>{product.name}</span>
        </div>
      </div>

      {/* PRODUCT HERO */}
      <section style={{ padding: '40px 24px 32px', background: '#fff', borderBottom: '2px solid var(--pv-ink)' }}>
        <div style={{ maxWidth: 1560, margin: '0 auto' }}>
          <div
            className="pv-pip-title"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 32,
              alignItems: 'end',
              marginBottom: 14,
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--pv-f-display)',
                fontSize: 'clamp(40px, 5vw, 68px)',
                lineHeight: 0.92,
                letterSpacing: '-0.03em',
                margin: 0,
              }}
            >
              {h1}
              {h1em && (
                <>
                  ,<br />
                  <span style={{ color: 'var(--pv-magenta)' }}>{h1em}</span>
                </>
              )}
            </h1>
          </div>
          {(intro || product.tagline) && (
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.5,
                maxWidth: 760,
                color: 'var(--pv-muted)',
                fontWeight: 500,
                margin: 0,
              }}
            >
              {product.tagline || intro}
            </p>
          )}
          {(product.lead_time_days !== null || product.print_mode) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 18,
              }}
            >
              {product.lead_time_days !== null && product.lead_time_days > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#fff',
                    border: '2px solid var(--pv-ink)',
                    boxShadow: '3px 3px 0 var(--pv-ink)',
                    padding: '7px 12px',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span style={{ color: 'var(--pv-muted)' }}>Lead time</span>
                  <span style={{ color: 'var(--pv-ink)' }}>
                    {product.lead_time_days} working day{product.lead_time_days === 1 ? '' : 's'}
                  </span>
                </span>
              )}
              {product.print_mode && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#fff',
                    border: '2px solid var(--pv-ink)',
                    boxShadow: '3px 3px 0 var(--pv-ink)',
                    padding: '7px 12px',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span style={{ color: 'var(--pv-muted)' }}>Print</span>
                  <span style={{ color: 'var(--pv-magenta)' }}>{product.print_mode}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CONFIGURATOR + PRICE BOX */}
      <section id="pricing" style={{ background: 'var(--pv-cream)', padding: '40px 24px', borderBottom: '2px solid var(--pv-ink)' }}>
        <div
          className="pv-config-grid"
          style={{
            maxWidth: 1560,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {/* LEFT: product reference + upload + how-we-print */}
          <div className="pv-config-left" style={{ position: 'sticky', top: 100 }}>
            <div
              style={{
                aspectRatio: '4/3',
                border: '2px solid var(--pv-ink)',
                boxShadow: '5px 5px 0 var(--pv-ink)',
                overflow: 'hidden',
                marginBottom: 24,
                position: 'relative',
              }}
            >
              {heroImg ? (
                <img
                  src={heroImg}
                  alt={product.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--pv-cream)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 'clamp(54px, 8vw, 120px)',
                    letterSpacing: '-0.04em',
                    color: 'var(--pv-magenta)',
                  }}
                >
                  {heroBig}
                </div>
              )}
            </div>

            {/* Design file upload link */}
            <div
              style={{
                background: '#fff',
                border: '3px dashed var(--pv-magenta)',
                padding: '28px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  border: '3px solid var(--pv-ink)',
                  background: 'var(--pv-yellow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--pv-f-display)',
                  fontSize: 26,
                  margin: '0 auto 14px',
                  transform: 'rotate(-4deg)',
                  boxShadow: '3px 3px 0 var(--pv-ink)',
                }}
                aria-hidden
              >
                ↑
              </div>
              <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, letterSpacing: '-0.02em', marginBottom: 6 }}>
                Got your artwork?
              </div>
              <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-muted)', marginBottom: 14, letterSpacing: '0.04em' }}>
                Paste a Google Drive / WeTransfer link
              </div>
              <input
                type="url"
                value={designFilesUrl}
                onChange={(e) => setDesignFilesUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid var(--pv-ink)',
                  background: '#fff',
                  fontFamily: 'var(--pv-f-body)',
                  fontSize: 13,
                }}
              />
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  background: 'var(--pv-ink)',
                  color: '#fff',
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 11,
                  lineHeight: 1.8,
                  textAlign: 'left',
                }}
              >
                <div style={{ color: 'var(--pv-yellow)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10, marginBottom: 6 }}>
                  File requirements
                </div>
                <div>✓ CMYK colour mode</div>
                <div>✓ 300dpi minimum</div>
                <div>✓ 3mm bleed all sides</div>
                <div>✓ Fonts embedded / outlined</div>
              </div>
            </div>
          </div>

          {/* RIGHT: steps + price box */}
          <div>
            {visibleSteps.length === 0 && (
              <div
                style={{
                  background: '#fff',
                  border: '2px solid var(--pv-ink)',
                  boxShadow: '6px 6px 0 var(--pv-ink)',
                  padding: 22,
                  marginBottom: 14,
                  color: 'var(--pv-muted)',
                  fontSize: 14,
                }}
              >
                This product has no configuration options — add it straight to cart.
              </div>
            )}

            {visibleSteps.map((step, stepIdx) => {
              // Products with a multi-axis pricing_table let users pick
              // the quantity by clicking a row in the Volume Pricing
              // table further down. Hiding the duplicate qty picker here
              // keeps one source of truth.
              if (step.type === 'qty' && product.pricing_table) return null;
              const stepNum = stepIdx + 1;
              if (step.type === 'qty') {
                const currentQty = parseInt(cfgState[step.step_id] || '1', 10) || 1;
                const presets = step.step_config?.presets;
                const hasTierPresets = Array.isArray(presets) && presets.length > 3;
                return (
                  <div
                    key={step.step_id}
                    style={{
                      background: '#fff',
                      border: '2px solid var(--pv-ink)',
                      boxShadow: '6px 6px 0 var(--pv-ink)',
                      padding: 22,
                      marginBottom: 14,
                    }}
                  >
                    <StepHead num={stepNum} label={step.label} current={`${currentQty} pc${currentQty !== 1 ? 's' : ''}`} />
                    {hasTierPresets && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                        {(presets as number[]).map((p) => {
                          const active = currentQty === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setCfgState((s) => ({ ...s, [step.step_id]: String(p) }))}
                              style={{
                                padding: '7px 14px',
                                fontFamily: 'var(--pv-f-mono)',
                                fontSize: 12,
                                fontWeight: 700,
                                background: active ? 'var(--pv-ink)' : '#fff',
                                color: active ? 'var(--pv-yellow)' : 'var(--pv-ink)',
                                border: '1.5px solid var(--pv-ink)',
                                cursor: 'pointer',
                              }}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setCfgState((s) => ({ ...s, [step.step_id]: String(Math.max(1, currentQty - 1)) }))}
                        style={{ width: 44, height: 44, border: '1.5px solid var(--pv-ink)', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={currentQty}
                        min={1}
                        onChange={(e) => setCfgState((s) => ({ ...s, [step.step_id]: e.target.value }))}
                        style={{ width: 96, height: 44, textAlign: 'center', border: '1.5px solid var(--pv-ink)', fontFamily: 'var(--pv-f-display)', fontSize: 18 }}
                      />
                      <button
                        type="button"
                        onClick={() => setCfgState((s) => ({ ...s, [step.step_id]: String(currentQty + 1) }))}
                        style={{ width: 44, height: 44, border: '1.5px solid var(--pv-ink)', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
                      >
                        +
                      </button>
                      <span style={{ marginLeft: 10, fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-muted)' }}>
                        {step.step_config?.note || 'Min 1 · price scales'}
                      </span>
                    </div>
                  </div>
                );
              }
              if (step.type === 'swatch' || step.type === 'select') {
                const selected = step.options.find((o) => o.slug === cfgState[step.step_id]);
                return (
                  <div
                    key={step.step_id}
                    style={{
                      background: '#fff',
                      border: '2px solid var(--pv-ink)',
                      boxShadow: '6px 6px 0 var(--pv-ink)',
                      padding: 22,
                      marginBottom: 14,
                    }}
                  >
                    <StepHead num={stepNum} label={step.label} current={selected?.label ?? ''} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {step.options.map((opt) => {
                        const active = cfgState[step.step_id] === opt.slug;
                        const optCents = opt.price_formula
                          ? Math.round(evaluateFormula(opt.price_formula, { qty: 1, base: 0 }) * 100)
                          : null;
                        const hasImage = !!opt.image_url;
                        return (
                          <button
                            key={opt.slug}
                            type="button"
                            onClick={() => setCfgState((s) => ({ ...s, [step.step_id]: opt.slug }))}
                            style={{
                              padding: hasImage ? 10 : '9px 14px',
                              border: active ? '1.5px solid var(--pv-ink)' : '1.5px solid var(--pv-rule)',
                              background: active ? 'var(--pv-ink)' : '#fff',
                              color: active ? '#fff' : 'var(--pv-ink)',
                              fontFamily: 'var(--pv-f-body)',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.12s',
                              display: hasImage ? 'flex' : 'inline-flex',
                              flexDirection: hasImage ? 'column' : 'row',
                              alignItems: hasImage ? 'stretch' : 'center',
                              gap: hasImage ? 8 : 8,
                              width: hasImage ? 160 : undefined,
                            }}
                          >
                            {hasImage && (
                              <span
                                aria-hidden
                                style={{
                                  width: '100%',
                                  aspectRatio: '1 / 1',
                                  background: '#fff',
                                  border: '1px solid var(--pv-rule)',
                                  overflow: 'hidden',
                                  display: 'block',
                                }}
                              >
                                <img
                                  src={opt.image_url}
                                  alt=""
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                              </span>
                            )}
                            {opt.label}
                            {optCents !== null && optCents > 0 && (
                              <span
                                style={{
                                  fontFamily: 'var(--pv-f-mono)',
                                  fontSize: 11,
                                  marginLeft: 6,
                                  color: active ? 'var(--pv-yellow)' : 'var(--pv-muted)',
                                  fontWeight: 500,
                                }}
                              >
                                {formatSGD(optCents)}
                              </span>
                            )}
                            {opt.note && (
                              <span
                                style={{
                                  fontFamily: 'var(--pv-f-mono)',
                                  fontSize: 10,
                                  marginLeft: 6,
                                  color: active ? 'rgba(255,255,255,0.7)' : 'var(--pv-muted)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                · {opt.note}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              if (step.type === 'text') {
                return (
                  <div
                    key={step.step_id}
                    style={{
                      background: '#fff',
                      border: '2px solid var(--pv-ink)',
                      boxShadow: '6px 6px 0 var(--pv-ink)',
                      padding: 22,
                      marginBottom: 14,
                    }}
                  >
                    <StepHead num={stepNum} label={step.label} current="" />
                    <input
                      value={cfgState[step.step_id] || ''}
                      onChange={(e) => setCfgState((s) => ({ ...s, [step.step_id]: e.target.value }))}
                      placeholder="Type here…"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '2px solid var(--pv-ink)',
                        fontFamily: 'var(--pv-f-body)',
                        fontSize: 14,
                      }}
                    />
                  </div>
                );
              }
              return null;
            })}

            {/* PRICE BOX */}
            <div
              style={{
                background: 'var(--pv-ink)',
                color: '#fff',
                border: '2px solid var(--pv-ink)',
                boxShadow: '6px 6px 0 var(--pv-magenta)',
                padding: '24px 26px',
                marginTop: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginBottom: 14,
                  paddingBottom: 14,
                  borderBottom: '1px dashed rgba(255,255,255,0.2)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-mono)',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.5)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    {isBase ? 'From (incl. GST)' : 'Your total (incl. GST)'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 44,
                      lineHeight: 0.9,
                      letterSpacing: '-0.04em',
                      color: 'var(--pv-yellow)',
                    }}
                  >
                    {formatSGD(displayPrice)}
                  </div>
                </div>
                {qty > 1 && unitPrice > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--pv-f-mono)',
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Per unit
                    </div>
                    <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 16 }}>{formatSGD(unitPrice)}</div>
                  </div>
                )}
              </div>

              <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 12 }}>
                {breakdown.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'rgba(255,255,255,0.75)' }}>
                    <span>{b.label}</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>{formatSGD(b.amount)}</span>
                  </div>
                ))}
                {/* For pricing_table products the qty is already in the breakdown label. */}
                {qty > 1 && !product.pricing_table && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'rgba(255,255,255,0.75)' }}>
                    <span>Quantity</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>× {qty}</span>
                  </div>
                )}
                {savings > 0 && savingsPct > 0 && savingsPct < 100 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--pv-green)' }}>
                    <span>Volume discount ({savingsPct}% off)</span>
                    <span style={{ color: 'var(--pv-green)', fontWeight: 700 }}>− {formatSGD(savings)}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{
                    background: addedFlash ? 'var(--pv-green)' : 'var(--pv-orange)',
                    color: '#fff',
                    padding: '16px 22px',
                    fontWeight: 800,
                    border: '2px solid #fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontSize: 14,
                    flex: 1,
                    cursor: 'pointer',
                    fontFamily: 'var(--pv-f-body)',
                    transition: 'background 0.15s',
                  }}
                >
                  {addedFlash ? '✓ Added to Cart' : 'Add to Cart →'}
                </button>
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontFamily: 'var(--pv-f-mono)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: '0.04em',
                  textAlign: 'center',
                  padding: 8,
                  border: '1px dashed rgba(255,255,255,0.2)',
                }}
              >
                Pre-press file check · <b style={{ color: 'var(--pv-yellow)' }}>Free delivery over S$150</b>
              </div>
            </div>

            {/* READY BY — calendar-style lead time preview */}
            {readyBy && product.lead_time_days && (
              <div
                style={{
                  marginTop: 22,
                  border: '2px solid var(--pv-ink)',
                  boxShadow: '6px 6px 0 var(--pv-magenta)',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    background: 'var(--pv-ink)',
                    color: 'var(--pv-yellow)',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    padding: '8px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Ready by</span>
                  <span style={{ color: '#fff' }}>
                    {product.lead_time_days} working day{product.lead_time_days === 1 ? '' : 's'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: 10,
                    padding: '18px 14px',
                  }}
                >
                  <DateTile label="Order today" date={readyBy.today} tone="muted" />
                  <div
                    aria-hidden
                    style={{
                      fontFamily: 'var(--pv-f-display)',
                      fontSize: 24,
                      color: 'var(--pv-magenta)',
                      letterSpacing: '-0.05em',
                    }}
                  >
                    →
                  </div>
                  <DateTile label="Ready for collection" date={readyBy.ready} tone="highlight" />
                </div>
                <div
                  style={{
                    borderTop: '1px dashed var(--pv-rule)',
                    padding: '10px 14px',
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 10,
                    color: 'var(--pv-muted)',
                    letterSpacing: '0.06em',
                    textAlign: 'center',
                  }}
                >
                  Production clock starts the next working day. Weekends and file revisions add time.
                </div>
              </div>
            )}

            {/* PRICE LADDER */}
            {priceLadder.length > 1 && (
              <div style={{ marginTop: 28 }}>
                <div
                  style={{
                    fontFamily: 'var(--pv-f-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--pv-magenta)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 8,
                  }}
                >
                  Volume Pricing
                </div>
                <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22, letterSpacing: '-0.02em', margin: 0, marginBottom: 14 }}>
                  Order more, pay less per piece.
                </h3>
                {product.pricing_table ? (
                  // Table view for multi-tier pricing — easier to scan 17
                  // rows and compare per-piece cost than a card grid.
                  (() => {
                    const qtyStepId = visibleSteps.find((s) => s.type === 'qty')?.step_id ?? 'qty';
                    const baselinePerPiece = priceLadder[0]?.perPiece ?? 0;
                    const bestPerPiece = priceLadder.reduce((m, r) => Math.min(m, r.perPiece), baselinePerPiece);
                    return (
                      <div
                        style={{
                          border: '2px solid var(--pv-ink)',
                          boxShadow: '6px 6px 0 var(--pv-ink)',
                          background: '#fff',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1.3fr 1fr 1fr',
                            background: 'var(--pv-ink)',
                            color: '#fff',
                            fontFamily: 'var(--pv-f-mono)',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '10px 16px',
                            gap: 8,
                          }}
                        >
                          <div>Quantity</div>
                          <div style={{ textAlign: 'right' }}>Total</div>
                          <div style={{ textAlign: 'right' }}>Per piece</div>
                          <div style={{ textAlign: 'right' }}>vs 200 qty</div>
                        </div>
                        {priceLadder.map((r, i) => {
                          const isCurrent = r.qtyNum === qty;
                          const isBest = Math.abs(r.perPiece - bestPerPiece) < 0.5;
                          const deltaVsBaseline = baselinePerPiece > 0
                            ? Math.round(((baselinePerPiece - r.perPiece) / baselinePerPiece) * 100)
                            : 0;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setCfgState((s) => ({ ...s, [qtyStepId]: String(r.qtyNum) }))}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1.3fr 1fr 1fr',
                                gap: 8,
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                borderTop: i === 0 ? 'none' : '1px solid var(--pv-rule)',
                                background: isCurrent ? 'var(--pv-yellow)' : '#fff',
                                color: 'var(--pv-ink)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                alignItems: 'center',
                                fontFamily: 'var(--pv-f-body)',
                                fontSize: 14,
                                fontWeight: isCurrent ? 700 : 500,
                                transition: 'background 0.12s',
                              }}
                              onMouseEnter={(e) => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = 'var(--pv-cream)'; }}
                              onMouseLeave={(e) => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
                            >
                              <div style={{ fontFamily: 'var(--pv-f-mono)', fontWeight: 700, letterSpacing: '0.02em' }}>
                                {r.qtyNum.toLocaleString()}
                                {isBest && !isCurrent && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      fontSize: 9,
                                      padding: '2px 6px',
                                      background: 'var(--pv-green)',
                                      color: '#fff',
                                      letterSpacing: '0.1em',
                                      verticalAlign: 'middle',
                                    }}
                                  >
                                    BEST /PC
                                  </span>
                                )}
                              </div>
                              <div style={{ textAlign: 'right', fontFamily: 'var(--pv-f-display)', fontSize: 16 }}>
                                {formatSGD(r.total)}
                              </div>
                              <div style={{ textAlign: 'right', fontFamily: 'var(--pv-f-mono)', fontSize: 13, color: 'var(--pv-muted)' }}>
                                {formatSGD(Math.round(r.perPiece))}
                              </div>
                              <div
                                style={{
                                  textAlign: 'right',
                                  fontFamily: 'var(--pv-f-mono)',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: deltaVsBaseline > 0 ? 'var(--pv-green)' : 'var(--pv-muted)',
                                }}
                              >
                                {deltaVsBaseline > 0 ? `−${deltaVsBaseline}%` : '—'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                    {priceLadder.map((r, i) => {
                      const isCurrent = i === rowIdx;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRowIdx(i)}
                          style={{
                            textAlign: 'left',
                            padding: '14px 16px',
                            border: '2px solid var(--pv-ink)',
                            background: isCurrent ? 'var(--pv-ink)' : '#fff',
                            color: isCurrent ? '#fff' : 'var(--pv-ink)',
                            boxShadow: isCurrent ? '4px 4px 0 var(--pv-magenta)' : '4px 4px 0 var(--pv-ink)',
                            cursor: 'pointer',
                            transition: 'all 0.12s',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'var(--pv-f-mono)',
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: isCurrent ? 'rgba(255,255,255,0.6)' : 'var(--pv-muted)',
                              marginBottom: 4,
                            }}
                          >
                            {r.qty}
                          </div>
                          <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 20, color: isCurrent ? 'var(--pv-yellow)' : 'var(--pv-ink)' }}>
                            {formatSGD(r.total)}
                          </div>
                          <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 10, color: isCurrent ? 'rgba(255,255,255,0.6)' : 'var(--pv-muted)', marginTop: 2 }}>
                            {formatSGD(Math.round(r.perPiece))} /pc
                          </div>
                          {r.saves > 0 && (
                            <div
                              style={{
                                marginTop: 4,
                                fontFamily: 'var(--pv-f-mono)',
                                fontSize: 10,
                                fontWeight: 700,
                                color: isCurrent ? 'var(--pv-yellow)' : 'var(--pv-green)',
                              }}
                            >
                              Save {formatSGD(r.saves)}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW WE PRINT (universal site-settings driven) */}
      <section style={{ padding: '72px 24px', background: 'var(--pv-cream)', borderBottom: '1px solid var(--pv-rule)' }}>
        <div style={{ maxWidth: 1560, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--pv-f-display)',
              fontSize: 'clamp(32px, 4vw, 48px)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              margin: 0,
              marginBottom: 32,
            }}
          >
            How we <span style={{ color: 'var(--pv-magenta)' }}>print.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {productFeatures.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '24px 22px',
                  background: '#fff',
                  border: '2px solid var(--pv-ink)',
                  boxShadow: '5px 5px 0 var(--pv-ink)',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--pv-yellow)',
                    border: '2px solid var(--pv-ink)',
                    marginBottom: 14,
                    fontFamily: 'var(--pv-f-display)',
                    fontSize: 18,
                    color: 'var(--pv-ink)',
                    overflow: 'hidden',
                  }}
                >
                  {f.icon_url ? (
                    <img src={f.icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{f.emoji ?? '✓'}</span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 18, letterSpacing: '-0.02em', marginBottom: 6 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--pv-muted)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "Tell us the job, we'll tell you the pick." — IF/THEN matcher.
         Replaces the earlier comparison block with actionable scenario
         rows. Per-product override via product.extras.matcher (jsonb)
         can come later; today every product renders the default. */}
      {(() => {
        const extras = product.extras as (typeof product.extras & { matcher?: MatcherData }) | null;
        const override = extras?.matcher as MatcherData | undefined;
        return (
          <ProductMatcher
            data={override ?? DEFAULT_MATCHER}
            onUse={(apply) => {
              // Merge the recommended combo over current state. String
              // values land on swatch/select steps by slug; numbers
              // become qty string values.
              setCfgState((s) => {
                const next = { ...s };
                for (const [k, v] of Object.entries(apply)) {
                  next[k] = typeof v === 'number' ? String(v) : v;
                }
                return next;
              });
            }}
          />
        );
      })()}

      {/* SEO MAGAZINE — rendered on every product page, same precedence order. */}
      {(() => {
        const extras = product.extras as (typeof product.extras & { seo_magazine?: SeoMagazineData }) | null;
        const override = extras?.seo_magazine as SeoMagazineData | undefined;
        const data =
          override ??
          (product.slug === 'name-card'
            ? DEFAULT_NAME_CARD_MAGAZINE
            : buildDefaultMagazine({
                name: product.name,
                category_name: product.category?.name ?? null,
                tagline: product.tagline,
                description: product.description,
                configurator: product.configurator,
              }));
        return <SeoMagazine data={data} />;
      })()}


      {/* FAQ */}
      {product.faqs.length > 0 && (
        <section style={{ background: 'var(--pv-cream)', padding: '72px 24px', borderTop: '2px solid var(--pv-ink)' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--pv-magenta)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 14,
              }}
            >
              FAQ
            </div>
            <h2 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-0.02em', margin: 0, marginBottom: 32 }}>
              Common <span style={{ color: 'var(--pv-magenta)' }}>questions.</span>
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {product.faqs.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div
                    key={i}
                    style={{
                      border: '2px solid var(--pv-ink)',
                      background: '#fff',
                      boxShadow: '4px 4px 0 var(--pv-ink)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '18px 22px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 18,
                        alignItems: 'center',
                        fontFamily: 'var(--pv-f-display)',
                        fontSize: 18,
                        letterSpacing: '-0.01em',
                        color: 'var(--pv-ink)',
                      }}
                    >
                      <span>{f.question}</span>
                      <span
                        aria-hidden
                        style={{
                          width: 32,
                          height: 32,
                          flexShrink: 0,
                          background: open ? 'var(--pv-ink)' : 'var(--pv-magenta)',
                          color: open ? 'var(--pv-yellow)' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--pv-f-display)',
                          fontSize: 20,
                        }}
                      >
                        {open ? '×' : '+'}
                      </span>
                    </button>
                    {open && (
                      <div style={{ padding: '0 22px 22px', fontSize: 14, color: 'var(--pv-ink-soft)', lineHeight: 1.6, fontWeight: 500 }}>
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

      {/* RELATED */}
      {related.length > 0 && (
        <section style={{ background: '#fff', padding: '64px 24px', borderTop: '1px solid var(--pv-rule)' }}>
          <div style={{ maxWidth: 1560, margin: '0 auto' }}>
            <div
              style={{
                fontFamily: 'var(--pv-f-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--pv-magenta)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 14,
              }}
            >
              Related products
            </div>
            <h3 style={{ fontFamily: 'var(--pv-f-display)', fontSize: 28, letterSpacing: '-0.02em', margin: 0, marginBottom: 22 }}>
              Pairs well with…
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {related.map((r) => {
                const href = productHref(r.slug, productRoutes) ?? '#';
                return (
                  <Link
                    key={r.slug}
                    href={href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: 16,
                      background: '#fff',
                      border: '2px solid var(--pv-ink)',
                      boxShadow: '5px 5px 0 var(--pv-ink)',
                      textDecoration: 'none',
                      color: 'var(--pv-ink)',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        border: '2px solid var(--pv-ink)',
                        background: 'var(--pv-cream)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {r.image_url ? (
                        <img src={r.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 26 }}>{r.icon || '📦'}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--pv-f-display)', fontSize: 16, letterSpacing: '-0.01em', marginBottom: 4 }}>
                        {r.name}
                      </div>
                      {r.min_price !== null && (
                        <div
                          style={{
                            fontFamily: 'var(--pv-f-mono)',
                            fontSize: 11,
                            color: 'var(--pv-magenta)',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                          }}
                        >
                          From {formatSGD(r.min_price)}
                        </div>
                      )}
                    </div>
                    <span aria-hidden style={{ color: 'var(--pv-muted)', fontSize: 18 }}>→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SEO BODY */}
      <section style={{ background: '#fff', padding: '40px 24px 64px' }}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            fontFamily: 'var(--pv-f-mono)',
            fontSize: 12,
            color: 'var(--pv-muted)',
            lineHeight: 1.75,
          }}
        >
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {product.extras?.seo_body?.trim() || defaultProductSeoBody(product.name, fromPrice)}
          </p>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 960px) {
          .pv-config-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .pv-config-left { position: static !important; }
          .pv-pip-title { grid-template-columns: 1fr !important; align-items: start !important; }
          .pv-about-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
      `}</style>
    </article>
  );
}

function StepHead({ num, label, current }: { num: number; label: string; current: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '1px solid var(--pv-rule)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            background: 'var(--pv-ink)',
            color: '#fff',
            fontFamily: 'var(--pv-f-display)',
            fontSize: 12,
          }}
        >
          {num}
        </span>
        <span style={{ fontFamily: 'var(--pv-f-display)', fontSize: 18, letterSpacing: '-0.02em' }}>{label}</span>
      </div>
      {current && (
        <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-magenta)', fontWeight: 600, letterSpacing: '0.04em' }}>
          {current}
        </span>
      )}
    </div>
  );
}
