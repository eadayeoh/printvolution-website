// Rebuilds the Photo Frames configurator to match the current pricing:
// A6 / A5 / A4 / A3 sizes (A6-A4 include a table stand, A3 is frame-only),
// basic vs gold frame, inkjet print only — frame-only and digital-print
// options dropped per product decision; inkjet cost is baked into the size
// base price so the "Print Option" step is gone entirely.
//
// Pattern: single set of clean steps using option-level show_if so one step
// ("Frame Style") renders different options depending on size, instead of
// duplicating whole steps per size bucket.
//
// Also deletes the stale product_pricing ladder row (wrong prices).

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
if (!URL || !KEY) throw new Error('Missing Supabase env');
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

const PRODUCT_ID = 'd5097eb0-4615-4976-8cc7-f957e2f2229c'; // photo-frames

// --- Step definitions ----------------------------------------------------

const steps = [
  {
    step_id: 'size',
    step_order: 0,
    label: 'Photo Size',
    type: 'swatch',
    required: true,
    // Prices below include inkjet print — A-sizes: frame + digital + inkjet
    // upgrade = $6/$8/$10/$14 base + $2 digital + $4 inkjet = $12/$14/$16/$20.
    options: [
      { slug: 'a6', label: 'A6', note: '10.5 × 14.8 cm · includes table stand', price_formula: 'qty*12' },
      { slug: 'a5', label: 'A5', note: '14.8 × 21 cm · includes table stand', price_formula: 'qty*14' },
      { slug: 'a4', label: 'A4', note: '21 × 29.7 cm · includes table stand', price_formula: 'qty*16' },
      { slug: 'a3', label: 'A3', note: '29.7 × 42 cm', price_formula: 'qty*20' },
    ],
    show_if: null,
    step_config: { min: null, note: null, step: null, presets: null, discount_note: null, labelMultiplier: null },
  },
  {
    step_id: 'frame_colour',
    step_order: 1,
    label: 'Frame Colour',
    type: 'swatch',
    required: true,
    // Black / White / Wood available on every size; Gold only offered on
    // A5 / A4 / A3 with a size-dependent upcharge.
    show_if: null,
    options: [
      { slug: 'black', label: 'Black', price_formula: '0' },
      { slug: 'white', label: 'White', price_formula: '0' },
      { slug: 'wood', label: 'Wood', price_formula: '0' },
      {
        slug: 'gold_a5',
        label: 'Gold (+$3)',
        price_formula: 'qty*3',
        show_if: { step: 'size', value: 'a5' },
      },
      {
        slug: 'gold_a4',
        label: 'Gold (+$5)',
        price_formula: 'qty*5',
        show_if: { step: 'size', value: 'a4' },
      },
      {
        slug: 'gold_a3',
        label: 'Gold (+$8)',
        price_formula: 'qty*8',
        show_if: { step: 'size', value: 'a3' },
      },
    ],
    step_config: { min: null, note: null, step: null, presets: null, discount_note: null, labelMultiplier: null },
  },
  {
    step_id: 'personalisation',
    step_order: 2,
    label: 'Personalisation Text',
    type: 'text',
    required: false,
    options: [],
    show_if: null,
    step_config: { min: null, note: null, step: null, presets: null, discount_note: null, labelMultiplier: null },
  },
  {
    step_id: 'qty',
    step_order: 3,
    label: 'Quantity',
    type: 'qty',
    required: false,
    options: [],
    show_if: null,
    step_config: {
      min: 1,
      note: null,
      step: 1,
      presets: [1, 5, 10, 20],
      discount_note: null,
      labelMultiplier: null,
    },
  },
];

// --- Apply ---------------------------------------------------------------

async function main() {
  // Wipe existing configurator rows
  const delCfg = await fetch(
    `${URL}/rest/v1/product_configurator?product_id=eq.${PRODUCT_ID}`,
    { method: 'DELETE', headers: H },
  );
  if (!delCfg.ok) throw new Error(`DELETE configurator: ${delCfg.status} ${await delCfg.text()}`);
  console.log('[1/3] Cleared existing configurator rows.');

  // Insert fresh steps
  const payload = steps.map((s) => ({ ...s, product_id: PRODUCT_ID }));
  const insCfg = await fetch(`${URL}/rest/v1/product_configurator`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify(payload),
  });
  if (!insCfg.ok) throw new Error(`INSERT configurator: ${insCfg.status} ${await insCfg.text()}`);
  const inserted = await insCfg.json();
  console.log(`[2/3] Inserted ${inserted.length} steps: ${inserted.map((r) => r.step_id).join(', ')}`);

  // Drop the stale product_pricing ladder row (only had A3/A4/A5/A6 at
  // mismatched prices, no 20in/28in — would confuse customers).
  const delPricing = await fetch(
    `${URL}/rest/v1/product_pricing?product_id=eq.${PRODUCT_ID}`,
    { method: 'DELETE', headers: H },
  );
  if (!delPricing.ok) throw new Error(`DELETE pricing: ${delPricing.status} ${await delPricing.text()}`);
  console.log('[3/3] Dropped stale product_pricing ladder row.');

  // Verify
  const verify = await (
    await fetch(
      `${URL}/rest/v1/product_configurator?product_id=eq.${PRODUCT_ID}&select=step_id,label,step_order&order=step_order`,
      { headers: H },
    )
  ).json();
  console.log('\nFinal steps:');
  for (const r of verify) console.log(`  ${r.step_order}. ${r.step_id} — ${r.label}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
