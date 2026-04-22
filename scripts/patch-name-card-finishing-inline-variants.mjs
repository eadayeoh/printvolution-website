// Name Card + Luxury Business Card — swap the Yes/No + sub-step
// pattern for single inline dropdowns per finishing:
//
//   Lamination       → No | Matt | Gloss
//   Rounded Corners  → No | 3mm | 4mm | 5mm | 6mm | 7mm | 8mm | 9mm | 10mm
//   Hotstamp         → No | Gold | Rose Gold | Silver
//   Spot UV          → No | Yes
//   Die Cut          → No | Yes
//
// All variants within a finishing share the same NC_FIN surcharge
// curve — matt and gloss are same price, all corner radii are the
// same price, all three hotstamp colours are the same price.
//
// This rebuilds the pricing_table with the new axis slugs so the
// engine can key on them directly. Drops the previous lam_type /
// rnd_radius / hot_color sub-steps.
//
// New combinatorial size per product:
//   Name Card: 7 mat × 3 lam × 9 rnd × 4 hot × 2 suv × 2 die × 10 qty
//              = 30,240 price entries
//   Luxury:    3 × 3 × 9 × 4 × 2 × 2 × 10 = 12,960 price entries
//
// h1 + h1em preserved. Page content (intro, seo_body, faqs, matcher)
// not touched — the existing copy already talks about matt / gloss /
// gold / rose-gold without contradicting the new axis shape.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
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

const PRICELIST = JSON.parse(fs.readFileSync('scripts/pvpricelist-snapshot.json', 'utf8'));
const NC = PRICELIST.rates.namecards;

// -----------------------------------------------------------------------------
// Axis definitions (shared across both products)
// -----------------------------------------------------------------------------
const LAM = [
  { slug: 'no',    label: 'No' },
  { slug: 'matt',  label: 'Matt',  note: 'Default · fingerprint-resistant' },
  { slug: 'gloss', label: 'Gloss', note: 'High shine · colour pops' },
];
const RND = [
  { slug: 'no',  label: 'No' },
  { slug: 'r3',  label: '3mm' },
  { slug: 'r4',  label: '4mm' },
  { slug: 'r5',  label: '5mm' },
  { slug: 'r6',  label: '6mm' },
  { slug: 'r7',  label: '7mm' },
  { slug: 'r8',  label: '8mm' },
  { slug: 'r9',  label: '9mm' },
  { slug: 'r10', label: '10mm' },
];
const HOT = [
  { slug: 'no',        label: 'No' },
  { slug: 'gold',      label: 'Gold',      swatch: '#C9A24B', note: 'Traditional · warm metallic' },
  { slug: 'rose_gold', label: 'Rose Gold', swatch: '#B7695A', note: 'Contemporary · pink-warm' },
  { slug: 'silver',    label: 'Silver',    swatch: '#BCBCBC', note: 'Cool · high-contrast' },
];
const YESNO = [
  { slug: 'no',  label: 'No' },
  { slug: 'yes', label: 'Yes' },
];
const QTY_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// "active" = any slug other than 'no'; all active slugs within an axis
// share the same surcharge curve.
const axisActive = (slug) => slug !== 'no';

// -----------------------------------------------------------------------------
// Material lists — product-specific
// -----------------------------------------------------------------------------
const NAME_CARD_MATERIALS = [
  { slug: 'basic',           rate_key: 'dig_basic',   label: 'Basic — 250GSM Art Card',   note: 'Standard weight · most popular' },
  { slug: 'basicp',          rate_key: 'dig_basicp',  label: 'Basic+ — 300GSM Art Card',  note: 'Heavier · reads more premium' },
  { slug: 'tangerine_white', rate_key: 'dig_rj250',   label: '200GSM Tangerine White',    note: 'Uncoated · cotton-feel' },
  { slug: 'maple_bright',    rate_key: 'dig_rj300',   label: '300GSM Maple Bright',       note: 'Textured · subtle wood grain' },
  { slug: 'maple_white',     rate_key: 'dig_rj300',   label: '300GSM Maple White',        note: 'Textured · white-core variant' },
  { slug: 'grandeur',        rate_key: 'dig_rj350',   label: '350GSM Grandeur',           note: 'Heavyweight · cotton-feel executive' },
  { slug: 'shiruku',         rate_key: 'dig_rj350',   label: '350GSM Shiruku',            note: 'Heavyweight · silk-finish executive' },
];

const LUXURY_MATERIALS = [
  { slug: 'duplex',   rate_key: 'dig_duplex',   label: 'Duplex Card',   note: 'The entry thick card · distinctive coloured edge' },
  { slug: 'triplex',  rate_key: 'dig_triplex',  label: 'Triplex Card',  note: 'Executive standard · bold coloured edge band' },
  { slug: 'quadplex', rate_key: 'dig_quad',     label: 'Quadplex Card', note: 'Our heaviest · keepsake weight' },
];

// -----------------------------------------------------------------------------
// Pricing helpers
// -----------------------------------------------------------------------------
function perBoxRate(rate_key, qty) {
  const row = NC.NC_DIG[rate_key].find((r) => r[0] === qty);
  if (!row) throw new Error(`No NC_DIG entry for ${rate_key}:${qty}`);
  return row[1];
}
function finSurcharge(fin_key, qty) {
  const row = NC.NC_FIN[fin_key].find((r) => r[0] === qty);
  if (!row) throw new Error(`No NC_FIN entry for ${fin_key}:${qty}`);
  return row[1];
}

function buildPricingTable(materials) {
  const prices = {};
  let count = 0;
  for (const m of materials) {
    for (const lam of LAM) {
      for (const rnd of RND) {
        for (const hot of HOT) {
          for (const suv of YESNO) {
            for (const die of YESNO) {
              for (const boxes of QTY_TIERS) {
                const base = boxes * perBoxRate(m.rate_key, boxes);
                let surcharge = 0;
                if (axisActive(lam.slug)) surcharge += finSurcharge('lam', boxes);
                if (axisActive(rnd.slug)) surcharge += finSurcharge('rnd', boxes);
                if (axisActive(hot.slug)) surcharge += finSurcharge('hot', boxes);
                if (axisActive(suv.slug)) surcharge += finSurcharge('suv', boxes);
                if (axisActive(die.slug)) surcharge += finSurcharge('die', boxes);
                const key = `${m.slug}:${lam.slug}:${rnd.slug}:${hot.slug}:${suv.slug}:${die.slug}:${boxes}`;
                prices[key] = Math.round((base + surcharge) * 100);
                count++;
              }
            }
          }
        }
      }
    }
  }
  return {
    axes: {
      material: materials.map((m) => ({ slug: m.slug, label: m.label, note: m.note })),
      lam: LAM,
      rnd: RND,
      hot: HOT,
      suv: YESNO,
      die: YESNO,
    },
    axis_order: ['material', 'lam', 'rnd', 'hot', 'suv', 'die'],
    qty_tiers: QTY_TIERS,
    prices,
    _count: count,
  };
}

// -----------------------------------------------------------------------------
// Configurator step builder (per product)
// -----------------------------------------------------------------------------
function buildSteps(pid, materials, includeNamesStep) {
  const steps = [
    {
      product_id: pid, step_id: 'material', step_order: 0,
      label: 'Material', type: 'swatch', required: true,
      options: materials.map((m) => ({ slug: m.slug, label: m.label, note: m.note })),
      show_if: null, step_config: null,
    },
    {
      product_id: pid, step_id: 'lam', step_order: 1,
      label: 'Lamination', type: 'swatch', required: true,
      options: LAM, show_if: null, step_config: null,
    },
    {
      product_id: pid, step_id: 'rnd', step_order: 2,
      label: 'Rounded Corners', type: 'select', required: true,
      options: RND, show_if: null, step_config: null,
    },
    {
      product_id: pid, step_id: 'hot', step_order: 3,
      label: 'Hotstamp', type: 'swatch', required: true,
      options: HOT, show_if: null, step_config: null,
    },
    {
      product_id: pid, step_id: 'suv', step_order: 4,
      label: 'Spot UV', type: 'swatch', required: true,
      options: YESNO, show_if: null, step_config: null,
    },
    {
      product_id: pid, step_id: 'die', step_order: 5,
      label: 'Die Cut', type: 'swatch', required: true,
      options: YESNO, show_if: null, step_config: null,
    },
  ];
  let nextOrder = 6;
  if (includeNamesStep) {
    steps.push({
      product_id: pid, step_id: 'names', step_order: nextOrder++,
      label: 'Name(s) on the Cards', type: 'text', required: false,
      options: [], show_if: null,
      step_config: {
        note: 'Mix names across the order — one name per line. Ten boxes with ten different names? Still the ten-box volume rate. Leave blank if every box is the same name.',
      },
    });
  }
  steps.push({
    product_id: pid, step_id: 'qty', step_order: nextOrder++,
    label: 'Boxes (100 cards each)', type: 'qty', required: true,
    options: [], show_if: null,
    step_config: {
      min: 1, step: 1, presets: [1, 2, 5, 10], labelMultiplier: 100,
      note: includeNamesStep
        ? 'Total boxes across all names. Volume rate applies to the total box count — more boxes, cheaper per box, regardless of how many names.'
        : '100 cards per box. This product is quoted per name — one design per order, no name-mixing.',
    },
  });
  return steps;
}

// -----------------------------------------------------------------------------
// Patch one product
// -----------------------------------------------------------------------------
async function patchProduct(label, pid, materials, includeNamesStep) {
  console.log(`\n=== ${label} ===`);

  const pt = buildPricingTable(materials);
  console.log(`  built ${pt._count} price entries`);
  delete pt._count;

  const prodRes = await fetch(`${BASE}/rest/v1/products?id=eq.${pid}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ pricing_table: pt }),
  });
  if (!prodRes.ok) throw new Error(`PATCH products: ${prodRes.status} ${await prodRes.text()}`);
  console.log('  ✓ pricing_table rebuilt');

  // Wipe the whole configurator and re-insert. Anything the admin UI
  // added beyond the core steps we rebuild is not relevant here.
  const delCfg = await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${pid}`, {
    method: 'DELETE', headers: H,
  });
  if (!delCfg.ok) throw new Error(`DELETE configurator: ${delCfg.status} ${await delCfg.text()}`);

  const steps = buildSteps(pid, materials, includeNamesStep);
  const insCfg = await fetch(`${BASE}/rest/v1/product_configurator`, {
    method: 'POST', headers: H,
    body: JSON.stringify(steps),
  });
  if (!insCfg.ok) throw new Error(`INSERT configurator: ${insCfg.status} ${await insCfg.text()}`);
  console.log(`  ✓ configurator rebuilt with ${steps.length} steps`);

  // Spot-check — a blank combo (all 'no') should match pricelist exactly
  const m0 = materials[0].slug;
  for (const q of [1, 5, 10]) {
    const key = `${m0}:no:no:no:no:no:${q}`;
    const cents = pt.prices[key];
    const expected = q * perBoxRate(materials[0].rate_key, q) * 100;
    const ok = cents === expected ? '✓' : '✗';
    console.log(`    ${ok} ${key} → $${cents / 100} (expect $${expected / 100})`);
  }
  // Variant spot-check — matt + r5 + gold should equal yes+yes+yes
  const keyYesYesYes = `${m0}:matt:r5:gold:no:no:5`;
  const expect5 = 5 * perBoxRate(materials[0].rate_key, 5)
    + finSurcharge('lam', 5) + finSurcharge('rnd', 5) + finSurcharge('hot', 5);
  const gotYesYesYes = pt.prices[keyYesYesYes];
  const ok2 = gotYesYesYes === expect5 * 100 ? '✓' : '✗';
  console.log(`    ${ok2} ${keyYesYesYes} → $${gotYesYesYes / 100} (expect $${expect5})`);
}

await patchProduct('name-card', 'e6e1d3ae-b7a9-46c9-b97b-adde24b565fc', NAME_CARD_MATERIALS, false);
await patchProduct('luxury-business-card', '93828e8e-de23-4ea2-a3b8-407953271548', LUXURY_MATERIALS, true);

console.log('\nDone. Lamination / Rounded Corners / Hotstamp are now single dropdowns with inline variants.');
