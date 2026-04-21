// Builds the Long Brochures product configurator + pricing_table.prices
// from pvpricelist.rates.longBrochures (tab 11). All prices pulled
// straight from upstream — no invented axes.
//
// Upstream structure:
//   LB_PRINT_A[qty][paper] → single-sided (4C+0C) print cost
//   LB_PRINT_B[qty][paper] → double-sided (4C+4C) print cost
//   LB_LAM[qty][sides]     → lamination cost (sides = 1 or 2)
//   LB_FOLD_ROWS           → per-qty-tier fold cost {std, plus}
//   LB_QTYS                → [300, 500, 1000, 2000, ..., 10000]
//
// Paper axis: 128, 157, 260gsm (as priced upstream).
// Final price = print + lam + fold, all in dollars, Math.ceil → cents.

import fs from 'node:fs';

const env = fs.readFileSync(
  '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
  'utf8',
);
const kv = Object.fromEntries(
  env
    .trim()
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);
const URL = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

const PRODUCT_ID = 'c24c1419-42eb-4c19-9d3f-5c95cf1caeaa'; // long-brochures

const snap = JSON.parse(
  fs.readFileSync(
    '/Users/eadayeoh/Desktop/PrintVolution-Tools/.claude/worktrees/modest-morse-51181c/scripts/pvpricelist-snapshot.json',
    'utf8',
  ),
);
const lb = snap.rates.longBrochures;

const QTYS = lb.LB_QTYS; // [300, 500, 1000, 2000, ..., 10000]
const PAPERS = ['128', '157', '260'];

// Every concrete fold option maps to one of the two upstream pricing
// tiers — `std` (simpler fold: half or letter-fold tri) or `plus`
// (more complex: zigzag, gate, roll). The customer sees the specific
// fold name; the price comes out of the right tier.
const FOLD_TIER = {
  half: 'std',
  tri: 'std',
  z: 'plus',
  gate: 'plus',
  roll: 'plus',
};

/** Find the fold row whose upper bound matches the qty. */
function foldCost(qty, tier /* 'std' | 'plus' */) {
  for (const row of lb.LB_FOLD_ROWS) {
    if (qty <= row.to) return row[tier];
  }
  return lb.LB_FOLD_ROWS[lb.LB_FOLD_ROWS.length - 1][tier];
}

// ────────────────────────────────────────────────────────────────
// AXES
// ────────────────────────────────────────────────────────────────

const axes = {
  // Base sheet size. Pvpricelist's longBrochures tab prices only one
  // sheet size (A4 flat). Exposing it as a visible confirmation so
  // customers can see what they're ordering; additional sheet sizes
  // can be added when upstream prices them.
  size: [
    { slug: 'a4', label: 'A4 flat sheet (297 × 210mm)', note: 'Folds to A5 or DL depending on fold type' },
  ],
  paper: [
    { slug: '128', label: '128gsm Art Paper', note: 'Standard' },
    { slug: '157', label: '157gsm Art Paper', note: 'Heavier, more premium feel' },
    { slug: '260', label: '260gsm Art Card', note: 'Thick card stock — holds a crease without flaring' },
  ],
  sides: [
    { slug: 'ss', label: 'Single Sided (4C + 0C)', note: 'Print on one side only' },
    { slug: 'ds', label: 'Double Sided (4C + 4C)', note: 'Print on both sides' },
  ],
  lam: [
    { slug: 'none', label: 'No lamination' },
    { slug: 'gloss_one', label: 'Gloss Lam · single-sided', note: 'Front face only · high-sheen finish' },
    { slug: 'matt_one', label: 'Matt Lam · single-sided', note: 'Front face only · soft-touch finish' },
    { slug: 'gloss_two', label: 'Gloss Lam · double-sided', note: 'Both faces · high-sheen finish' },
    { slug: 'matt_two', label: 'Matt Lam · double-sided', note: 'Both faces · soft-touch finish' },
  ],
  fold: [
    { slug: 'half', label: 'Half Fold', note: 'One fold · finished A5 (148 × 210mm)' },
    { slug: 'tri', label: 'Tri Fold', note: 'Two folds, letter-style · finished DL (99 × 210mm)' },
    { slug: 'z', label: 'Z-Fold', note: 'Two folds, zigzag · finished DL (99 × 210mm)' },
    { slug: 'gate', label: 'Gate Fold', note: 'Two folds, outer panels fold inward' },
    { slug: 'roll', label: 'Roll Fold', note: 'Three folds, rolled inward · 4-panel finished' },
  ],
};

// ────────────────────────────────────────────────────────────────
// PRICE GENERATION
// ────────────────────────────────────────────────────────────────

// Map lam slug → upstream LB_LAM side key. Gloss and Matt carry the
// same upstream price at each side count — pvpricelist treats finish
// as a customer-facing spec, not a price axis.
const LAM_SIDE = {
  none: null,
  gloss_one: '1',
  matt_one: '1',
  gloss_two: '2',
  matt_two: '2',
};

const SIZES = axes.size.map((o) => o.slug);
const LAMS = axes.lam.map((o) => o.slug);
const FOLDS = axes.fold.map((o) => o.slug);

const prices = {};
let count = 0;
for (const size of SIZES) {
  for (const paper of PAPERS) {
    for (const sidesSlug of ['ss', 'ds']) {
      const printTable = sidesSlug === 'ss' ? lb.LB_PRINT_A : lb.LB_PRINT_B;
      for (const lamSlug of LAMS) {
        const lamSideKey = LAM_SIDE[lamSlug];
        for (const foldSlug of FOLDS) {
          const foldTier = FOLD_TIER[foldSlug];
          for (const qty of QTYS) {
            const printCost = printTable[String(qty)]?.[paper];
            if (printCost == null) continue;
            const lamCost = lamSideKey ? lb.LB_LAM[String(qty)]?.[lamSideKey] ?? 0 : 0;
            const fCost = foldCost(qty, foldTier);
            // pvpricelist displays totals rounded UP to the next whole
            // dollar — mirror that rounding convention.
            const cents = Math.ceil(printCost + lamCost + fCost) * 100;
            const key = [size, paper, sidesSlug, lamSlug, foldSlug, qty].join(':');
            prices[key] = cents;
            count++;
          }
        }
      }
    }
  }
}
console.log(`Computed ${count} prices.`);

// ────────────────────────────────────────────────────────────────
// pricing_table
// ────────────────────────────────────────────────────────────────

const pricingTable = {
  axes,
  axis_order: ['size', 'paper', 'sides', 'lam', 'fold'],
  qty_tiers: QTYS,
  prices,
};

// ────────────────────────────────────────────────────────────────
// CONFIGURATOR STEPS
// ────────────────────────────────────────────────────────────────

const steps = [
  {
    step_id: 'size', step_order: 0, label: 'Base Sheet Size', type: 'swatch', required: true,
    options: axes.size, show_if: null, step_config: {},
  },
  {
    step_id: 'paper', step_order: 1, label: 'Paper', type: 'swatch', required: true,
    options: axes.paper, show_if: null, step_config: {},
  },
  {
    step_id: 'sides', step_order: 2, label: 'Printing Sides', type: 'swatch', required: true,
    options: axes.sides, show_if: null, step_config: {},
  },
  {
    step_id: 'fold', step_order: 3, label: 'Fold Type', type: 'swatch', required: true,
    options: axes.fold, show_if: null, step_config: {},
  },
  {
    step_id: 'lam', step_order: 4, label: 'Lamination', type: 'swatch', required: true,
    options: axes.lam, show_if: null, step_config: {},
  },
  {
    step_id: 'qty', step_order: 5, label: 'Quantity', type: 'qty', required: false,
    options: [], show_if: null,
    step_config: { min: 300, step: 1, presets: [300, 500, 1000, 2000, 5000], note: null, discount_note: null, labelMultiplier: null },
  },
];

// ────────────────────────────────────────────────────────────────
// APPLY
// ────────────────────────────────────────────────────────────────

async function main() {
  // Product row
  const pRes = await fetch(`${URL}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      pricing_table: pricingTable,
      pricing_compute: null,
      lead_time_days: 7,
      print_mode: 'Offset',
    }),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/4] products.pricing_table updated.');

  // Wipe stale legacy matrix — prevents the fallback-to-legacy bug
  // we hit on books where an empty lookup fell through to a
  // flyer-shaped ladder.
  const delPricing = await fetch(`${URL}/rest/v1/product_pricing?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delPricing.ok) throw new Error(`DELETE product_pricing: ${delPricing.status} ${await delPricing.text()}`);
  console.log('[2/4] Cleared legacy product_pricing matrix.');

  // Configurator — wipe + insert
  const delCfg = await fetch(`${URL}/rest/v1/product_configurator?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delCfg.ok) throw new Error(`DELETE configurator: ${delCfg.status} ${await delCfg.text()}`);
  const insCfg = await fetch(`${URL}/rest/v1/product_configurator`, {
    method: 'POST', headers: H,
    body: JSON.stringify(steps.map((s) => ({ ...s, product_id: PRODUCT_ID }))),
  });
  if (!insCfg.ok) throw new Error(`INSERT configurator: ${insCfg.status} ${await insCfg.text()}`);
  const inserted = await insCfg.json();
  console.log(`[3/4] Inserted ${inserted.length} configurator steps.`);

  // Spot checks — verify math against pvpricelist
  const spots = [
    { size: 'a4', paper: '128', sides: 'ss', lam: 'none', fold: 'half', qty: 300 },
    { size: 'a4', paper: '157', sides: 'ds', lam: 'gloss_one', fold: 'tri', qty: 1000 },
    { size: 'a4', paper: '157', sides: 'ds', lam: 'matt_one', fold: 'tri', qty: 1000 }, // same price as gloss_one
    { size: 'a4', paper: '260', sides: 'ds', lam: 'matt_two', fold: 'roll', qty: 5000 },
    { size: 'a4', paper: '128', sides: 'ds', lam: 'none', fold: 'z', qty: 2000 },
  ];
  console.log('\n[4/4] Spot-check:');
  for (const s of spots) {
    const key = [s.size, s.paper, s.sides, s.lam, s.fold, s.qty].join(':');
    const cents = prices[key];
    const printTable = s.sides === 'ss' ? lb.LB_PRINT_A : lb.LB_PRINT_B;
    const pCost = printTable[String(s.qty)]?.[s.paper];
    const lSide = LAM_SIDE[s.lam];
    const lCost = lSide ? lb.LB_LAM[String(s.qty)]?.[lSide] : 0;
    const fCost = foldCost(s.qty, FOLD_TIER[s.fold]);
    console.log(`  ${key}`);
    console.log(`    print $${pCost} + lam $${lCost} + fold $${fCost} = $${(pCost + lCost + fCost).toFixed(2)}`);
    console.log(`    stored: $${(cents / 100).toFixed(2)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
