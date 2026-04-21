// Builds the NCR Form product configurator + pricing_table.prices
// from the supplier's NCR Bill Book price list (2 tables: 1-colour and
// 2-colour, single-side printing, numbering included).
//
// Axes:
//   size    → 4×8 (107×196mm) / 8×9 (196×222mm) / A5 (146×222mm) / A4 (222×298mm)
//   ply     → 2ply / 3ply / 4ply / 5ply
//   colour  → 1-colour / 2-colour (both single-side print)
//   qty     → 10 / 20 / 30 / 40 / 50 / 100 / 200 / 400 / 500 books
// Numbering is included on every book — not a customer axis.
//
// 4 sizes × 4 ply × 2 colour × 9 qty = 288 prices. Stored as exact
// decimals from the source list (half-dollar increments are preserved).

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

const PRODUCT_ID = 'cf2b00c8-6cfc-4749-9988-68d36c0f4332'; // ncr-form

const QTYS = [10, 20, 30, 40, 50, 100, 200, 400, 500];

// ────────────────────────────────────────────────────────────────
// SOURCE DATA — prices transcribed from the two supplier tables.
// Outer key = `${colour}:${size}`; inner = qty → [2ply, 3ply, 4ply, 5ply]
// ────────────────────────────────────────────────────────────────

const SOURCE = {
  // 1 standard colour, single-side print
  'c1:s4x8': {
     10: [ 80.40,  97.80, 112.90, 136.00],
     20: [115.00, 135.70, 163.90, 192.50],
     30: [147.70, 189.90, 234.40, 249.10],
     40: [181.20, 232.20, 289.70, 323.90],
     50: [216.00, 273.50, 345.00, 383.90],
    100: [345.00, 494.70, 620.70, 696.20],
    200: [644.50, 897.20, 1150.00, 1314.40],
    400: [1210.80, 1625.30, 1828.20, 2472.00],
    500: [1495.00, 1989.70, 2645.00, 2943.50],
  },
  'c1:s8x9': {
     10: [ 95.60, 128.10, 147.70, 167.60],
     20: [136.70, 199.60, 260.50, 271.80],
     30: [158.50, 284.30, 372.10, 388.30],
     40: [245.30, 351.60, 462.20, 482.30],
     50: [295.20, 419.90, 552.20, 576.20],
    100: [537.10, 764.90, 1000.40, 1067.60],
    200: [1035.00, 1449.50, 1874.70, 2063.90],
    400: [1832.40, 2629.80, 3622.50, 4088.00],
    500: [2230.70, 3220.00, 4497.00, 5052.50],
  },
  'c1:a5': {
     10: [ 86.80, 109.60, 127.00, 162.00],
     20: [120.50, 154.10, 195.40, 245.80],
     30: [155.30, 213.80, 253.90, 323.90],
     40: [188.80, 262.70, 311.40, 420.00],
     50: [221.40, 310.40, 368.90, 510.60],
    100: [383.10, 540.40, 698.70, 947.60],
    200: [728.10, 1028.60, 1224.90, 1812.50],
    400: [1297.70, 1888.90, 2401.00, 3560.00],
    500: [1581.80, 2317.40, 2990.00, 4416.20],
  },
  'c1:a4': {
     10: [ 97.80, 146.50, 195.40, 240.00],
     20: [163.90, 236.60, 322.20, 407.60],
     30: [227.90, 345.00, 441.60, 587.60],
     40: [294.10, 431.80, 564.20, 780.00],
     50: [360.30, 517.50, 687.90, 947.60],
    100: [644.50, 954.70, 1230.40, 1800.00],
    200: [1069.70, 1725.00, 2185.00, 3587.60],
    400: [2004.90, 3021.50, 4079.30, 7172.00],
    500: [2472.50, 3668.20, 5025.40, 8963.90],
  },
  // 2 standard colour, single-side print
  'c2:s4x8': {
     10: [132.40, 149.70, 172.50, 198.10],
     20: [160.70, 230.00, 275.70, 287.60],
     30: [207.20, 275.70, 322.20, 336.20],
     40: [242.00, 342.90, 408.00, 425.80],
     50: [275.70, 408.00, 494.70, 516.20],
    100: [517.50, 712.90, 874.50, 912.50],
    200: [889.60, 1150.00, 1495.00, 1560.00],
    400: [1508.10, 2070.00, 2530.00, 2640.00],
    500: [1817.20, 2530.00, 3047.50, 3250.00],
  },
  'c2:s8x9': {
     10: [137.90, 207.20, 252.90, 263.90],
     20: [216.00, 299.50, 357.00, 372.50],
     30: [293.00, 414.50, 494.70, 516.20],
     40: [357.00, 525.20, 648.80, 677.00],
     50: [419.90, 635.80, 802.90, 837.80],
    100: [774.60, 1015.60, 1348.60, 1407.20],
    200: [1307.30, 1763.10, 2237.10, 2400.00],
    400: [1891.10, 2764.40, 3743.00, 4720.00],
    500: [2230.70, 3265.70, 4497.00, 5832.50],
  },
  'c2:a5': {
     10: [132.40, 155.30, 189.90, 222.00],
     20: [193.20, 252.90, 282.10, 312.50],
     30: [242.00, 310.40, 363.50, 415.60],
     40: [310.40, 367.90, 483.90, 540.00],
     50: [379.70, 425.40, 604.30, 630.60],
    100: [597.90, 793.20, 1052.40, 1098.10],
    200: [1035.00, 1402.90, 1794.50, 2016.20],
    400: [1645.90, 2338.10, 3035.70, 3960.00],
    500: [1950.70, 2804.50, 3657.20, 4836.20],
  },
  'c2:a4': {
     10: [144.30, 218.20, 259.30, 312.50],
     20: [224.60, 328.80, 446.00, 510.60],
     30: [333.20, 512.10, 632.50, 732.50],
     40: [397.10, 652.10, 800.70, 942.00],
     50: [460.00, 791.00, 968.90, 1152.50],
    100: [805.00, 1184.70, 1500.50, 2183.90],
    200: [1402.90, 2092.90, 2657.00, 4272.50],
    400: [3012.90, 4631.50, 6213.30, 8472.00],
    500: [3817.90, 5899.70, 7992.50, 10512.50],
  },
};

const PLY_ORDER = ['2ply', '3ply', '4ply', '5ply'];

// ────────────────────────────────────────────────────────────────
// AXES
// ────────────────────────────────────────────────────────────────

const axes = {
  size: [
    { slug: 's4x8', label: '4 × 8 inch', note: '107 × 196mm · compact bill book format' },
    { slug: 's8x9', label: '8 × 9 inch', note: '196 × 222mm · letter-sized bill book' },
    { slug: 'a5', label: 'A5', note: '146 × 222mm · standard A-series half-sheet' },
    { slug: 'a4', label: 'A4', note: '222 × 298mm · full A-series sheet' },
  ],
  ply: [
    { slug: '2ply', label: '2 Ply', note: 'Original + 1 copy · most common' },
    { slug: '3ply', label: '3 Ply', note: 'Original + 2 copies' },
    { slug: '4ply', label: '4 Ply', note: 'Original + 3 copies' },
    { slug: '5ply', label: '5 Ply', note: 'Original + 4 copies' },
  ],
  colour: [
    { slug: 'c1', label: '1 Standard Colour', note: 'Single side printing' },
    { slug: 'c2', label: '2 Standard Colour', note: 'Single side printing' },
  ],
};

// ────────────────────────────────────────────────────────────────
// PRICES
// ────────────────────────────────────────────────────────────────

const prices = {};
let count = 0;
for (const [outer, rows] of Object.entries(SOURCE)) {
  const [colour, size] = outer.split(':');
  for (const [qtyStr, plyPrices] of Object.entries(rows)) {
    const qty = parseInt(qtyStr, 10);
    PLY_ORDER.forEach((ply, i) => {
      const dollars = plyPrices[i];
      const cents = Math.round(dollars * 100);
      // Key: size:ply:colour:qty
      const key = [size, ply, colour, qty].join(':');
      prices[key] = cents;
      count++;
    });
  }
}
console.log(`Computed ${count} prices.`);

// ────────────────────────────────────────────────────────────────
// pricing_table
// ────────────────────────────────────────────────────────────────

const pricingTable = {
  axes,
  axis_order: ['size', 'ply', 'colour'],
  qty_tiers: QTYS,
  prices,
};

// ────────────────────────────────────────────────────────────────
// CONFIGURATOR STEPS
// ────────────────────────────────────────────────────────────────

const steps = [
  {
    step_id: 'size', step_order: 0, label: 'Size', type: 'swatch', required: true,
    options: axes.size, show_if: null, step_config: {},
  },
  {
    step_id: 'ply', step_order: 1, label: 'Ply (number of copies per set)', type: 'swatch', required: true,
    options: axes.ply, show_if: null, step_config: {},
  },
  {
    step_id: 'colour', step_order: 2, label: 'Print Colour', type: 'swatch', required: true,
    options: axes.colour, show_if: null, step_config: {},
  },
  {
    step_id: 'qty', step_order: 3, label: 'Quantity (books)', type: 'qty', required: false,
    options: [], show_if: null,
    step_config: { min: 10, step: 1, presets: [10, 50, 100, 200, 500], note: 'Each book contains 50 numbered sets. Numbering is included.', discount_note: null, labelMultiplier: null },
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
    { size: 's4x8', ply: '2ply', colour: 'c1', qty: 10 },
    { size: 's4x8', ply: '5ply', colour: 'c1', qty: 500 },
    { size: 'a5', ply: '3ply', colour: 'c1', qty: 100 },
    { size: 'a4', ply: '4ply', colour: 'c2', qty: 200 },
    { size: 'a4', ply: '5ply', colour: 'c2', qty: 500 },
    { size: 's8x9', ply: '2ply', colour: 'c2', qty: 50 },
  ];
  console.log('\n[4/4] Spot-check:');
  for (const s of spots) {
    const key = [s.size, s.ply, s.colour, s.qty].join(':');
    const cents = prices[key];
    console.log(`  ${key}: $${(cents / 100).toFixed(2)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
