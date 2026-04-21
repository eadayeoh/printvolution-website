// UV DTF Sticker pricing — simplest product in the catalogue.
//
//   Size: A4 → $25/sheet · A3 → $50/sheet
//   Customer can fit as many designs on one sheet as they want
//   (no 1-design-per-sheet restriction like regular stickers).
//
// Size carries the flat per-sheet price; qty multiplies. No axes
// beyond size, so pricing_table isn't needed — per-option
// price_formula handles everything.

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

const PRODUCT_ID = 'd29c3b77-f9ef-4974-af50-1ebe83e9c50c';

const steps = [
  {
    step_id: 'size', step_order: 0, label: 'Sheet Size', type: 'swatch', required: true,
    options: [
      {
        slug: 'a4',
        label: 'A4 (210 × 297mm)',
        note: '$25/sheet · fit as many designs as you want',
        price_formula: 'qty*25',
      },
      {
        slug: 'a3',
        label: 'A3 (297 × 420mm)',
        note: '$50/sheet · fit as many designs as you want',
        price_formula: 'qty*50',
      },
    ],
    show_if: null, step_config: {},
  },
  {
    step_id: 'qty', step_order: 1, label: 'Number of Sheets', type: 'qty', required: false,
    options: [], show_if: null,
    step_config: {
      min: 1, step: 1, presets: [1, 2, 5, 10, 20],
      note: 'One sheet fits any number of designs — send us your gang-up layout.',
      discount_note: null, labelMultiplier: null,
    },
  },
];

async function main() {
  const pRes = await fetch(`${URL}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      pricing_table: null, // per-option price_formula handles it
      pricing_compute: null,
      lead_time_days: 3,
      print_mode: 'UV DTF',
    }),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/3] products updated.');

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
  console.log(`[2/3] Cleared legacy pricing + inserted ${inserted.length} configurator steps.`);

  console.log('\n[3/3] Spot-check:');
  console.log('  A4 × 1 sheet  = $25');
  console.log('  A4 × 5 sheets = $125');
  console.log('  A3 × 1 sheet  = $50');
  console.log('  A3 × 10 sheets = $500');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
