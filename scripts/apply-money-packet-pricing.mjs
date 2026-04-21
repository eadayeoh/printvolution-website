// Money Packet — Horizontal, 157gsm Art Paper / Matt Art Paper (4C + 0C).
// Price list supplied by user, treated as-is (RM numbers stored as cents
// in the Price / axis dimension — user to convert/markup in a later
// pass if needed).
//
// Axes exposed to the customer:
//   • Paper (Art 157 / Matt Art 157 — same price)
//   • Finish — 7 combos as shown in the supplier sheet:
//       1. Without Finishing                              (to 50k)
//       2. 1 Side Soft Touch                              (to 50k)
//       3. 1 Side Soft Touch + 1 Side Spot UV             (to 50k)
//       4. 1 Side Sandblast + 1 Side Spot UV              (to 50k)
//       5. 1 Side Foil (= raised foil, identical pricing) (to 80k)
//       6. 1 Side Soft Touch + 1 Side Foil                (to 80k)
//       7. 1 Side Soft Touch + 1 Side Spot UV + 1 Side Foil (to 50k)
//   • Quantity — typed, snaps down to supplier tier.
//
// Per-finish qty tiers vary: tiers without a price for a given finish
// are filtered out at runtime by the `comboTiers` guard in the engine.

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

const PRODUCT_ID = 'e7b979d0-d327-439a-9e4b-ae4abefe755b';

const QTYS = [
  500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
  15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
  60000, 70000, 80000,
];

// Price rows keyed by finish slug. Value is {qty → price in dollars}.
// Qty tiers missing for a finish = that finish isn't offered at that qty.
const FINISH_PRICES = {
  none: {
    500:   223.80, 1000:  266.40, 2000:  339.20, 3000:  479.20,
    4000:  619.30, 5000:  759.40, 6000:  832.80, 7000:  906.10,
    8000:  979.40, 9000: 1052.80, 10000: 1126.10,
    15000: 1489.80, 20000: 1925.20, 25000: 2248.20, 30000: 2565.90,
    35000: 2978.50, 40000: 3391.00, 45000: 3790.80, 50000: 4190.50,
  },
  soft_touch: {
    500:   282.60, 1000:  380.60, 2000:  564.20, 3000:  815.10,
    4000: 1066.00, 5000: 1316.90, 6000: 1503.40, 7000: 1687.50,
    8000: 1871.60, 9000: 2055.90, 10000: 2240.00,
    15000: 3161.20, 20000: 4150.70, 25000: 5027.90, 30000: 5899.80,
    35000: 6866.50, 40000: 7833.20, 45000: 8787.20, 50000: 9741.10,
  },
  soft_touch_spot_uv: {
    500:   383.00, 1000:  523.90, 2000:  803.90, 3000: 1161.00,
    4000: 1443.60, 5000: 1737.00, 6000: 1996.20, 7000: 2251.30,
    8000: 2509.30, 9000: 2761.00, 10000: 3002.90,
    15000: 4232.20, 20000: 5528.50, 25000: 6727.30, 30000: 7919.20,
    35000: 9213.50, 40000: 10501.10, 45000: 11711.70, 50000: 13041.80,
  },
  sandblast_spot_uv: {
    500:   358.20, 1000:  477.30, 2000:  704.10, 3000: 1012.90,
    4000: 1247.10, 5000: 1497.10, 6000: 1703.90, 7000: 1908.60,
    8000: 2117.30, 9000: 2320.70, 10000: 2514.20,
    15000: 3494.10, 20000: 4548.30, 25000: 5500.70, 30000: 6450.50,
    35000: 7495.80, 40000: 8539.20, 45000: 9465.00, 50000: 10601.10,
  },
  foil: {
    500:   342.60, 1000:  457.20, 2000:  674.00, 3000:  958.00,
    4000: 1242.10, 5000: 1526.20, 6000: 1743.60, 7000: 1960.90,
    8000: 2178.20, 9000: 2395.60, 10000: 2612.90,
    15000: 3941.80, 20000: 5177.20, 25000: 6300.20, 30000: 7417.90,
    35000: 8630.50, 40000: 9843.00, 45000: 11042.80, 50000: 12242.50,
    60000: 14553.30, 70000: 16953.80, 80000: 19342.50,
  },
  soft_touch_foil: {
    500:   401.40, 1000:  571.40, 2000:  899.00, 3000: 1293.90,
    4000: 1688.80, 5000: 2083.70, 6000: 2414.20, 7000: 2742.30,
    8000: 3070.40, 9000: 3398.70, 10000: 3726.80,
    15000: 5613.20, 20000: 7402.70, 25000: 9079.90, 30000: 10751.80,
    35000: 12518.50, 40000: 14285.20, 45000: 16039.20, 50000: 17793.10,
    60000: 21214.40, 70000: 24723.30, 80000: 28220.30,
  },
  soft_touch_spot_uv_foil: {
    500:   501.80, 1000:  714.70, 2000: 1138.70, 3000: 1639.80,
    4000: 2066.40, 5000: 2503.80, 6000: 2907.00, 7000: 3306.10,
    8000: 3708.10, 9000: 4103.80, 10000: 4489.70,
    15000: 6684.20, 20000: 8780.50, 25000: 10779.30, 30000: 12771.20,
    35000: 14865.50, 40000: 16953.10, 45000: 18963.70, 50000: 21093.80,
  },
};

const axes = {
  paper: [
    { slug: 'art_157', label: 'Art Paper 157gsm', note: 'Smooth coated, crisp colour · 4C + 0C' },
    { slug: 'matt_157', label: 'Matt Art 157gsm', note: 'Soft non-glare finish · 4C + 0C' },
  ],
  finish: [
    { slug: 'none',                     label: 'Without Finishing',                              note: 'Plain print · 4C + 0C' },
    { slug: 'soft_touch',               label: '1 Side Soft Touch',                              note: 'Velvety matt lamination · front face' },
    { slug: 'soft_touch_spot_uv',       label: '1 Side Soft Touch + 1 Side Spot UV',             note: 'Soft Touch front, Spot UV highlights' },
    { slug: 'sandblast_spot_uv',        label: '1 Side Sandblast + 1 Side Spot UV',              note: 'Textured sandblast front, Spot UV highlights' },
    { slug: 'foil',                     label: '1 Side Foil',                                    note: 'Gold / silver foil · front face' },
    { slug: 'soft_touch_foil',          label: '1 Side Soft Touch + 1 Side Foil',                note: 'Soft Touch finish with Foil highlight' },
    { slug: 'soft_touch_spot_uv_foil',  label: '1 Side Soft Touch + 1 Side Spot UV + 1 Side Foil', note: 'Full luxury stack · Soft Touch + Spot UV + Foil' },
  ],
};

// Price entries keyed by "<paper>:<finish>:<qty>" → cents.
// Paper doesn't affect price (Art / Matt price identically); duplicate
// across both paper slugs.
const prices = {};
let count = 0;
for (const paper of axes.paper) {
  for (const [finishSlug, byQty] of Object.entries(FINISH_PRICES)) {
    for (const [qtyStr, dollars] of Object.entries(byQty)) {
      const key = `${paper.slug}:${finishSlug}:${qtyStr}`;
      prices[key] = Math.round(dollars * 100);
      count++;
    }
  }
}
console.log(`Computed ${count} price entries (${axes.paper.length} papers × ${axes.finish.length} finishes × varying qty tiers).`);

const pricingTable = {
  axes,
  axis_order: ['paper', 'finish'],
  qty_tiers: QTYS,
  prices,
};

const steps = [
  {
    step_id: 'paper', step_order: 0, label: 'Paper', type: 'swatch', required: true,
    options: axes.paper, show_if: null, step_config: {},
  },
  {
    step_id: 'finish', step_order: 1, label: 'Finishing', type: 'swatch', required: true,
    options: axes.finish, show_if: null, step_config: {},
  },
  {
    step_id: 'qty', step_order: 2, label: 'Quantity', type: 'qty', required: false,
    options: [], show_if: null,
    step_config: {
      min: 500, step: 500,
      presets: [500, 1000, 2000, 5000, 10000, 20000, 50000],
      note: null, discount_note: null, labelMultiplier: null,
    },
  },
];

async function main() {
  const pRes = await fetch(`${BASE}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({
      pricing_table: pricingTable,
      pricing_compute: null,
      lead_time_days: 10,
      print_mode: 'Offset',
    }),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/3] products.pricing_table + lead_time + print_mode updated.');

  await fetch(`${BASE}/rest/v1/product_pricing?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  console.log('[2/3] Cleared any legacy product_pricing matrix.');

  await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  const insCfg = await fetch(`${BASE}/rest/v1/product_configurator`, {
    method: 'POST', headers: H,
    body: JSON.stringify(steps.map((s) => ({ ...s, product_id: PRODUCT_ID }))),
  });
  if (!insCfg.ok) throw new Error(`INSERT configurator: ${insCfg.status} ${await insCfg.text()}`);
  const inserted = await insCfg.json();
  console.log(`[3/3] Inserted ${inserted.length} configurator steps.`);

  console.log('\nSpot-check prices:');
  const spots = [
    ['art_157', 'none', 500],
    ['matt_157', 'none', 500],
    ['art_157', 'soft_touch', 1000],
    ['art_157', 'soft_touch_spot_uv', 5000],
    ['art_157', 'sandblast_spot_uv', 10000],
    ['art_157', 'foil', 50000],
    ['art_157', 'foil', 80000],
    ['art_157', 'soft_touch_spot_uv_foil', 50000],
  ];
  for (const s of spots) {
    const key = s.join(':');
    const cents = prices[key];
    console.log(`  ${key}: ${cents != null ? '$' + (cents / 100).toFixed(2) : 'NO PRICE'}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
