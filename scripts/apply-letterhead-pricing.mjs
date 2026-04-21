// Builds the Letterhead product configurator + pricing_table.prices
// from the customer-supplied price list:
//
//   80gsm Woodsfree Paper  — A4 — 4C + 0C (single-sided)
//   100gsm Woodsfree Paper — A4 — 4C + 0C (single-sided)
//
// Both gsms price identically at every qty tier (the user-supplied
// sheet has matching columns). Prices are preserved to the exact
// decimal — no whole-dollar ceiling applied here since this table
// isn't sourced from pvpricelist (the ceiling rule only applies to
// pvpricelist's own display convention).

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

const PRODUCT_ID = '82cc01ba-a489-40cd-bf68-29b209a9d81a'; // letterhead

// Price table from the user — qty → dollars (identical for both gsms).
//
// 6,000 tier overridden from the source list's \$287.80 (which produced
// a strange \$0.05/sheet unit price, higher than both 5,000 and 7,000
// neighbours) to \$240 flat — user correction so the 6k tier lines up
// at \$0.04/sheet like the rest of the mid-volume tiers.
const PRICE_BY_QTY = {
  300: 59.50,
  500: 65.10,
  1000: 85.90,
  2000: 121.70,
  3000: 147.20,
  4000: 173.60,
  5000: 211.40,
  6000: 240.00,   // was 287.80 — adjusted per user: 6k unit = $0.04
  7000: 302.90,
  8000: 318.00,
  9000: 354.80,
  10000: 391.60,
};

const QTYS = Object.keys(PRICE_BY_QTY).map(Number).sort((a, b) => a - b);

// ────────────────────────────────────────────────────────────────
// AXES
// ────────────────────────────────────────────────────────────────

const axes = {
  paper: [
    { slug: '80', label: '80gsm Woodsfree Paper', note: 'Standard office-weight letterhead stock' },
    { slug: '100', label: '100gsm Woodsfree Paper', note: 'Slightly heavier · noticeable in hand' },
  ],
};

// ────────────────────────────────────────────────────────────────
// PRICES
// ────────────────────────────────────────────────────────────────

const prices = {};
for (const paper of ['80', '100']) {
  for (const qty of QTYS) {
    const dollars = PRICE_BY_QTY[qty];
    const cents = Math.round(dollars * 100);
    // Key format: `${paper}:${qty}`
    prices[`${paper}:${qty}`] = cents;
  }
}
console.log(`Computed ${Object.keys(prices).length} prices.`);

// ────────────────────────────────────────────────────────────────
// pricing_table
// ────────────────────────────────────────────────────────────────

const pricingTable = {
  axes,
  axis_order: ['paper'],
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
    step_id: 'qty', step_order: 1, label: 'Quantity (sheets)', type: 'qty', required: false,
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
      lead_time_days: 5,
      print_mode: 'Offset',
    }),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/4] products.pricing_table updated.');

  // Drop the stale legacy product_pricing matrix (had a bogus
  // \$180,000-for-1000pcs row that would drive a junk ladder display).
  const delPricing = await fetch(`${URL}/rest/v1/product_pricing?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delPricing.ok) throw new Error(`DELETE product_pricing: ${delPricing.status} ${await delPricing.text()}`);
  console.log('[2/4] Cleared legacy product_pricing matrix.');

  // Wipe old configurator (formula-based qty*0.07 with three paper
  // weights that no longer match the real price list).
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

  // Spot-check
  console.log('\n[4/4] Spot-check:');
  for (const paper of ['80', '100']) {
    for (const qty of [300, 1000, 5000, 10000]) {
      const cents = prices[`${paper}:${qty}`];
      console.log(`  ${paper}gsm × ${qty}: $${(cents / 100).toFixed(2)}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
