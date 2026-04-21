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
  paper: [
    { slug: '128', label: '128gsm Art Paper', note: 'Standard' },
    { slug: '157', label: '157gsm Art Paper', note: 'Heavier, more premium feel' },
    { slug: '260', label: '260gsm Art Card', note: 'Thick card stock — holds a fold crease without flaring' },
  ],
  sides: [
    { slug: 'ss', label: 'Single Sided (4C + 0C)', note: 'Print on one side only' },
    { slug: 'ds', label: 'Double Sided (4C + 4C)', note: 'Print on both sides' },
  ],
  lam: [
    { slug: 'none', label: 'No lamination' },
    { slug: 'one', label: 'Single-sided Lam', note: 'Front face only' },
    { slug: 'two', label: 'Double-sided Lam', note: 'Both faces' },
  ],
  fold: [
    { slug: 'std', label: 'Standard fold', note: 'Half-fold or tri-fold (1 fold / 2 folds)' },
    { slug: 'plus', label: 'Plus fold', note: 'Gate-fold / roll-fold / z-fold (more complex)' },
  ],
};

// ────────────────────────────────────────────────────────────────
// PRICE GENERATION
// ────────────────────────────────────────────────────────────────

const prices = {};
let count = 0;
for (const paper of PAPERS) {
  for (const sidesSlug of ['ss', 'ds']) {
    const printTable = sidesSlug === 'ss' ? lb.LB_PRINT_A : lb.LB_PRINT_B;
    for (const lamSlug of ['none', 'one', 'two']) {
      for (const foldSlug of ['std', 'plus']) {
        for (const qty of QTYS) {
          const printCost = printTable[String(qty)]?.[paper];
          if (printCost == null) continue;
          const lamCost =
            lamSlug === 'none' ? 0 : lb.LB_LAM[String(qty)]?.[lamSlug === 'one' ? '1' : '2'] ?? 0;
          const fCost = foldCost(qty, foldSlug);
          // pvpricelist displays totals rounded UP to the next whole
          // dollar — mirror that (books fix applied the same rule).
          const cents = Math.ceil(printCost + lamCost + fCost) * 100;
          const key = [paper, sidesSlug, lamSlug, foldSlug, qty].join(':');
          prices[key] = cents;
          count++;
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
  axis_order: ['paper', 'sides', 'lam', 'fold'],
  qty_tiers: QTYS,
  prices,
};

// ────────────────────────────────────────────────────────────────
// CONFIGURATOR STEPS
// ────────────────────────────────────────────────────────────────

const steps = [
  {
    step_id: 'paper', step_order: 0, label: 'Paper', type: 'swatch', required: true,
    options: axes.paper, show_if: null, step_config: {},
  },
  {
    step_id: 'sides', step_order: 1, label: 'Printing Sides', type: 'swatch', required: true,
    options: axes.sides, show_if: null, step_config: {},
  },
  {
    step_id: 'lam', step_order: 2, label: 'Lamination', type: 'swatch', required: true,
    options: axes.lam, show_if: null, step_config: {},
  },
  {
    step_id: 'fold', step_order: 3, label: 'Fold Type', type: 'swatch', required: true,
    options: axes.fold, show_if: null, step_config: {},
  },
  {
    step_id: 'qty', step_order: 4, label: 'Quantity', type: 'qty', required: false,
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
    { paper: '128', sides: 'ss', lam: 'none', fold: 'std', qty: 300 },
    { paper: '157', sides: 'ds', lam: 'one', fold: 'std', qty: 1000 },
    { paper: '260', sides: 'ds', lam: 'two', fold: 'plus', qty: 5000 },
    { paper: '128', sides: 'ds', lam: 'none', fold: 'std', qty: 10000 },
  ];
  console.log('\n[4/4] Spot-check:');
  for (const s of spots) {
    const key = [s.paper, s.sides, s.lam, s.fold, s.qty].join(':');
    const cents = prices[key];
    const printTable = s.sides === 'ss' ? lb.LB_PRINT_A : lb.LB_PRINT_B;
    const pCost = printTable[String(s.qty)]?.[s.paper];
    const lCost = s.lam === 'none' ? 0 : lb.LB_LAM[String(s.qty)]?.[s.lam === 'one' ? '1' : '2'];
    const fCost = foldCost(s.qty, s.fold);
    console.log(`  ${key}`);
    console.log(`    print $${pCost} + lam $${lCost} + fold $${fCost} = $${(pCost + lCost + fCost).toFixed(2)}`);
    console.log(`    stored: $${(cents / 100).toFixed(2)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
