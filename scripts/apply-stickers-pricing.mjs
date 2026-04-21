// Builds the Stickers product configurator + pricing from the supplier
// price list. Pricing is per-sheet with bulk discounts:
//
//   1 sheet   → \$15 each  (\$15 total)
//   10 sheets → \$14 each  (\$140)
//   20 sheets → \$13 each  (\$260)
//   30 sheets → \$12 each  (\$360)
//   40 sheets → \$11 each  (\$440)
//   50 sheets → \$10 each  (\$500)
//   L.O.P     → Custom quote (handled outside the configurator)
//
// One sheet = 320 × 450mm. One design per sheet. Customer enters their
// sticker dimensions (width × height mm) so they know how many stickers
// per sheet they get; the price itself is driven purely by the sheet
// count tier and is identical across all 9 materials.

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

const PRODUCT_ID = 'adb6bb6d-63d0-41c2-8908-64e64541ef04';

const TIERS = [
  { qty: 1,  perSheet: 15 },
  { qty: 10, perSheet: 14 },
  { qty: 20, perSheet: 13 },
  { qty: 30, perSheet: 12 },
  { qty: 40, perSheet: 11 },
  { qty: 50, perSheet: 10 },
];

// ────────────────────────────────────────────────────────────────
// AXES
// ────────────────────────────────────────────────────────────────

const axes = {
  // All 9 materials price identically. Material is a spec choice —
  // doesn't affect the sheet price.
  material: [
    { slug: 'waterproof_gloss',  label: 'Waterproof Gloss' },
    { slug: 'waterproof_matt',   label: 'Waterproof Matt' },
    { slug: 'transparent',       label: 'Transparent' },
    { slug: 'metallic_rainbow_sands', label: 'Metallic Rainbow Sands' },
    { slug: 'metallic_rainbow',  label: 'Metallic Rainbow' },
    { slug: 'metallic_sands',    label: 'Metallic Sands' },
    { slug: 'metallic_stripes',  label: 'Metallic Stripes' },
    { slug: 'blockout',          label: 'Blockout' },
    { slug: 'metallic_gold',     label: 'Metallic Gold' },
  ],
};

// ────────────────────────────────────────────────────────────────
// PRICES — material × qty. Same price across every material.
// ────────────────────────────────────────────────────────────────

const prices = {};
for (const mat of axes.material) {
  for (const tier of TIERS) {
    const total = tier.qty * tier.perSheet;
    prices[`${mat.slug}:${tier.qty}`] = total * 100;
  }
}
console.log(`Computed ${Object.keys(prices).length} prices.`);

const pricingTable = {
  axes,
  axis_order: ['material'],
  qty_tiers: TIERS.map((t) => t.qty),
  prices,
};

// ────────────────────────────────────────────────────────────────
// CONFIGURATOR STEPS
// ────────────────────────────────────────────────────────────────

const steps = [
  {
    step_id: 'material', step_order: 0, label: 'Material', type: 'swatch', required: true,
    options: axes.material, show_if: null, step_config: {},
  },
  {
    step_id: 'width', step_order: 1, label: 'Sticker Width (mm)', type: 'number', required: false,
    options: [], show_if: null,
    step_config: { min: 5, step: 1, presets: null, note: 'Max 320mm · one design per sheet', discount_note: null, labelMultiplier: null },
  },
  {
    step_id: 'height', step_order: 2, label: 'Sticker Height (mm)', type: 'number', required: false,
    options: [], show_if: null,
    step_config: { min: 5, step: 1, presets: null, note: 'Max 450mm · sheet is 320 × 450mm', discount_note: null, labelMultiplier: null },
  },
  {
    step_id: 'qty', step_order: 3, label: 'Number of Sheets', type: 'qty', required: false,
    options: [], show_if: null,
    step_config: {
      min: 1, step: 1,
      // No preset chips — customer types any number. `force_show: true`
      // overrides the default hide-qty-when-pricing_table behaviour, and
      // the ladder UI is suppressed for this product so the only qty
      // input is this typed field. Tier discount auto-applies via the
      // engine's snap-to-tier logic against the pricing_table.qty_tiers.
      presets: null,
      force_show: true,
      note: 'Type any number of sheets (1–50). Discount auto-applies: $15 → $10 per sheet as volume increases. 50+ sheets? Contact us for a custom quote.',
      discount_note: null,
      labelMultiplier: null,
    },
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
      lead_time_days: 3,
      print_mode: 'Digital',
    }),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/3] products.pricing_table updated.');

  const delPricing = await fetch(`${URL}/rest/v1/product_pricing?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delPricing.ok) throw new Error(`DELETE product_pricing: ${delPricing.status} ${await delPricing.text()}`);

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
  console.log(`[2/3] Cleared legacy pricing matrix + inserted ${inserted.length} configurator steps.`);

  console.log('\n[3/3] Tier prices:');
  for (const t of TIERS) {
    console.log(`  ${String(t.qty).padStart(2)} sheet(s) × $${t.perSheet}/sheet = $${t.qty * t.perSheet}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
