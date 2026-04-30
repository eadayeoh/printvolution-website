'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
import Image from 'next/image';
import { formatSGD, isImageUrl } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import { evaluateFormula } from '@/lib/pricing';
import type { ProductDetail, ConfiguratorStep } from '@/lib/data/products';
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
      if (step.type === 'number') {
        // Seed with the configured minimum so formulas referencing the
        // step (e.g. width / height on PVC Canvas) have a meaningful
        // starting value instead of 0.
        const mn = Number(step.step_config?.min);
        initial[step.step_id] = Number.isFinite(mn) && mn > 0 ? String(mn) : '';
      }
    }
    return initial;
  });
  const [addedFlash, setAddedFlash] = useState(false);
  // Synchronous guard for rapid Add-to-Cart double-clicks. setAddedFlash is
  // async, so three clicks fired in the same tick all see addedFlash=false
  // and produce three duplicate cart rows; a ref blocks re-entry inside the
  // same render frame.
  const addInProgress = useRef(false);

  useEffect(() => {
    function onScroll() {
      setStickyVisible(window.scrollY > 520);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Matches a single show_if condition. value can be a literal string
  // (exact match) or a string[] (OR-match — matches if cfgState[step]
  // is in the list). Used at both step and option level.
  function showIfClauseMatches(c: { step: string; value: string | string[] }): boolean {
    const expected = Array.isArray(c.value) ? c.value : [c.value];
    return expected.includes(cfgState[c.step] ?? '');
  }
  function showIfMatches(pred: ConfiguratorStep['show_if']): boolean {
    if (!pred) return true;
    const conds = Array.isArray(pred) ? pred : [pred];
    return conds.every(showIfClauseMatches);
  }

  const visibleSteps = useMemo(
    () => product.configurator.filter((step) => showIfMatches(step.show_if)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product.configurator, cfgState]
  );

  // Effective lead time + print mode — walks visible swatch steps and
  // lets an option's own lead_time_days / print_mode override the
  // product-level fields. Enables one product (e.g. flyers) to advertise
  // different turnaround per method (Digital: 1 day, Offset: 7 days).
  const { leadTimeDays, printMode } = useMemo(() => {
    let leadTimeDays: number | null = product.lead_time_days ?? null;
    let printMode: string | null = product.print_mode ?? null;
    for (const step of visibleSteps) {
      if (step.type !== 'swatch' && step.type !== 'select') continue;
      const selected = cfgState[step.step_id];
      const opt = step.options?.find((o) => o.slug === selected);
      if (!opt) continue;
      if (typeof opt.lead_time_days === 'number') leadTimeDays = opt.lead_time_days;
      if (typeof opt.print_mode === 'string' && opt.print_mode.trim()) printMode = opt.print_mode;
    }
    return { leadTimeDays, printMode };
  }, [visibleSteps, cfgState, product.lead_time_days, product.print_mode]);

  // Ready-by calendar. Deferred until after mount so SSR vs client
  // date drift can't cause a hydration mismatch. Recomputes when the
  // effective lead time changes (e.g. customer flips Digital ↔ Offset).
  //
  // SGT 13:00 cutoff: if the shopper is viewing past 1pm Singapore time
  // (GMT+8), their order is treated as placed the next working day, so
  // the job start rolls one day forward. Not shown to the customer.
  const [readyBy, setReadyBy] = useState<{ today: Date; ready: Date } | null>(null);
  useEffect(() => {
    if (!leadTimeDays || leadTimeDays <= 0) { setReadyBy(null); return; }
    const today = new Date();
    const sgHour = parseInt(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Singapore',
        hour: 'numeric',
        hour12: false,
      }).format(today),
      10,
    );
    const pastCutoff = sgHour >= 13;
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + (pastCutoff ? 2 : 1));
    const jobStart = nextBusinessDay(tomorrow);
    const ready = addBusinessDays(jobStart, leadTimeDays - 1);
    setReadyBy({ today, ready });
  }, [leadTimeDays]);

  // Reset hidden steps + hidden option selections so pricing lookups
  // don't carry stale axis values. Two passes:
  //   1. If a step is hidden by its show_if, reset its value to the
  //      step's first option (so invisible axes don't leak into keys).
  //   2. If the currently-selected option on a visible step is itself
  //      hidden by an option-level show_if, reset to the first visible
  //      option (e.g. offset 260/310 card hides when size ≠ a5; user
  //      switches size → their card selection auto-resets to 128art).
  useEffect(() => {
    for (const step of product.configurator) {
      // Pass 1 — hidden steps.
      if (step.show_if && !showIfMatches(step.show_if)) {
        const fallback = step.options?.[0]?.slug;
        if (fallback && cfgState[step.step_id] !== fallback) {
          setCfgState((prev) => ({ ...prev, [step.step_id]: fallback }));
          continue;
        }
      }
      // Pass 2 — hidden option on a visible step.
      if (!step.options || step.options.length === 0) continue;
      const visibleOpts = step.options.filter((o) => showIfMatches(o.show_if));
      if (visibleOpts.length === 0) continue;
      const current = cfgState[step.step_id];
      const isVisible = visibleOpts.some((o) => o.slug === current);
      if (!isVisible) {
        setCfgState((prev) => ({ ...prev, [step.step_id]: visibleOpts[0].slug }));
      }
    }
  }, [cfgState, product.configurator]);

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

  // Axis-order resolver — honours `axis_order_by_method` so one product
  // can expose different axis sets per print method (flyers: Digital vs
  // Offset use different step_ids for size/paper/sides).
  function resolveAxisOrder(pt: NonNullable<typeof product.pricing_table>): string[] {
    if (pt.axis_order_by_method) {
      const methodVal = cfgState.method;
      if (methodVal && pt.axis_order_by_method[methodVal]) {
        return pt.axis_order_by_method[methodVal];
      }
    }
    return pt.axis_order;
  }

  // BM (basic-materials) tier-floor calc — mirrors pvpricelist's
  // computeBasicMaterials. Returns cents, or null if the combo is
  // invalid or exceeds the configured finished-qty cap.
  function computeBM(
    bm: NonNullable<NonNullable<typeof product.pricing_compute>['bm']>,
    useQty: number,
  ): { cents: number; breakdownLabel: string } | null {
    const size = cfgState[bm.size_key];
    const paper = cfgState[bm.paper_key];
    const sides = cfgState[bm.sides_key];
    if (!size || !paper || !sides) return null;
    const ups = bm.ups[size];
    if (!ups) return null;
    const tierKey = bm.tier_map[`${paper}:${sides}`];
    if (!tierKey) return null;
    const tiers = bm.tiers[tierKey];
    if (!tiers || tiers.length === 0) return null;
    if (useQty < 1) return null;
    if (useQty > bm.max_finished_qty) return null;

    // Below the first tier's minQty there's no supplier rate — mirrors
    // pvpricelist's "Minimum 11 A3 sheets" guard (11 A3 = 22 A4 = 44 A5
    // = 88 A6). When the typed qty is under the effective min, snap
    // a3Qty UP to the tier floor so the calc returns a valid price
    // instead of null (which would fall back to an unrelated global
    // fromPrice across the entire pricing_table).
    const minA3 = tiers[0][0];
    const rawA3 = Math.ceil(useQty / ups);
    const a3Qty = Math.max(rawA3, minA3);
    const effFinished = a3Qty * ups;
    // applyTierFloor
    let unitIdx = 0;
    for (let i = 0; i < tiers.length; i++) if (a3Qty >= tiers[i][0]) unitIdx = i;
    const unit = tiers[unitIdx][1];
    const raw = a3Qty * unit;
    let minFloor = 0;
    if (unitIdx > 0) {
      const prev = tiers[unitIdx - 1];
      const prevUpper = tiers[unitIdx][0] - 1;
      minFloor = prevUpper * prev[1];
    }
    const print = Math.max(raw, minFloor);
    // Cut fee — first col_break ≥ a3Qty wins; last column if none match.
    let colIdx = bm.cut.col_breaks.length - 1;
    for (let i = 0; i < bm.cut.col_breaks.length; i++) {
      if (a3Qty <= bm.cut.col_breaks[i]) { colIdx = i; break; }
    }
    const cut = bm.cut.table[size]?.[colIdx] ?? 0;
    const total = print + cut;
    const sizeLabel = product.pricing_table?.axes[bm.size_key]?.find((o) => o.slug === size)?.label ?? size;
    const paperLabel = product.pricing_table?.axes[bm.paper_key]?.find((o) => o.slug === paper)?.label ?? paper;
    const sidesLabel = product.pricing_table?.axes[bm.sides_key]?.find((o) => o.slug === sides)?.label ?? sides;
    return {
      cents: Math.round(total * 100),
      breakdownLabel: `${sizeLabel} · ${paperLabel} · ${sidesLabel} × ${effFinished} pcs`,
    };
  }

  function pricingComputeMatches(
    match: Record<string, string>,
  ): boolean {
    for (const [k, v] of Object.entries(match)) {
      if (cfgState[k] !== v) return false;
    }
    return true;
  }

  // Gather all `number`-type configurator steps as numeric variables
  // that price_formula strings can reference. e.g. PVC Canvas uses
  // `width * height / 930.25 * 3.50` where width/height come from
  // customer-entered number steps. Non-number values are ignored.
  function numericCtx(): Record<string, number> {
    const ctx: Record<string, number> = {};
    for (const step of product.configurator) {
      if (step.type !== 'number') continue;
      const raw = cfgState[step.step_id] ?? '';
      const n = parseFloat(raw);
      ctx[step.step_id] = Number.isFinite(n) ? n : 0;
    }
    return ctx;
  }

  function computeTotal(useQty: number, useColIdx: number, useRowIdx: number) {
    const breakdown: Array<{ label: string; amount: number }> = [];
    let sum = 0;
    const nctx = numericCtx();

    // 0. Formula-driven compute (e.g. flyers Digital BM) — wins when
    //    the current cfgState matches the compute's predicate. Returns
    //    the exact price for any integer qty (no tier snap). Add-on
    //    formulas for visible swatch steps not in the axis set still
    //    stack on top.
    if (product.pricing_compute?.bm && pricingComputeMatches(product.pricing_compute.bm.match)) {
      const bm = product.pricing_compute.bm;
      const r = computeBM(bm, useQty);
      if (r) {
        breakdown.push({ label: r.breakdownLabel, amount: r.cents });
        sum = r.cents;
        const axisIds = new Set([bm.size_key, bm.paper_key, bm.sides_key, ...Object.keys(bm.match)]);
        for (const step of visibleSteps) {
          if (step.type !== 'swatch' && step.type !== 'select') continue;
          if (axisIds.has(step.step_id)) continue;
          const selected = cfgState[step.step_id];
          const opt = step.options.find((o) => o.slug === selected);
          if (opt?.price_formula) {
            const valueCents = Math.round(
              evaluateFormula(opt.price_formula, { ...nctx, qty: useQty, base: sum / 100 }) * 100,
            );
            sum += valueCents;
            // Show both charges (positive) and discounts (negative) in
            // the breakdown — hiding negatives makes a % discount preset
            // look invisible on the price summary.
            if (valueCents !== 0) {
              breakdown.push({ label: `${step.label}: ${opt.label}`, amount: valueCents });
            }
          }
        }
        return { total: sum, breakdown };
      }
      // BM computation failed (invalid combo / over cap) — fall through.
    }

    // 1. Multi-axis pricing_table lookup wins if the current combo has
    //    an entry (e.g. car decals, door hangers, flyers-offset). If the
    //    combo has no entry (e.g. flyers-digital where digital pricing
    //    stays on step formulas), we fall through to the formula path
    //    below — letting one product mix tier-priced and formula-priced
    //    methods without duplicating configs.
    if (product.pricing_table) {
      const pt = product.pricing_table;
      const axisOrder = resolveAxisOrder(pt);
      const axisKeys = axisOrder.map((axis) => cfgState[axis] ?? '');
      const axisPrefix = axisKeys.join(':');
      const comboTiers = pt.qty_tiers.filter(
        (t) => (pt.prices[`${axisPrefix}:${t}`] ?? 0) > 0,
      );
      if (comboTiers.length > 0) {
        const tier = snapToTier(useQty, comboTiers);
        const key = `${axisPrefix}:${tier}`;
        const baseTablePrice = pt.prices[key] ?? 0;
        // Admin-editable per-tier $ offset (cents, signed). Applied
        // BEFORE per-unit scaling + monotonicity floor so all downstream
        // maths use the adjusted price. Never drops below 0.
        const adjustCents = pt.qty_adjust?.[String(tier)] ?? 0;
        const tablePrice = Math.max(0, baseTablePrice + adjustCents);
        if (tablePrice > 0) {
          const perUnit = pt.qty_mode === 'per_unit_at_tier_rate';
          const lineQty = perUnit ? useQty : tier;
          let lineCents = perUnit ? Math.round((tablePrice / tier) * useQty) : tablePrice;
          if (perUnit) {
            // Monotonicity floor. Without it, crossing into a cheaper
            // per-unit tier makes the total DROP (e.g. 19 sheets × \$14
            // = \$266 vs 20 sheets × \$13 = \$260). Floor the total at
            // the highest "top-of-prior-tier" amount so +1 on qty never
            // lowers the price.
            let floorCents = 0;
            for (let i = 0; i < comboTiers.length; i++) {
              const t = comboTiers[i];
              if (t >= tier) break;
              const nextT = comboTiers[i + 1];
              if (nextT == null) continue;
              const priorBase = pt.prices[`${axisPrefix}:${t}`] ?? 0;
              const priorAdjCents = pt.qty_adjust?.[String(t)] ?? 0;
              const priorTotal = Math.max(0, priorBase + priorAdjCents);
              const ratePerUnit = priorTotal / t;
              floorCents = Math.max(
                floorCents,
                Math.round(ratePerUnit * (nextT - 1)),
              );
            }
            if (lineCents < floorCents) lineCents = floorCents;
          }
          const parts: string[] = [];
          for (const axis of axisOrder) {
            const selectedSlug = cfgState[axis];
            const opts = pt.axes[axis] ?? [];
            const match = opts.find((o) => o.slug === selectedSlug);
            if (match) parts.push(match.label);
          }
          breakdown.push({
            label: `${parts.join(' · ')} × ${lineQty} pcs`,
            amount: lineCents,
          });
          sum = lineCents;
          // Add-on formulas — any visible swatch step whose step_id is
          // NOT in the axis_order acts as a modifier on top of the tier
          // price (e.g. flyers digital Lamination step still adds its
          // formula $ when tier pricing is in play).
          const axisSet = new Set(axisOrder);
          for (const step of visibleSteps) {
            if (step.type !== 'swatch' && step.type !== 'select') continue;
            if (axisSet.has(step.step_id)) continue;
            const selected = cfgState[step.step_id];
            const opt = step.options.find((o) => o.slug === selected);
            if (opt?.price_formula) {
              const valueCents = Math.round(
                evaluateFormula(opt.price_formula, { ...nctx, qty: useQty, base: sum / 100 }) * 100,
              );
              sum += valueCents;
              if (valueCents !== 0) {
                breakdown.push({ label: `${step.label}: ${opt.label}`, amount: valueCents });
              }
            }
          }
          return { total: sum, breakdown };
        }
      }
      // No entry for this combo — fall through to step formulas.
    }

    let anyFormula = false;

    for (const step of visibleSteps) {
      if (step.type !== 'swatch' && step.type !== 'select') continue;
      const selected = cfgState[step.step_id];
      const opt = step.options.find((o) => o.slug === selected);
      if (opt?.price_formula) {
        anyFormula = true;
        // Pass the running sum as `base` so later steps (e.g. a bulk
        // % discount) can modify the total set by earlier steps.
        // Spread number-step values so dimensional formulas (width,
        // height, eyelets, …) can reference them.
        const valueCents = Math.round(
          evaluateFormula(opt.price_formula, { ...nctx, qty: useQty, base: sum / 100 }) * 100,
        );
        sum += valueCents;
        if (valueCents !== 0) breakdown.push({ label: `${step.label}: ${opt.label}`, amount: valueCents });
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
    [qty, colIdx, rowIdx, cfgState, visibleSteps, product.pricing, product.pricing_table, product.pricing_compute]
  );


  const unitPrice = qty > 0 ? Math.round(lineTotal / qty) : 0;

  const { savings, undiscountedTotal } = useMemo(() => {
    if (qty <= 1 || lineTotal <= 0) return { savings: 0, undiscountedTotal: 0 };
    // For pricing_table products, "single unit price" is meaningless
    // (quantities below the smallest tier are snapped to it). Use the
    // smallest-tier per-piece price × qty as the "no discount" baseline.
    if (product.pricing_table) {
      const pt = product.pricing_table;
      const axisKeys = resolveAxisOrder(pt).map((axis) => cfgState[axis] ?? '').join(':');
      const firstTier = pt.qty_tiers.find(
        (t) => (pt.prices[`${axisKeys}:${t}`] ?? 0) > 0,
      );
      if (firstTier) {
        const firstTierPrice = pt.prices[`${axisKeys}:${firstTier}`] ?? 0;
        if (firstTierPrice > 0) {
          const perPieceAtSmallestTier = firstTierPrice / firstTier;
          const undiscounted = Math.round(perPieceAtSmallestTier * qty);
          return {
            savings: Math.max(0, undiscounted - lineTotal),
            undiscountedTotal: undiscounted,
          };
        }
      }
      // No pricing_table entry for this combo — fall through to the
      // formula-based "singleTotal × qty" baseline below.
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

    // BM compute active — ladder at 50/100/200/300/400/500 breakpoints
    // (the qtys customers actually think in). Per-piece price drops
    // meaningfully across these points.
    if (product.pricing_compute?.bm && pricingComputeMatches(product.pricing_compute.bm.match)) {
      const bm = product.pricing_compute.bm;
      const baselineAt = Math.min(50, bm.max_finished_qty);
      const baseline = computeBM(bm, baselineAt);
      const baselinePerPiece = baseline ? baseline.cents / baselineAt : 0;
      const breakpoints = [50, 100, 200, 300, 400, 500].filter((q) => q <= bm.max_finished_qty);
      return breakpoints
        .map((q) => {
          const r = computeBM(bm, q);
          if (!r) return null;
          const total = r.cents;
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

    // pricing_table: one ladder row per qty tier, for the currently-
    // selected axes. If no tier has an entry for this combo (e.g. the
    // digital method on flyers), fall through to the formula-ladder
    // path below.
    if (product.pricing_table) {
      const pt = product.pricing_table;
      const axisKeys = resolveAxisOrder(pt).map((axis) => cfgState[axis] ?? '').join(':');
      const firstTier = pt.qty_tiers.find(
        (t) => (pt.prices[`${axisKeys}:${t}`] ?? 0) > 0,
      );
      if (firstTier) {
        const baselinePerPiece =
          (pt.prices[`${axisKeys}:${firstTier}`] ?? 0) / firstTier;
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
      // No entries for this combo — fall through to formula-ladder below.
    }

    // Legacy pricing matrix ladder — only used if the matrix actually
    // has non-zero prices. A placeholder row of `[0]` would otherwise
    // return a single zero-row ladder and hide the Volume Pricing
    // section entirely (even when the product has working step formulas
    // that produce genuine volume breakpoints).
    if (product.pricing && product.pricing.rows.length > 0) {
      const hasRealPrices = product.pricing.rows.some(
        (r) => Array.isArray(r.prices) && r.prices.some((p) => typeof p === 'number' && p > 0)
      );
      if (hasRealPrices) {
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
      // Matrix exists but is zero-priced — fall through to formula ladder.
    }

    const hasFormula = product.configurator.some(
      (s) => (s.type === 'swatch' || s.type === 'select') && (s.options ?? []).some((o) => !!o.price_formula)
    );
    if (!hasFormula || singleTotal <= 0) return [];

    // Formula-only ladder — only expose quantities where the per-piece
    // cost is actually cheaper than qty 1. Skip the "qty 2/3 at the same
    // rate as qty 1" rows entirely — showing them with no savings was
    // misleading. If nothing in the sample range beats the qty 1 rate,
    // the ladder returns empty and the whole Volume Pricing section
    // hides (guarded by `priceLadder.length > 1`).
    const maxSample = 20;
    const perPieceTolerance = 1; // cents — ignore float noise
    const totals: number[] = [];
    for (let q = 1; q <= maxSample; q++) {
      const { total } = computeTotal(q, colIdx, 0);
      totals.push(total);
    }
    const basePerPiece = totals[0]; // qty 1 per-piece = total at qty 1
    const breakpoints: number[] = [];
    let lastPerPiece = basePerPiece;
    for (let q = 2; q <= maxSample; q++) {
      const perPiece = totals[q - 1] / q;
      if (perPiece < lastPerPiece - perPieceTolerance) {
        breakpoints.push(q);
        lastPerPiece = perPiece;
      }
    }
    if (breakpoints.length === 0) return []; // No discount → hide section

    // Add one "scale" row at ~2× the first breakpoint so customers see
    // the discount holds at a higher qty too. Skip if the scale qty
    // would duplicate an existing breakpoint or exceed the sample.
    const first = breakpoints[0];
    const scale = first * 2;
    if (scale <= maxSample && !breakpoints.includes(scale)) {
      breakpoints.push(scale);
    }

    const ladderQtys = [1, ...breakpoints];
    return ladderQtys.map((q) => {
      const total = totals[q - 1];
      return {
        qty: q === 1 ? '1 pc' : `${q} pcs`,
        qtyNum: q,
        total,
        perPiece: total / q,
        saves: Math.max(0, basePerPiece * q - total),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.pricing, product.pricing_table, product.pricing_compute, product.configurator, colIdx, cfgState, visibleSteps]);

  const iconIsUrl = isImageUrl(product.icon);
  const heroImg = product.extras?.image_url || null;
  const heroBig = product.extras?.hero_big || product.name.split(' ').pop()?.toUpperCase() || '';
  const h1 = product.extras?.h1 ?? product.name;
  const h1em = product.extras?.h1em ?? '';
  // Hero sub-copy precedence (most-specific wins): admin's short
  // description > long-form intro (extras.intro) > tagline. This lets
  // an admin edit "Short description" in the editor and see the change
  // land on the hero — previously tagline always won and hid the edit.
  // Tagline still drives shop listings + nav hover preview.
  const heroSub =
    product.description || product.extras?.intro || product.tagline || '';
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
    // Guard against rapid double-clicks creating duplicate cart rows.
    if (addInProgress.current) return;
    addInProgress.current = true;
    addToCart({
      product_slug: product.slug, product_name: product.name,
      icon: product.extras?.image_url || product.icon,
      config: configLabels, qty, unit_price_cents: unitPrice, line_total_cents: lineTotal,
    });
    setAddedFlash(true);
    setTimeout(() => {
      setAddedFlash(false);
      addInProgress.current = false;
    }, 2000);
  }

  const displayPrice = lineTotal > 0 ? lineTotal : (fromPrice ?? 0);
  const isBase = lineTotal <= 0 || lineTotal === fromPrice;

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
              <Image
                src={heroImg}
                alt=""
                width={36}
                height={36}
                style={{ border: '2px solid var(--pv-ink)', objectFit: 'cover' }}
              />
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
          {heroSub && (
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
              {heroSub}
            </p>
          )}
          {((leadTimeDays ?? 0) > 0 || printMode) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 18,
              }}
            >
              {leadTimeDays !== null && leadTimeDays > 0 && (
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
                    {leadTimeDays} working day{leadTimeDays === 1 ? '' : 's'}
                  </span>
                </span>
              )}
              {printMode && (
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
                  <span style={{ color: 'var(--pv-magenta)' }}>{printMode}</span>
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
              // table further down — hiding the duplicate qty picker
              // here keeps one source of truth. BUT: if the current
              // method uses pricing_compute.bm (continuous-qty, no tier
              // rows), we MUST show the qty input here so customers
              // can type any number.
              if (step.type === 'qty' && product.pricing_table) {
                const bmActive = !!(
                  product.pricing_compute?.bm &&
                  pricingComputeMatches(product.pricing_compute.bm.match)
                );
                // `force_show: true` on the step_config overrides the
                // hide — used by stickers where the customer types the
                // sheet count and the tier discount auto-applies via
                // snap-to-tier instead of picking from a ladder.
                const forceShow = !!(step.step_config as { force_show?: boolean } | null | undefined)?.force_show;
                if (!bmActive && !forceShow) return null;
              }
              const stepNum = stepIdx + 1;
              if (step.type === 'qty') {
                const qtyMin = Math.max(1, step.step_config?.min ?? 1);
                const currentQty = parseInt(cfgState[step.step_id] || String(qtyMin), 10) || qtyMin;
                const presets = step.step_config?.presets;
                // Show preset buttons whenever the admin has configured
                // any — previously gated at 4+ which silently hid small
                // preset lists (e.g. "1, 5") the admin explicitly typed.
                const hasTierPresets = Array.isArray(presets) && presets.length >= 1;
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
                        onClick={() => setCfgState((s) => ({ ...s, [step.step_id]: String(Math.max(qtyMin, currentQty - 1)) }))}
                        style={{ width: 44, height: 44, border: '1.5px solid var(--pv-ink)', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={currentQty}
                        min={qtyMin}
                        onChange={(e) => setCfgState((s) => ({ ...s, [step.step_id]: e.target.value }))}
                        onBlur={(e) => {
                          const n = parseInt(e.target.value || '0', 10);
                          if (!n || n < qtyMin) {
                            setCfgState((s) => ({ ...s, [step.step_id]: String(qtyMin) }));
                          }
                        }}
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
                      {step.options.filter((opt) => showIfMatches(opt.show_if)).map((opt) => {
                        const active = cfgState[step.step_id] === opt.slug;
                        const optCents = opt.price_formula
                          ? Math.round(evaluateFormula(opt.price_formula, { qty: 1, base: 0 }) * 100)
                          : null;
                        const hasImage = !!opt.image_url;
                        // Colour swatch — a hex string on opt.swatch renders
                        // as a small filled circle before the label. Used by
                        // NCR ink colour picker, or any option where the
                        // pick IS a colour (not the option label text).
                        const swatchHex =
                          typeof (opt as { swatch?: unknown }).swatch === 'string'
                          && /^#[0-9a-f]{3,8}$/i.test((opt as { swatch: string }).swatch)
                            ? (opt as { swatch: string }).swatch
                            : null;
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
                                  position: 'relative',
                                  width: '100%',
                                  aspectRatio: '1 / 1',
                                  background: '#fff',
                                  border: '1px solid var(--pv-rule)',
                                  overflow: 'hidden',
                                  display: 'block',
                                }}
                              >
                                <Image
                                  src={opt.image_url as string}
                                  alt=""
                                  fill
                                  sizes="160px"
                                  style={{ objectFit: 'cover' }}
                                />
                              </span>
                            )}
                            {swatchHex && (
                              <span
                                aria-hidden
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: swatchHex,
                                  border: active ? '1px solid rgba(255,255,255,0.5)' : '1px solid var(--pv-rule)',
                                  flexShrink: 0,
                                  display: 'inline-block',
                                }}
                              />
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
              if (step.type === 'number') {
                const raw = cfgState[step.step_id] || '';
                const numMin = Math.max(0, Number(step.step_config?.min ?? 0));
                const currentN = parseFloat(raw);
                const currentLabel = Number.isFinite(currentN) && raw !== '' ? String(currentN) : '—';
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
                    <StepHead num={stepNum} label={step.label} current={currentLabel} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={raw}
                        min={numMin || undefined}
                        onChange={(e) => setCfgState((s) => ({ ...s, [step.step_id]: e.target.value }))}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!Number.isFinite(v) || v < numMin) {
                            setCfgState((s) => ({ ...s, [step.step_id]: numMin > 0 ? String(numMin) : '' }));
                          }
                        }}
                        placeholder={numMin > 0 ? `${numMin}` : ''}
                        style={{ width: 160, height: 44, textAlign: 'center', border: '1.5px solid var(--pv-ink)', fontFamily: 'var(--pv-f-display)', fontSize: 18 }}
                      />
                      {step.step_config?.note && (
                        <span style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-muted)' }}>
                          {step.step_config.note}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {/* STICKERS — live per-sheet yield calc. Sheet is 320 × 450mm
                with a 10mm gutter between stickers for die-cut bleed.
                Tries both orientations and picks the one that fits more. */}
            {product.slug === 'stickers' && (() => {
              const w = parseFloat(cfgState.width ?? '');
              const h = parseFloat(cfgState.height ?? '');
              if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
              const SHEET_W = 320, SHEET_H = 450, GUTTER = 10;
              const yieldA = Math.floor(SHEET_W / (w + GUTTER)) * Math.floor(SHEET_H / (h + GUTTER));
              const yieldB = Math.floor(SHEET_W / (h + GUTTER)) * Math.floor(SHEET_H / (w + GUTTER));
              const perSheet = Math.max(yieldA, yieldB, 0);
              const totalStickers = perSheet * qty;
              const overflow = w > SHEET_W - GUTTER || h > SHEET_H - GUTTER
                ? (w <= SHEET_H - GUTTER && h <= SHEET_W - GUTTER ? false : true)
                : false;
              return (
                <div
                  style={{
                    background: perSheet === 0 ? '#fef2f2' : '#fef9c3',
                    border: '2px solid var(--pv-ink)',
                    boxShadow: '6px 6px 0 var(--pv-ink)',
                    padding: '18px 22px',
                    marginBottom: 14,
                    fontFamily: 'var(--pv-f-body)',
                    fontSize: 14,
                    color: 'var(--pv-ink)',
                  }}
                >
                  <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--pv-muted)', marginBottom: 6 }}>
                    Stickers per sheet
                  </div>
                  {perSheet === 0 || overflow ? (
                    <div>
                      <strong>Too big to fit.</strong> Your {w} × {h}mm sticker doesn't fit on a 320 × 450mm sheet
                      with the 10mm die-cut gutter. Shrink the size or contact us for a larger custom quote.
                    </div>
                  ) : (
                    <div>
                      <strong style={{ fontFamily: 'var(--pv-f-display)', fontSize: 22 }}>
                        {perSheet} sticker{perSheet === 1 ? '' : 's'}
                      </strong>
                      {' '}per sheet at {w} × {h}mm ·{' '}
                      <strong>{totalStickers.toLocaleString()} total</strong> across {qty} sheet{qty === 1 ? '' : 's'}.
                      <div style={{ fontFamily: 'var(--pv-f-mono)', fontSize: 11, color: 'var(--pv-muted)', marginTop: 6 }}>
                        Sheet: 320 × 450mm · 10mm gutter between stickers for die-cut bleed.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
                {breakdown.map((b, i) => {
                  const isDiscount = b.amount < 0;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        color: isDiscount ? 'var(--pv-green)' : 'rgba(255,255,255,0.75)',
                      }}
                    >
                      <span>{b.label}</span>
                      <span style={{ color: isDiscount ? 'var(--pv-green)' : '#fff', fontWeight: 700 }}>
                        {isDiscount ? '− ' : ''}{formatSGD(Math.abs(b.amount))}
                      </span>
                    </div>
                  );
                })}
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

            {/* PRICE LADDER — hidden for stickers, which use a typed
                qty with auto-computed tier discount (no ladder UI). */}
            {priceLadder.length > 1 && product.slug !== 'stickers' && (
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
                {/* Single table view for every product — previously split
                    into a table (pricing_table products) and a card grid
                    (formula-only). That inconsistency had door hangers
                    showing a table while roll-ups / standees showed
                    squares. Table reads the same data (priceLadder) and
                    works for 3-row and 17-row ladders alike. */}
                {(() => {
                  const qtyStepId = visibleSteps.find((s) => s.type === 'qty')?.step_id ?? 'qty';
                  const baselinePerPiece = priceLadder[0]?.perPiece ?? 0;
                  const bestPerPiece = priceLadder.reduce((m, r) => Math.min(m, r.perPiece), baselinePerPiece);
                  const baselineLabel = priceLadder[0]?.qty ?? '';
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
                        <div style={{ textAlign: 'right' }}>vs {baselineLabel}</div>
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
                              {isBest && !isCurrent && priceLadder.length > 1 && (
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
                })()}
              </div>
            )}

            {/* READY BY — calendar-style lead time preview */}
            {readyBy && leadTimeDays && (
              <div
                style={{
                  marginTop: 28,
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
                    {leadTimeDays} working day{leadTimeDays === 1 ? '' : 's'}
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
                    position: 'relative',
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
                    <Image
                      src={f.icon_url}
                      alt=""
                      fill
                      sizes="42px"
                      style={{ objectFit: 'cover' }}
                    />
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
        return <SeoMagazine data={data} seoTitle={extras?.seo_title} productName={product.name} />;
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
                        position: 'relative',
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
                        <Image
                          src={r.image_url}
                          alt={r.name}
                          fill
                          sizes="56px"
                          style={{ objectFit: 'cover' }}
                        />
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
