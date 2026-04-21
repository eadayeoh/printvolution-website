// Builds the Long Brochures configurator + pricing_table.prices from
// pvpricelist.rates.longBrochures (tab 11). All prices pulled directly
// from upstream — strict mapping, no invented axes.
//
// Upstream structure (corrected interpretation):
//   LB_PRINT_A[qty][paper] → Type A sheet (A4×3, 630×297mm) print cost
//   LB_PRINT_B[qty][paper] → Type B sheet (A4×4, 840×297mm) print cost
//   LB_LAM[qty][1 or 2]    → lamination cost (1 = single-sided, 2 = both)
//   LB_FOLD_ROWS           → per-qty-tier fold cost {std, plus}
//   LB_QTYS                → [300, 500, 1000, 2000, 3000, ..., 10000]
//
// Axes exposed to the customer:
//   • Type (Type A / Type B)     — what pvpricelist calls A and B
//   • Paper (128 / 157 / 260)
//   • Fold Type (half / tri / z / gate / roll) mapped to std or plus tier
//   • Lamination Finish (none / matt / gloss)
//   • Lamination Sides (single / double) — hidden when finish = none
//   • Quantity
//
// Final price = print + lam + fold, dollars, Math.ceil → cents.

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

const FOLD_TIER = {
  half: 'std',
  tri: 'std',
  z: 'plus',
  gate: 'plus',
  roll: 'plus',
};

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
  type: [
    { slug: 'a', label: 'Type A — A4 × 3', note: '630 × 297mm flat · most common long brochure' },
    { slug: 'b', label: 'Type B — A4 × 4', note: '840 × 297mm flat · bigger, more panels when folded' },
  ],
  paper: [
    { slug: '128', label: '128gsm Art Paper', note: 'Standard' },
    { slug: '157', label: '157gsm Art Paper', note: 'Heavier, more premium feel' },
    { slug: '260', label: '260gsm Art Card', note: 'Thick card stock — holds a crease without flaring' },
  ],
  fold: [
    { slug: 'half', label: 'Half Fold', note: 'One fold · 2 panels' },
    { slug: 'tri', label: 'Tri Fold', note: 'Two folds, letter-style · 3 panels' },
    { slug: 'z', label: 'Z-Fold', note: 'Two folds, zigzag · 3 panels' },
    { slug: 'gate', label: 'Gate Fold', note: 'Two folds, outer panels fold inward · 3 panels' },
    { slug: 'roll', label: 'Roll Fold', note: 'Three folds, rolled inward · 4 panels' },
  ],
  lam_finish: [
    { slug: 'none', label: 'No lamination' },
    { slug: 'matt', label: 'Matt Lam', note: 'Soft-touch, subtle finish' },
    { slug: 'gloss', label: 'Gloss Lam', note: 'High-sheen, vivid colour pop' },
  ],
  lam_sides: [
    { slug: 'one', label: 'Single-sided', note: 'Front face only' },
    { slug: 'two', label: 'Double-sided', note: 'Both faces' },
  ],
};

// ────────────────────────────────────────────────────────────────
// PRICE GENERATION
// ────────────────────────────────────────────────────────────────

const prices = {};
let count = 0;

for (const type of ['a', 'b']) {
  const printTable = type === 'a' ? lb.LB_PRINT_A : lb.LB_PRINT_B;
  for (const paper of PAPERS) {
    for (const foldSlug of ['half', 'tri', 'z', 'gate', 'roll']) {
      const foldTier = FOLD_TIER[foldSlug];
      for (const qty of QTYS) {
        const printCost = printTable[String(qty)]?.[paper];
        if (printCost == null) continue;
        const fCost = foldCost(qty, foldTier);

        // Three lam-finish paths — each generates the right number of
        // lam_sides variants:
        //   none  → sides irrelevant, single placeholder key 'one'
        //   matt  → two keys (one, two) at LB_LAM prices
        //   gloss → two keys (one, two) — same upstream price as matt

        // No lamination — single key with lam_sides='one' placeholder.
        // (UI hides lam_sides step when finish=none, so cfgState resolves
        // to 'one' via auto-reset.)
        {
          const cents = Math.ceil(printCost + 0 + fCost) * 100;
          const key = [type, paper, 'none', 'one', foldSlug, qty].join(':');
          prices[key] = cents;
          count++;
        }

        // Matt and Gloss — both finishes price the same upstream.
        for (const finish of ['matt', 'gloss']) {
          for (const sides of ['one', 'two']) {
            const lamCost = lb.LB_LAM[String(qty)]?.[sides === 'one' ? '1' : '2'] ?? 0;
            const cents = Math.ceil(printCost + lamCost + fCost) * 100;
            const key = [type, paper, finish, sides, foldSlug, qty].join(':');
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
  axis_order: ['type', 'paper', 'lam_finish', 'lam_sides', 'fold'],
  qty_tiers: QTYS,
  prices,
};

// ────────────────────────────────────────────────────────────────
// CONFIGURATOR STEPS
// ────────────────────────────────────────────────────────────────

const steps = [
  {
    step_id: 'type', step_order: 0, label: 'Type', type: 'swatch', required: true,
    options: axes.type, show_if: null, step_config: {},
  },
  {
    step_id: 'paper', step_order: 1, label: 'Paper', type: 'swatch', required: true,
    options: axes.paper, show_if: null, step_config: {},
  },
  {
    step_id: 'fold', step_order: 2, label: 'Fold Type', type: 'swatch', required: true,
    options: axes.fold, show_if: null, step_config: {},
  },
  {
    step_id: 'lam_finish', step_order: 3, label: 'Lamination', type: 'swatch', required: true,
    options: axes.lam_finish, show_if: null, step_config: {},
  },
  {
    step_id: 'lam_sides', step_order: 4, label: 'Lamination Sides', type: 'swatch', required: true,
    options: axes.lam_sides,
    // Hidden when no lamination selected — cfgState auto-resets to 'one'
    // (first option), matching the placeholder slot in the 'none' price keys.
    show_if: { step: 'lam_finish', value: ['matt', 'gloss'] },
    step_config: {},
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

  const delPricing = await fetch(`${URL}/rest/v1/product_pricing?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delPricing.ok) throw new Error(`DELETE product_pricing: ${delPricing.status} ${await delPricing.text()}`);
  console.log('[2/4] Cleared legacy product_pricing matrix.');

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

  const spots = [
    { type: 'a', paper: '128', finish: 'none', sides: 'one', fold: 'half', qty: 300 },
    { type: 'a', paper: '157', finish: 'gloss', sides: 'one', fold: 'tri', qty: 1000 },
    { type: 'a', paper: '157', finish: 'matt', sides: 'one', fold: 'tri', qty: 1000 },
    { type: 'b', paper: '260', finish: 'matt', sides: 'two', fold: 'roll', qty: 5000 },
    { type: 'b', paper: '128', finish: 'none', sides: 'one', fold: 'z', qty: 2000 },
    { type: 'b', paper: '260', finish: 'gloss', sides: 'two', fold: 'gate', qty: 10000 },
  ];
  console.log('\n[4/4] Spot-check (all \$ ceil-rounded from pvpricelist):');
  for (const s of spots) {
    const key = [s.type, s.paper, s.finish, s.sides, s.fold, s.qty].join(':');
    const cents = prices[key];
    const printTable = s.type === 'a' ? lb.LB_PRINT_A : lb.LB_PRINT_B;
    const pCost = printTable[String(s.qty)]?.[s.paper];
    const lCost = s.finish === 'none' ? 0 : lb.LB_LAM[String(s.qty)]?.[s.sides === 'one' ? '1' : '2'];
    const fCost = foldCost(s.qty, FOLD_TIER[s.fold]);
    console.log(`  ${key}`);
    console.log(`    print $${pCost} + lam $${lCost} + fold $${fCost} = $${(pCost + lCost + fCost).toFixed(2)} → stored $${(cents / 100).toFixed(2)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
