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
//   • Fold Type — 11 options (6 for Type A, 5 for Type B), each gated
//     to its Type via per-option show_if. Mapped to std or plus tier.
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

// 11 fold options — 6 for Type A (A4×3), 5 for Type B (A4×4). Each is
// gated to its Type via per-option show_if on the fold configurator step.
// std tier = letter/tri-style 2-fold (simpler on the folding machine);
// plus tier = zigzag, gate, roll, or any compound (cross) fold.
const FOLDS = [
  // Type A (A4 × 3, 297 × 630mm)
  { slug: 'letter-a',          label: 'Letter Fold',                  note: '2 folds · letter-style (C-shape) · 297 × 630mm · 3 panels',   tier: 'std',  forType: 'a' },
  { slug: 'accordion-2-a',     label: 'Accordion Fold 2 (Z fold 2)',  note: '2 folds · zigzag · 297 × 630mm · 3 panels',                   tier: 'plus', forType: 'a' },
  { slug: 'roll-3-a',          label: 'Roll fold 3',                  note: '3 folds · rolled inward · 297 × 630mm · 4 panels',            tier: 'plus', forType: 'a' },
  { slug: 'accordion-3-a',     label: 'Accordion Fold 3 (Z fold 3)',  note: '3 folds · zigzag · 297 × 630mm · 4 panels',                   tier: 'plus', forType: 'a' },
  { slug: 'letter-half-a',     label: 'Letter Fold + Half Fold',      note: 'Letter fold then cross-fold in half · compound fold',         tier: 'plus', forType: 'a' },
  { slug: 'accordion-2-half-a',label: 'Accordion Fold 2 + Half Fold', note: 'Accordion-2 then cross-fold in half · compound fold',         tier: 'plus', forType: 'a' },
  // Type B (A4 × 4, 297 × 840mm)
  { slug: 'gate-b',            label: 'Gate Fold',                    note: '2 folds · outer panels fold inward · 297 × 840mm · 3 panels', tier: 'plus', forType: 'b' },
  { slug: 'accordion-3-b',     label: 'Accordion Fold 3 (Z fold 3)',  note: '3 folds · zigzag · 297 × 840mm · 4 panels',                   tier: 'plus', forType: 'b' },
  { slug: 'double-gate-b',     label: 'Double Gate Fold',             note: '3 folds · gate then fold in half · 297 × 840mm · 4 panels',   tier: 'plus', forType: 'b' },
  { slug: 'accordion-4-b',     label: 'Accordion Fold 4 (Z fold 4)',  note: '4 folds · zigzag · 297 × 840mm · 5 panels',                   tier: 'plus', forType: 'b' },
  { slug: 'accordion-3-half-b',label: 'Accordion Fold 3 + Half Fold', note: 'Accordion-3 then cross-fold in half · compound fold',         tier: 'plus', forType: 'b' },
];

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
  fold: FOLDS.map((f) => ({ slug: f.slug, label: f.label, note: f.note })),
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

// Only generate price keys for (fold ∈ valid-for-type) combinations so
// the matrix stays tight (no orphan entries for type B × type-A-only
// folds, and vice versa).
for (const fold of FOLDS) {
  const type = fold.forType;
  const printTable = type === 'a' ? lb.LB_PRINT_A : lb.LB_PRINT_B;
  for (const paper of PAPERS) {
    for (const qty of QTYS) {
      const printCost = printTable[String(qty)]?.[paper];
      if (printCost == null) continue;
      const fCost = foldCost(qty, fold.tier);

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
        const key = [type, paper, 'none', 'one', fold.slug, qty].join(':');
        prices[key] = cents;
        count++;
      }

      // Matt and Gloss — both finishes price the same upstream.
      for (const finish of ['matt', 'gloss']) {
        for (const sides of ['one', 'two']) {
          const lamCost = lb.LB_LAM[String(qty)]?.[sides === 'one' ? '1' : '2'] ?? 0;
          const cents = Math.ceil(printCost + lamCost + fCost) * 100;
          const key = [type, paper, finish, sides, fold.slug, qty].join(':');
          prices[key] = cents;
          count++;
        }
      }
    }
  }
}
console.log(`Computed ${count} prices across ${FOLDS.length} fold options.`);

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
    // Per-option show_if gates each fold to its Type. When the customer
    // switches Type, auto-reset in product-page.tsx picks the first
    // visible fold automatically.
    options: FOLDS.map((f) => ({
      slug: f.slug,
      label: f.label,
      note: f.note,
      show_if: { step: 'type', value: f.forType },
    })),
    show_if: null, step_config: {},
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
    { type: 'a', paper: '128', finish: 'none', sides: 'one', fold: 'letter-a', qty: 300 },
    { type: 'a', paper: '157', finish: 'gloss', sides: 'one', fold: 'accordion-2-a', qty: 1000 },
    { type: 'a', paper: '260', finish: 'matt', sides: 'two', fold: 'roll-3-a', qty: 2000 },
    { type: 'b', paper: '128', finish: 'none', sides: 'one', fold: 'gate-b', qty: 300 },
    { type: 'b', paper: '260', finish: 'matt', sides: 'two', fold: 'double-gate-b', qty: 5000 },
    { type: 'b', paper: '260', finish: 'gloss', sides: 'two', fold: 'accordion-4-b', qty: 10000 },
  ];
  const FOLD_BY_SLUG = Object.fromEntries(FOLDS.map((f) => [f.slug, f]));
  console.log('\n[4/4] Spot-check (all \$ ceil-rounded from pvpricelist):');
  for (const s of spots) {
    const key = [s.type, s.paper, s.finish, s.sides, s.fold, s.qty].join(':');
    const cents = prices[key];
    const printTable = s.type === 'a' ? lb.LB_PRINT_A : lb.LB_PRINT_B;
    const pCost = printTable[String(s.qty)]?.[s.paper];
    const lCost = s.finish === 'none' ? 0 : lb.LB_LAM[String(s.qty)]?.[s.sides === 'one' ? '1' : '2'];
    const fCost = foldCost(s.qty, FOLD_BY_SLUG[s.fold].tier);
    console.log(`  ${key}`);
    console.log(`    print $${pCost} + lam $${lCost} + fold $${fCost} = $${(pCost + lCost + fCost).toFixed(2)} → stored $${(cents / 100).toFixed(2)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
