// Builds the Rubber Stamp product configurator + pricing_table.prices
// from the PrintVolution rubber-stamp catalogue sheet. Each stamp is
// a fixed SKU (DF 1370, DF 1767, etc.) with:
//   • fixed dimensions (height × width in mm, or diameter for rounds)
//   • fixed flat price per stamp
//   • standard lead time 1 working day
//   • items marked with a red dot on the sheet → +1 working day
//
// Customer picks: (1) which stamp SKU, (2) ink colour (Black / Navy /
// Red — catalogue standard), (3) how many stamps to order.
//
// Price per unit stays flat at the SKU's catalogue price. Ink colour
// doesn't affect price.

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

const PRODUCT_ID = '0b27c40f-79de-410d-afe5-06c74c92200d';

// ────────────────────────────────────────────────────────────────
// STAMP CATALOGUE — from the price sheet
//
// Format: [slug, df_code, label (H × W mm or diameter), price $, +1 day?]
// ────────────────────────────────────────────────────────────────

// Stamps grouped by shape so the customer narrows the list via a
// first-step "Shape" picker, then only sees relevant sizes. Without
// the group filter it's a wall of 20 SKUs.
//
// shape: 'small'  — compact rectangles, ≤28mm height (8 SKUs)
//        'medium' — 39-49mm height (6 SKUs)
//        'round'  — circular (2 SKUs)
//        'large'  — 62mm+ height, all +1 day (4 SKUs)
const STAMPS = [
  // Small rectangles
  { slug: 'df1370', code: 'DF 1370', label: '9 × 66mm',   price: 24, plus1: false, shape: 'small' },
  { slug: 'df1767', code: 'DF 1767', label: '13 × 63mm',  price: 26, plus1: false, shape: 'small' },
  { slug: 'df2267', code: 'DF 2267', label: '18 × 63mm',  price: 28, plus1: false, shape: 'small' },
  { slug: 'df2278', code: 'DF 2278', label: '18 × 74mm',  price: 30, plus1: false, shape: 'small' },
  { slug: 'df2855', code: 'DF 2855', label: '24 × 51mm',  price: 28, plus1: false, shape: 'small' },
  { slug: 'df2867', code: 'DF 2867', label: '24 × 63mm',  price: 30, plus1: false, shape: 'small' },
  { slug: 'df2878', code: 'DF 2878', label: '24 × 74mm',  price: 32, plus1: false, shape: 'small' },
  { slug: 'df3255', code: 'DF 3255', label: '28 × 51mm',  price: 30, plus1: false, shape: 'small' },
  // Medium rectangles — 39–49mm height
  { slug: 'df43103', code: 'DF 43103', label: '39 × 98mm',  price: 40, plus1: true,  shape: 'medium' },
  { slug: 'df5355',  code: 'DF 5355',  label: '49 × 51mm',  price: 36, plus1: false, shape: 'medium' },
  { slug: 'df5367',  code: 'DF 5367',  label: '49 × 63mm',  price: 38, plus1: false, shape: 'medium' },
  { slug: 'df5378',  code: 'DF 5378',  label: '49 × 74mm',  price: 40, plus1: false, shape: 'medium' },
  { slug: 'df5391',  code: 'DF 5391',  label: '49 × 87mm',  price: 44, plus1: false, shape: 'medium' },
  { slug: 'df53103', code: 'DF 53103', label: '49 × 98mm',  price: 48, plus1: true,  shape: 'medium' },
  // Round stamps
  { slug: 'df26', code: 'DF 26', label: 'Ø22mm',  price: 24, plus1: false, shape: 'round' },
  { slug: 'df35', code: 'DF 35', label: 'Ø35mm',  price: 28, plus1: false, shape: 'round' },
  // Large rectangles — all +1 day
  { slug: 'df6785',  code: 'DF 6785',  label: '62 × 80mm',   price: 45, plus1: true, shape: 'large' },
  { slug: 'df67103', code: 'DF 67103', label: '62 × 98mm',   price: 56, plus1: true, shape: 'large' },
  { slug: 'df78103', code: 'DF 78103', label: '73 × 98mm',   price: 60, plus1: true, shape: 'large' },
  { slug: 'df90130', code: 'DF 90130', label: '85 × 125mm',  price: 80, plus1: true, shape: 'large' },
];

// ────────────────────────────────────────────────────────────────
// AXES
// ────────────────────────────────────────────────────────────────

const axes = {
  // First-step filter — narrows the stamp list by shape/size category
  // so the customer doesn't face 20 SKUs at once.
  shape: [
    { slug: 'small',  label: 'Small rectangle',  note: 'Up to 28mm height · $24–$32' },
    { slug: 'medium', label: 'Medium rectangle', note: '39–49mm height · $36–$48' },
    { slug: 'round',  label: 'Round',            note: 'Ø22mm or Ø35mm · $24–$28' },
    { slug: 'large',  label: 'Large rectangle',  note: '62mm+ height · $45–$80 · +1 day production' },
  ],
  // Stamp model. Each carries its own flat price (as a `qty * X` formula
  // so qty multiplies) and a per-option lead_time_days override
  // (1 day standard, 2 for the +1-day items). Options filter by the
  // selected shape via option-level show_if.
  stamp: STAMPS.map((s) => ({
    slug: s.slug,
    label: `${s.code} — ${s.label}`,
    note: s.plus1 ? `$${s.price} · +1 working day` : `$${s.price} · next working day`,
    price_formula: `qty*${s.price}`,
    lead_time_days: s.plus1 ? 2 : 1,
    show_if: { step: 'shape', value: s.shape },
  })),
  ink: [
    { slug: 'black', label: 'Black', note: 'Standard · default office ink', swatch: '#111111' },
    { slug: 'navy',  label: 'Navy',  note: 'Deep blue · professional',       swatch: '#0b1a4a' },
    { slug: 'red',   label: 'Red',   note: 'For URGENT / APPROVED stamps',   swatch: '#d1291b' },
  ],
};

// ────────────────────────────────────────────────────────────────
// CONFIGURATOR STEPS
// ────────────────────────────────────────────────────────────────

const steps = [
  {
    step_id: 'shape', step_order: 0, label: 'Shape', type: 'swatch', required: true,
    options: axes.shape, show_if: null, step_config: {},
  },
  {
    step_id: 'stamp', step_order: 1, label: 'Stamp Model', type: 'swatch', required: true,
    options: axes.stamp, show_if: null, step_config: {},
  },
  {
    step_id: 'ink', step_order: 2, label: 'Ink Colour', type: 'swatch', required: true,
    options: axes.ink, show_if: null, step_config: {},
  },
  {
    step_id: 'qty', step_order: 3, label: 'Quantity (stamps)', type: 'qty', required: false,
    options: [], show_if: null,
    step_config: { min: 1, step: 1, presets: [1, 2, 5, 10], note: 'Each stamp is pre-inked with your chosen colour.', discount_note: null, labelMultiplier: null },
  },
];

// ────────────────────────────────────────────────────────────────
// APPLY
// ────────────────────────────────────────────────────────────────

async function main() {
  // Product row — clear pricing_table (we're using per-option
  // price_formula instead of the lookup-table pattern, since every
  // stamp is a flat price).
  const pRes = await fetch(`${URL}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      pricing_table: null,
      pricing_compute: null,
      lead_time_days: 1,
      print_mode: null,
    }),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/3] products updated (lead 1 day default).');

  const delPricing = await fetch(`${URL}/rest/v1/product_pricing?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delPricing.ok) throw new Error(`DELETE product_pricing: ${delPricing.status} ${await delPricing.text()}`);
  console.log('[2/3] Cleared legacy product_pricing matrix.');

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
  console.log(`[3/3] Inserted ${inserted.length} configurator steps with ${STAMPS.length} stamp SKUs.`);

  console.log('\nStamp catalogue summary:');
  for (const s of STAMPS) {
    console.log(`  ${s.code.padEnd(10)} ${s.label.padEnd(18)} $${String(s.price).padEnd(3)} ${s.plus1 ? '(+1 day)' : ''}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
