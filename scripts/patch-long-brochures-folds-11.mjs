// Long Brochures: expand fold axis from 5 → 11 options to match the
// supplier's fold sheet (Type A × 6 folds + Type B × 5 folds).
//
//   Type A (A4×3, 297×630mm):
//     1. Letter Fold                          → std tier
//     2. Accordion Fold 2 (Z fold 2)          → plus tier
//     3. Roll fold 3                          → plus tier
//     4. Accordion Fold 3 (Z fold 3)          → plus tier
//     5. Letter Fold + Half Fold              → plus tier
//     6. Accordion Fold 2 + Half Fold         → plus tier
//
//   Type B (A4×4, 297×840mm):
//     7. Gate Fold                            → plus tier
//     8. Accordion Fold 3 (Z fold 3)          → plus tier
//     9. Double Gate Fold                     → plus tier
//     10. Accordion Fold 4 (Z fold 4)         → plus tier
//     11. Accordion Fold 3 + Half Fold        → plus tier
//
// Per-option show_if gates each fold to its Type. Prices are regenerated
// from pvpricelist with the new fold slugs. Rest of the configurator
// (type, paper, lam_finish, lam_sides, qty) stays untouched — surgical.

import fs from 'node:fs';

const env = fs.readFileSync(
  '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
  'utf8',
);
const kv = Object.fromEntries(
  env.trim().split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }),
);
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

const PRODUCT_ID = 'c24c1419-42eb-4c19-9d3f-5c95cf1caeaa';

const snap = JSON.parse(
  fs.readFileSync('scripts/pvpricelist-snapshot.json', 'utf8'),
);
const lb = snap.rates.longBrochures;
const QTYS = lb.LB_QTYS;
const PAPERS = ['128', '157', '260'];

function foldCost(qty, tier /* 'std' | 'plus' */) {
  for (const row of lb.LB_FOLD_ROWS) {
    if (qty <= row.to) return row[tier];
  }
  return lb.LB_FOLD_ROWS[lb.LB_FOLD_ROWS.length - 1][tier];
}

// ────────────────────────────────────────────────────────────────
// FOLDS — slug, label, tier, which Type it belongs to
// ────────────────────────────────────────────────────────────────

const FOLDS = [
  // Type A (A4 × 3)
  { slug: 'letter-a',          label: 'Letter Fold',                  note: '2 folds · letter-style (C-shape) · 297 × 630mm · 3 panels',   tier: 'std',  forType: 'a' },
  { slug: 'accordion-2-a',     label: 'Accordion Fold 2 (Z fold 2)',  note: '2 folds · zigzag · 297 × 630mm · 3 panels',                   tier: 'plus', forType: 'a' },
  { slug: 'roll-3-a',          label: 'Roll fold 3',                  note: '3 folds · rolled inward · 297 × 630mm · 4 panels',            tier: 'plus', forType: 'a' },
  { slug: 'accordion-3-a',     label: 'Accordion Fold 3 (Z fold 3)',  note: '3 folds · zigzag · 297 × 630mm · 4 panels',                   tier: 'plus', forType: 'a' },
  { slug: 'letter-half-a',     label: 'Letter Fold + Half Fold',      note: 'Letter fold then cross-fold in half · compound fold',         tier: 'plus', forType: 'a' },
  { slug: 'accordion-2-half-a',label: 'Accordion Fold 2 + Half Fold', note: 'Accordion-2 then cross-fold in half · compound fold',         tier: 'plus', forType: 'a' },
  // Type B (A4 × 4)
  { slug: 'gate-b',            label: 'Gate Fold',                    note: '2 folds · outer panels fold inward · 297 × 840mm · 3 panels', tier: 'plus', forType: 'b' },
  { slug: 'accordion-3-b',     label: 'Accordion Fold 3 (Z fold 3)',  note: '3 folds · zigzag · 297 × 840mm · 4 panels',                   tier: 'plus', forType: 'b' },
  { slug: 'double-gate-b',     label: 'Double Gate Fold',             note: '3 folds · gate then fold in half · 297 × 840mm · 4 panels',   tier: 'plus', forType: 'b' },
  { slug: 'accordion-4-b',     label: 'Accordion Fold 4 (Z fold 4)',  note: '4 folds · zigzag · 297 × 840mm · 5 panels',                   tier: 'plus', forType: 'b' },
  { slug: 'accordion-3-half-b',label: 'Accordion Fold 3 + Half Fold', note: 'Accordion-3 then cross-fold in half · compound fold',         tier: 'plus', forType: 'b' },
];

// ────────────────────────────────────────────────────────────────
// REBUILD AXES (only fold changes — preserve the rest)
// ────────────────────────────────────────────────────────────────

const [existing] = await (await fetch(
  `${BASE}/rest/v1/products?id=eq.${PRODUCT_ID}&select=pricing_table`,
  { headers: H },
)).json();
if (!existing?.pricing_table) throw new Error('no pricing_table on long-brochures');
const prev = existing.pricing_table;

const axes = {
  ...prev.axes,
  fold: FOLDS.map((f) => ({ slug: f.slug, label: f.label, note: f.note })),
};

// ────────────────────────────────────────────────────────────────
// PRICE GENERATION — only valid (type, fold) combos
// ────────────────────────────────────────────────────────────────

const prices = {};
let count = 0;

for (const fold of FOLDS) {
  const type = fold.forType;
  const printTable = type === 'a' ? lb.LB_PRINT_A : lb.LB_PRINT_B;
  for (const paper of PAPERS) {
    for (const qty of QTYS) {
      const printCost = printTable[String(qty)]?.[paper];
      if (printCost == null) continue;
      const fCost = foldCost(qty, fold.tier);

      // No lamination — lam_sides placeholder 'one'.
      {
        const cents = Math.ceil(printCost + 0 + fCost) * 100;
        const key = [type, paper, 'none', 'one', fold.slug, qty].join(':');
        prices[key] = cents;
        count++;
      }

      // Matt + Gloss (both price-identical upstream) × sides 1/2.
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
console.log(`Computed ${count} prices across 11 fold options.`);

const pricingTable = {
  ...prev,
  axes,
  prices,
};

// ────────────────────────────────────────────────────────────────
// APPLY
// ────────────────────────────────────────────────────────────────

const foldStepOptions = FOLDS.map((f) => ({
  slug: f.slug,
  label: f.label,
  note: f.note,
  // Per-option show_if — each fold is only pickable when the matching
  // Type is selected. Auto-reset logic in product-page.tsx picks the
  // first visible option when customer switches Type.
  show_if: { step: 'type', value: f.forType },
}));

const p1 = await fetch(`${BASE}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ pricing_table: pricingTable }),
});
if (!p1.ok) throw new Error(`PATCH pricing_table: ${p1.status} ${await p1.text()}`);
console.log('[1/2] pricing_table updated (11 fold slugs).');

const p2 = await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PRODUCT_ID}&step_id=eq.fold`,
  {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ options: foldStepOptions }),
  },
);
if (!p2.ok) throw new Error(`PATCH fold step: ${p2.status} ${await p2.text()}`);
console.log('[2/2] fold step options updated (11 entries, per-option show_if).');

console.log('\nSpot-check prices:');
const spots = [
  ['a', '128', 'none', 'one', 'letter-a', 300],
  ['a', '157', 'gloss', 'one', 'accordion-2-a', 1000],
  ['a', '260', 'matt', 'two', 'roll-3-a', 2000],
  ['a', '128', 'none', 'one', 'letter-half-a', 500],
  ['b', '128', 'none', 'one', 'gate-b', 300],
  ['b', '157', 'matt', 'two', 'double-gate-b', 1000],
  ['b', '260', 'gloss', 'two', 'accordion-4-b', 5000],
  ['b', '260', 'matt', 'two', 'accordion-3-half-b', 10000],
];
for (const k of spots) {
  const key = k.join(':');
  console.log(`  ${key} = $${(prices[key] / 100).toFixed(2)}`);
}
