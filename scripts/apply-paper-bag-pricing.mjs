// Paper Bag pricing — 210gsm Art Card, 4C + 0C, 1 side lamination
// (Matt or Gloss at same price, customer picks), optional 1 side
// Spot UV. 10 size SKUs (PB01–PB10). Qty 100 → 10,000.
//
// Axes:
//   • size (PB01..PB10) — pricing axis
//   • lam_finish (matt / gloss) — display-only, same price
//   • spot_uv (none / yes) — pricing axis
//   • qty — snaps to tier
//
// axis_order is ['size', 'spot_uv'] — lam_finish is NOT a pricing
// axis (Matt and Gloss cost the same), so the engine ignores it in
// the price lookup but the customer still picks one.

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

const PID = 'f682c1d6-f6e7-4d36-afac-73b859ddb264';

const QTYS = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
const SIZES = ['pb01','pb02','pb03','pb04','pb05','pb06','pb07','pb08','pb09','pb10'];

// Table 1: 1 Side Matt / Gloss Lam (no Spot UV). 10 sizes × 15 qtys.
const NO_UV = {
  pb01: { 100: 493.70, 200: 552.30, 300: 606.10, 400: 664.80, 500: 699.00, 1000: 1026.50, 2000: 1759.50, 3000: 2512.30, 4000: 3177.00, 5000: 3968.80, 6000: 4633.40, 7000: 5405.60, 8000: 6060.50, 9000: 6823.10, 10000: 7526.80 },
  pb02: { 100: 503.50, 200: 562.10, 300: 625.60, 400: 713.60, 500: 796.70, 1000: 1231.80, 2000: 2209.30, 3000: 3186.80, 4000: 4144.60, 5000: 5102.60, 6000: 6070.30, 7000: 7038.00, 8000: 7996.10, 9000: 8963.80, 10000: 9931.50 },
  pb03: { 100: 513.20, 200: 591.40, 300: 694.00, 400: 801.60, 500: 909.10, 1000: 1456.60, 2000: 2610.00, 3000: 3724.30, 4000: 4916.80, 5000: 6031.30, 6000: 7145.50, 7000: 8260.00, 8000: 9442.80, 9000: 10557.00, 10000: 11730.00 },
  pb04: { 100: 855.40, 200: 1036.30, 300: 1226.80, 400: 1417.50, 500: 1608.00, 1000: 2629.60, 2000: 4291.30, 3000: 6099.60, 4000: 8074.30, 5000: 9814.10, 6000: 11612.80, 7000: 13411.30, 8000: 15346.80, 9000: 17145.40, 10000: 19061.30 },
  pb05: { 100: 855.40, 200: 1036.30, 300: 1226.80, 400: 1417.50, 500: 1608.00, 1000: 2629.60, 2000: 4291.30, 3000: 6099.60, 4000: 8074.30, 5000: 9814.10, 6000: 11612.80, 7000: 13411.30, 8000: 15346.80, 9000: 17145.40, 10000: 19061.30 },
  pb06: { 100: 536.30, 200: 585.90, 300: 646.10, 400: 732.80, 500: 826.30, 1000: 1249.00, 2000: 2265.90, 3000: 3257.60, 4000: 4229.50, 5000: 5232.00, 6000: 6232.90, 7000: 7237.20, 8000: 8156.50, 9000: 9148.20, 10000: 10140.90 },
  pb07: { 100: 536.30, 200: 585.90, 300: 646.10, 400: 732.80, 500: 826.30, 1000: 1249.00, 2000: 2265.90, 3000: 3257.60, 4000: 4229.50, 5000: 5232.00, 6000: 6232.90, 7000: 7237.20, 8000: 8156.50, 9000: 9148.20, 10000: 10140.90 },
  pb08: { 100: 530.10, 200: 564.80, 300: 613.50, 400: 672.60, 500: 740.30, 1000: 1040.20, 2000: 1772.50, 3000: 2494.70, 4000: 3006.40, 5000: 3678.60, 6000: 4170.80, 7000: 4847.50, 8000: 5493.50, 9000: 6139.30, 10000: 6815.90 },
  pb09: { 100: 555.50, 200: 633.90, 300: 769.30, 400: 922.20, 500: 1061.00, 1000: 1794.70, 2000: 3030.80, 3000: 4249.30, 4000: 5521.20, 5000: 6675.60, 6000: 7958.00, 7000: 9189.50, 8000: 10421.40, 9000: 11676.90, 10000: 12819.10 },
  pb10: { 100: 552.50, 200: 603.80, 300: 665.70, 400: 744.10, 500: 842.10, 1000: 1306.40, 2000: 2309.20, 3000: 3349.00, 4000: 4311.90, 5000: 5342.50, 6000: 6343.50, 7000: 7374.30, 8000: 8295.30, 9000: 9316.70, 10000: 10307.80 },
};

// Table 2: 1 Side Matt / Gloss Lam + 1 Side Spot UV.
const WITH_UV = {
  pb01: { 100: 791.80, 200: 850.50, 300: 904.20, 400: 962.90, 500: 1114.40, 1000: 1456.60, 2000: 2336.30, 3000: 3264.90, 4000: 4095.80, 5000: 5053.80, 6000: 5894.30, 7000: 6823.10, 8000: 7663.60, 9000: 8582.60, 10000: 9452.50 },
  pb02: { 100: 870.10, 200: 928.70, 300: 992.20, 400: 1104.60, 500: 1270.80, 1000: 1857.30, 2000: 2942.30, 3000: 4144.60, 4000: 5327.50, 5000: 6520.00, 6000: 7722.30, 7000: 8924.60, 8000: 10117.20, 9000: 11319.60, 10000: 12512.00 },
  pb03: { 100: 884.70, 200: 958.10, 300: 1085.00, 400: 1236.60, 500: 1407.60, 1000: 2170.10, 2000: 3450.60, 3000: 4858.30, 4000: 6353.80, 5000: 7761.40, 6000: 9169.10, 7000: 10586.30, 8000: 12062.40, 9000: 13470.10, 10000: 14946.10 },
  pb04: { 100: 1505.40, 200: 1696.00, 300: 1886.60, 400: 2077.20, 500: 2277.60, 1000: 3509.30, 2000: 5659.80, 3000: 8035.10, 4000: 10566.80, 5000: 12873.80, 6000: 15239.30, 7000: 17595.00, 8000: 20097.50, 9000: 22453.30, 10000: 24945.80 },
  pb05: { 100: 1505.40, 200: 1696.00, 300: 1886.60, 400: 2077.20, 500: 2277.60, 1000: 3509.30, 2000: 5659.80, 3000: 8035.10, 4000: 10566.80, 5000: 12873.80, 6000: 15239.30, 7000: 17595.00, 8000: 20097.50, 9000: 22453.30, 10000: 24945.80 },
  pb06: { 100: 846.80, 200: 896.40, 300: 956.60, 400: 1043.30, 500: 1136.80, 1000: 1559.50, 2000: 2737.80, 3000: 3907.90, 4000: 5058.20, 5000: 6239.20, 6000: 7418.50, 7000: 8601.20, 8000: 9698.90, 9000: 10869.10, 10000: 12040.20 },
  pb07: { 100: 846.80, 200: 896.40, 300: 956.60, 400: 1043.30, 500: 1136.80, 1000: 1559.50, 2000: 2737.80, 3000: 3907.90, 4000: 5058.20, 5000: 6239.20, 6000: 7418.50, 7000: 8601.20, 8000: 9698.90, 9000: 10869.10, 10000: 12040.20 },
  pb08: { 100: 840.60, 200: 875.30, 300: 924.00, 400: 983.10, 500: 1050.80, 1000: 1350.70, 2000: 2083.00, 3000: 2878.00, 4000: 3479.20, 5000: 4240.80, 6000: 4822.40, 7000: 5588.60, 8000: 6324.00, 9000: 7059.10, 10000: 7825.30 },
  pb09: { 100: 866.00, 200: 944.40, 300: 1079.80, 400: 1232.70, 500: 1371.50, 1000: 2178.00, 2000: 3682.40, 3000: 5169.10, 4000: 6709.30, 5000: 8132.00, 6000: 9682.60, 7000: 11182.40, 8000: 12682.60, 9000: 14206.30, 10000: 15616.80 },
  pb10: { 100: 863.00, 200: 914.30, 300: 976.20, 400: 1054.60, 500: 1152.60, 1000: 1616.90, 2000: 2805.50, 3000: 4035.90, 4000: 5189.40, 5000: 6410.60, 6000: 7602.30, 7000: 8823.60, 8000: 9935.30, 9000: 11147.30, 10000: 12329.00 },
};

const axes = {
  size: SIZES.map((s) => ({ slug: s, label: s.toUpperCase(), note: null })),
  lam_finish: [
    { slug: 'matt',  label: 'Matt Lamination',  note: 'Soft non-glare · 1 side' },
    { slug: 'gloss', label: 'Gloss Lamination', note: 'High-sheen finish · 1 side · same price as Matt' },
  ],
  spot_uv: [
    { slug: 'none', label: 'No Spot UV' },
    { slug: 'yes',  label: '1 Side Spot UV', note: 'Glossy raised highlight over lamination' },
  ],
};

// Price keys: <size>:<spot_uv>:<qty> → cents. lam_finish isn't in the
// key because Matt and Gloss are priced identically.
const prices = {};
let count = 0;
for (const size of SIZES) {
  for (const qty of QTYS) {
    const noUv = NO_UV[size]?.[qty];
    if (noUv != null) {
      prices[`${size}:none:${qty}`] = Math.round(noUv * 100);
      count++;
    }
    const withUv = WITH_UV[size]?.[qty];
    if (withUv != null) {
      prices[`${size}:yes:${qty}`] = Math.round(withUv * 100);
      count++;
    }
  }
}
console.log(`Computed ${count} price entries (${SIZES.length} sizes × 2 spot_uv × ${QTYS.length} qty tiers).`);

const pricing_table = {
  axes,
  axis_order: ['size', 'spot_uv'], // lam_finish not priced — display only
  qty_tiers: QTYS,
  prices,
};

const steps = [
  {
    step_id: 'size', step_order: 0, label: 'Paper bag size', type: 'swatch', required: true,
    options: axes.size, show_if: null, step_config: {},
  },
  {
    step_id: 'lam_finish', step_order: 1, label: 'Lamination finish', type: 'swatch', required: true,
    options: axes.lam_finish, show_if: null, step_config: {},
  },
  {
    step_id: 'spot_uv', step_order: 2, label: 'Spot UV', type: 'swatch', required: true,
    options: axes.spot_uv, show_if: null, step_config: {},
  },
  {
    step_id: 'qty', step_order: 3, label: 'Quantity', type: 'qty', required: false,
    options: [], show_if: null,
    step_config: {
      min: 100, step: 100,
      presets: [100, 500, 1000, 2000, 5000, 10000],
      note: null, discount_note: null, labelMultiplier: null,
    },
  },
];

async function main() {
  const pRes = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      pricing_table,
      pricing_compute: null,
      lead_time_days: 10,
      print_mode: 'Offset',
    }),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/3] products.pricing_table + lead_time + print_mode updated.');

  await fetch(`${BASE}/rest/v1/product_pricing?product_id=eq.${PID}`, { method: 'DELETE', headers: H });
  console.log('[2/3] Cleared legacy product_pricing matrix.');

  await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}`, { method: 'DELETE', headers: H });
  const insCfg = await fetch(`${BASE}/rest/v1/product_configurator`, {
    method: 'POST', headers: H,
    body: JSON.stringify(steps.map((s) => ({ ...s, product_id: PID }))),
  });
  if (!insCfg.ok) throw new Error(`INSERT configurator: ${insCfg.status} ${await insCfg.text()}`);
  const inserted = await insCfg.json();
  console.log(`[3/3] Inserted ${inserted.length} configurator steps.`);

  console.log('\nSpot-check prices:');
  const spots = [
    ['pb01', 'none', 100],
    ['pb01', 'yes', 100],
    ['pb04', 'none', 500],
    ['pb08', 'yes', 1000],
    ['pb10', 'none', 10000],
    ['pb10', 'yes', 10000],
  ];
  for (const s of spots) {
    const k = s.join(':');
    const cents = prices[k];
    console.log(`  ${k}: ${cents != null ? '$' + (cents / 100).toFixed(2) : 'MISSING'}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
