// Convert UV DTF from price_formula to a pricing_table so the admin
// can add / edit qty tiers directly. Seeds with one tier (qty 1 =
// S$50). Uses per_unit_at_tier_rate so typed qty scales linearly —
// customer types 5 sheets, pays 5 × tier-1 rate until the admin adds
// more tiers with different per-sheet rates.

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

const PID = 'd29c3b77-f9ef-4974-af50-1ebe83e9c50c';

// Read current size-step options so we preserve whatever the admin has
// live (they kept A3 only, but this stays flexible if they re-add A4).
const cfg = await (await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&select=step_id,step_order,label,options,step_config&order=step_order`,
  { headers: H },
)).json();
const sizeStep = cfg.find((s) => s.step_id === 'size');
if (!sizeStep) throw new Error('no size step on uv-dtf');

// Seed pricing_table using whatever size options are live. Default to
// S$50 per sheet if the option's slug is 'a3', S$25 if 'a4' (reasonable
// starting points the admin can overwrite).
const SEED_PER_SHEET = { a3: 5000, a4: 2500 };

const axes = {
  size: sizeStep.options.map((o) => ({
    slug: o.slug,
    label: o.label,
    note: o.note ?? null,
  })),
};

const qty_tiers = [1];
const prices = {};
for (const o of axes.size) {
  const cents = SEED_PER_SHEET[o.slug] ?? 5000;
  prices[`${o.slug}:1`] = cents;
}

const pricing_table = {
  axes,
  axis_order: ['size'],
  qty_tiers,
  prices,
  qty_mode: 'per_unit_at_tier_rate',
};

// Update the product. Also strip the legacy price_formula on the size
// options so the pricing_table wins without ambiguity.
const p1 = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH', headers: H,
  body: JSON.stringify({ pricing_table }),
});
if (!p1.ok) throw new Error(`PATCH products: ${p1.status} ${await p1.text()}`);
console.log('[1/2] pricing_table seeded (qty 1, per_unit_at_tier_rate).');

const cleanedOptions = sizeStep.options.map((o) => {
  const next = { ...o };
  delete next.price_formula;
  return next;
});
const p2 = await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.size`,
  {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ options: cleanedOptions }),
  },
);
if (!p2.ok) throw new Error(`PATCH size step: ${p2.status} ${await p2.text()}`);
console.log('[2/2] size options: price_formula stripped (pricing_table wins).');

console.log(`\nSeeded tiers: qty_tiers = ${JSON.stringify(qty_tiers)}, prices = ${JSON.stringify(prices)}`);
console.log('Admin can now add / edit tiers via the new "Qty tier prices" section in the Pricing tab.');
