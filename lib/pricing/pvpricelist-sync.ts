// pvpricelist → site sync translation layer.
//
// The internal staff tool at pvpricelist.vercel.app stores all its
// rate tables as one big jsonb blob at app_config.rates_v1 in a
// separate Supabase project. This module is the single source of
// truth for turning that blob into the shape the customer-facing site
// expects (products.pricing_table + products.pricing_compute).
//
// Called by:
//   - scripts/apply-*-pricing.mjs — CLI one-shot updates
//   - app/api/sync-pricing/route.ts — webhook-driven continuous sync

// ────────────────────────────────────────────────────────────────────
// Input shape (subset of pvpricelist's rates_v1 value)
// ────────────────────────────────────────────────────────────────────
type PvPricelistRates = {
  flyers?: {
    EP_RATES?: Record<string, Record<number, number>>; // "a4_128_4c0c" → { 600: 68.40, ... }
  };
  basic?: {
    BM?: Record<string, Array<[number, number]>>;      // "100ss" → [[11,1.9], ...]
    BM_CUT_TABLE?: Record<string, number[]>;           // "a4" → [4,7,10,13,16]
  };
};

// ────────────────────────────────────────────────────────────────────
// Output shape — matches the products table columns
// ────────────────────────────────────────────────────────────────────
export type PricingTableJson = {
  axes: Record<string, Array<Record<string, any>>>;
  axis_order: string[];
  axis_order_by_method?: Record<string, string[]>;
  qty_tiers: number[];
  prices: Record<string, number>; // cents
};

export type PricingComputeJson = {
  bm?: {
    match: Record<string, string>;
    size_key: string;
    paper_key: string;
    sides_key: string;
    ups: Record<string, number>;
    tier_map: Record<string, string>;
    tiers: Record<string, Array<[number, number]>>;
    cut: { col_breaks: number[]; table: Record<string, number[]> };
    max_finished_qty: number;
  };
};

export type ProductPricingUpdate = {
  slug: string;
  pricing_table: PricingTableJson | null;
  pricing_compute: PricingComputeJson | null;
};

// ────────────────────────────────────────────────────────────────────
// Flyers translation
// ────────────────────────────────────────────────────────────────────

const FLYERS_OFFSET_QTY_TIERS = [
  300, 500, 600, 1000, 2000, 3000, 4000, 5000,
  6000, 7000, 8000, 9000, 10000, 12000, 14000, 16000, 18000, 20000,
  40000, 60000, 100000, 200000,
];

/** Floor low tiers to this amount ($150 minimum invoice charge — matches
 *  the tier-floor enforcement the pvpricelist UI applies when staff
 *  quote. The live EP_RATES in pvpricelist already bake this in, but
 *  we defensively re-apply to guard against staff editing raw cost
 *  prices into the table without the floor. */
const OFFSET_MIN_FLOOR = 150;

/** Combos for which customer-screenshot data supersedes pvpricelist.
 *  These are A5 Art Card (260/310gsm) + the extended A5 Art Paper
 *  tiers 40k-200k that pvpricelist doesn't carry. We keep them
 *  hardcoded as overrides so pvpricelist can't accidentally stomp them. */
const FLYERS_HARDCODED_OVERRIDES: Record<string, Record<number, number>> = {
  'a5:260card:4c0c': { 600: 120.60, 1000: 130, 2000: 190.60, 3000: 217.60, 4000: 263.80, 5000: 313.80, 6000: 380.20, 7000: 440.90, 8000: 501.50, 9000: 562.10, 10000: 622.80 },
  'a5:260card:4c4c': { 600: 159.70, 1000: 173.30, 2000: 221.70, 3000: 273.40, 4000: 322.50, 5000: 369.60, 6000: 431.20, 7000: 481.30, 8000: 526.50, 9000: 589.10, 10000: 651.70 },
  'a5:310card:4c0c': { 600: 144.80, 1000: 156, 2000: 228.80, 3000: 261.20, 4000: 316.60, 5000: 376.60, 6000: 456.30, 7000: 529.10, 8000: 601.80, 9000: 674.60, 10000: 747.40 },
  'a5:310card:4c4c': { 600: 191.70, 1000: 208, 2000: 256.50, 3000: 328.10, 4000: 387, 5000: 443.60, 6000: 517.50, 7000: 577.60, 8000: 631.80, 9000: 707, 10000: 782.10 },
  // Extended A5 Art Paper tiers 40k-200k (not in pvpricelist) —
  // merged with the live rates further below.
  'a5:128art:4c0c:ext': { 40000: 1014.3, 60000: 1512.4, 100000: 2419.5, 200000: 4826.7 },
  'a5:128art:4c4c:ext': { 40000: 1108.9, 60000: 1651.3, 100000: 2628.7, 200000: 5241.2 },
  'a5:157art:4c0c:ext': { 40000: 1125, 60000: 1654.2, 100000: 2813.5, 200000: 5613.6 },
  'a5:157art:4c4c:ext': { 40000: 1275, 60000: 1832.4, 100000: 3022.7, 200000: 6028.1 },
};

export function buildFlyersPricing(rates: PvPricelistRates): ProductPricingUpdate {
  const ep = rates.flyers?.EP_RATES ?? {};
  const bm = rates.basic?.BM ?? {};
  const bmCut = rates.basic?.BM_CUT_TABLE ?? {};

  // ── OFFSET ── pvpricelist EP_RATES for A4/A5 × 128/157gsm Art Paper,
  //    plus hardcoded overrides for A5 Art Card and extended paper tiers.
  const prices: Record<string, number> = {};

  // pvpricelist keys are a{size}_{gsm}_{sides}, e.g. "a4_128_4c0c".
  // Site keys are offset:{size}:{paper}:{sides}:{qty}.
  const papers = ['128', '157'] as const;
  const sizes = ['a4', 'a5'] as const;
  const sidesMap: Record<string, string> = { '4c0c': '4c0c', '4c4c': '4c4c' };
  for (const size of sizes) {
    for (const gsm of papers) {
      for (const sides of ['4c0c', '4c4c'] as const) {
        const pvKey = `${size}_${gsm}_${sides}`;
        const tiers = ep[pvKey];
        if (!tiers) continue;
        for (const [qtyStr, dollars] of Object.entries(tiers)) {
          const qty = Number(qtyStr);
          const floored = Math.max(dollars as number, OFFSET_MIN_FLOOR);
          prices[`offset:${size}:${gsm}art:${sidesMap[sides]}:${qty}`] = Math.round(floored * 100);
        }
      }
    }
  }

  // Hardcoded overrides — A5 Art Card + extended A5 paper tiers.
  for (const [key, tierMap] of Object.entries(FLYERS_HARDCODED_OVERRIDES)) {
    // Strip the `:ext` suffix used to dedupe extended-tier keys.
    const cleanKey = key.replace(/:ext$/, '');
    for (const [qtyStr, dollars] of Object.entries(tierMap)) {
      const qty = Number(qtyStr);
      prices[`offset:${cleanKey}:${qty}`] = Math.round((dollars as number) * 100);
    }
  }

  const pricingTable: PricingTableJson = {
    axes: {
      method: [
        { slug: 'digital', label: 'Digital' },
        { slug: 'offset',  label: 'Offset' },
      ],
      size: [
        { slug: 'a4', label: 'A4 (210 × 297mm)', note: 'Most common' },
        { slug: 'a5', label: 'A5 (148 × 210mm)' },
        { slug: 'a6', label: 'A6 (105 × 148mm)' },
      ],
      paper: [
        { slug: '128art',  label: '128gsm Art Paper', note: 'Standard' },
        { slug: '157art',  label: '157gsm Art Paper' },
        { slug: '250card', label: '250gsm Art Card' },
        { slug: '300card', label: '300gsm Art Card' },
      ],
      sides: [
        { slug: '2', label: 'Double Sided', note: 'Recommended' },
        { slug: '1', label: 'Single Sided' },
      ],
      size_offset: [
        { slug: 'a4', label: 'A4 (210 × 297mm)' },
        { slug: 'a5', label: 'A5 (148 × 210mm)' },
      ],
      paper_offset: [
        { slug: '128art',  label: '128gsm Art Paper' },
        { slug: '157art',  label: '157gsm Art Paper' },
        { slug: '260card', label: '260gsm Art Card', show_if: { step: 'size_offset', value: 'a5' } },
        { slug: '310card', label: '310gsm Art Card', show_if: { step: 'size_offset', value: 'a5' } },
      ],
      sides_offset: [
        { slug: '4c0c', label: 'Single Sided (4C + 0C)' },
        { slug: '4c4c', label: 'Double Sided (4C + 4C)', note: 'Recommended' },
      ],
    },
    axis_order: ['method', 'size_offset', 'paper_offset', 'sides_offset'],
    axis_order_by_method: {
      digital: ['method', 'size', 'paper', 'sides'],
      offset:  ['method', 'size_offset', 'paper_offset', 'sides_offset'],
    },
    qty_tiers: FLYERS_OFFSET_QTY_TIERS,
    prices,
  };

  // ── DIGITAL ── pvpricelist BM tier tables → pricing_compute.bm for
  //    continuous-qty pricing 1–500.
  const DIGITAL_MAX_QTY = 500;
  const pricingCompute: PricingComputeJson = {
    bm: {
      match: { method: 'digital' },
      size_key: 'size',
      paper_key: 'paper',
      sides_key: 'sides',
      ups: { a4: 2, a5: 4, a6: 8 },
      tier_map: {
        '128art:1':  '100ss', '128art:2':  '100ds',
        '157art:1':  '150ss', '157art:2':  '150ds',
        '250card:1': '260ss', '250card:2': '260ds',
        '300card:1': '310ss', '300card:2': '310ds',
      },
      // Ship only the keys our tier_map references, and fall back to
      // the checked-in defaults if pvpricelist omits any.
      tiers: {
        '100ss': bm['100ss'] ?? DEFAULT_BM['100ss'],
        '100ds': bm['100ds'] ?? DEFAULT_BM['100ds'],
        '150ss': bm['150ss'] ?? DEFAULT_BM['150ss'],
        '150ds': bm['150ds'] ?? DEFAULT_BM['150ds'],
        '260ss': bm['260ss'] ?? DEFAULT_BM['260ss'],
        '260ds': bm['260ds'] ?? DEFAULT_BM['260ds'],
        '310ss': bm['310ss'] ?? DEFAULT_BM['310ss'],
        '310ds': bm['310ds'] ?? DEFAULT_BM['310ds'],
      },
      cut: {
        col_breaks: [100, 200, 300, 400, 500],
        table: {
          a4: bmCut.a4 ?? [4, 7, 10, 13, 16],
          a5: bmCut.a5 ?? [10, 18, 25, 32, 40],
          a6: bmCut.a6 ?? [12, 21, 30, 39, 48],
        },
      },
      max_finished_qty: DIGITAL_MAX_QTY,
    },
  };

  return {
    slug: 'flyers',
    pricing_table: pricingTable,
    pricing_compute: pricingCompute,
  };
}

// ────────────────────────────────────────────────────────────────────
// Default BM tier tables (fallback if pvpricelist omits anything).
// Mirrors pvpricelist/src/calc/basicMaterials.ts at snapshot time.
// ────────────────────────────────────────────────────────────────────
const DEFAULT_BM: Record<string, Array<[number, number]>> = {
  '100ss': [[11,1.9],[20,1.7],[30,1.55],[40,1.45],[50,1.35],[60,1.3],[70,1.25],[80,1.2],[90,1.15],[100,1.1],[150,1.05],[200,1.0],[250,0.95],[300,0.9],[350,0.85],[400,0.8],[450,0.75]],
  '100ds': [[11,3.2],[20,2.65],[30,2.25],[40,1.95],[50,1.8],[60,1.75],[70,1.7],[80,1.65],[90,1.6],[100,1.55],[150,1.5],[200,1.45],[250,1.4],[300,1.35],[350,1.3],[400,1.25],[450,1.2]],
  '150ss': [[11,2.1],[20,1.85],[30,1.65],[40,1.5],[50,1.4],[60,1.35],[70,1.3],[80,1.25],[90,1.2],[100,1.15],[150,1.1],[200,1.05],[250,1.0],[300,0.95],[350,0.9],[400,0.85],[450,0.8]],
  '150ds': [[11,3.3],[20,2.75],[30,2.35],[40,2.05],[50,1.9],[60,1.85],[70,1.8],[80,1.75],[90,1.7],[100,1.65],[150,1.6],[200,1.55],[250,1.5],[300,1.45],[350,1.4],[400,1.35],[450,1.3]],
  '260ss': [[11,2.7],[20,2.4],[30,2.15],[40,2.0],[50,1.9],[60,1.85],[70,1.8],[80,1.75],[90,1.7],[100,1.65],[150,1.6],[200,1.55],[250,1.5],[300,1.45],[350,1.4],[400,1.35],[450,1.3]],
  '260ds': [[11,4.4],[20,3.45],[30,2.75],[40,2.25],[50,2.0],[60,1.95],[70,1.9],[80,1.85],[90,1.8],[100,1.75],[150,1.7],[200,1.65],[250,1.6],[300,1.55],[350,1.5],[400,1.45],[450,1.4]],
  '310ss': [[11,2.9],[20,2.55],[30,2.3],[40,2.1],[50,1.95],[60,1.9],[70,1.85],[80,1.8],[90,1.75],[100,1.7],[150,1.65],[200,1.6],[250,1.55],[300,1.5],[350,1.45],[400,1.4],[450,1.35]],
  '310ds': [[11,5.0],[20,3.85],[30,3.0],[40,2.4],[50,2.05],[60,2.0],[70,1.95],[80,1.9],[90,1.85],[100,1.8],[150,1.75],[200,1.7],[250,1.65],[300,1.6],[350,1.55],[400,1.5],[450,1.45]],
};

// ────────────────────────────────────────────────────────────────────
// Top-level runner — returns all product updates derived from rates.
// Add more products here as their pvpricelist mapping is built out.
// ────────────────────────────────────────────────────────────────────
export function buildAllProductPricingFromPvpricelist(
  rates: PvPricelistRates,
): ProductPricingUpdate[] {
  return [
    buildFlyersPricing(rates),
  ];
}

// ────────────────────────────────────────────────────────────────────
// Fetch rates from pvpricelist's Supabase (public anon key, read-only).
// ────────────────────────────────────────────────────────────────────
export async function fetchPvpricelistRates(): Promise<PvPricelistRates> {
  const url = process.env.PVPRICELIST_URL;
  const key = process.env.PVPRICELIST_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'PVPRICELIST_URL / PVPRICELIST_ANON_KEY env vars not set — see .env.example',
    );
  }
  const res = await fetch(
    `${url}/rest/v1/app_config?key=eq.rates_v1&select=value`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error(`pvpricelist fetch ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  if (!rows.length) throw new Error('pvpricelist: no rates_v1 row');
  return rows[0].value as PvPricelistRates;
}
