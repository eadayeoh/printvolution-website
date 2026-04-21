// Money Packet pricing — rebuild to match the admin's updated
// configurator:
//   orientation axis (art_157 = Vertical, option-2 = Horizontal) —
//     Vertical and Horizontal share the same price per (finish, qty).
//   finish axis reduced to 5 options (Sandblast + Spot UV and plain
//     Foil dropped intentionally).
//   Prices: pulled from the supplier sheet the user shared earlier.
//
// Surgical: only updates pricing_table on the products row — leaves
// configurator, extras, faqs untouched.

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

const PID = 'e7b979d0-d327-439a-9e4b-ae4abefe755b';

// Qty tiers: 500 → 50k for non-foil finishes; foil combos extend to
// 80k per the supplier sheet. Only soft_touch_foil + soft_touch_spot_uv_foil
// are kept in the new finish set — the former goes to 80k, the latter
// caps at 50k.
const QTYS = [
  500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
  15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
  60000, 70000, 80000,
];

// {qty → price in dollars} per finish. Missing tiers = finish isn't
// offered at that qty; the engine's comboTiers filter hides them.
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

// Keep the existing orientation slugs the admin set (art_157, option-2)
// so we don't force a manual re-slug of the configurator step.
const ORIENTATIONS = [
  { slug: 'art_157',  label: 'Vertical Money Packet' },
  { slug: 'option-2', label: 'Horizontal Money Packet' },
];

const FINISHES = [
  { slug: 'none',                     label: 'No Finishing' },
  { slug: 'soft_touch',               label: '1 Side Soft Touch' },
  { slug: 'soft_touch_spot_uv',       label: '1 Side Soft Touch + 1 Side Spot UV' },
  { slug: 'soft_touch_foil',          label: '1 Side Soft Touch + 1 Side Foil' },
  { slug: 'soft_touch_spot_uv_foil',  label: '1 Side Soft Touch + 1 Side Spot UV + 1 Side Foil' },
];

// Build pricing_table. Same price applied to both orientations.
const axes = {
  orientation: ORIENTATIONS,
  finish: FINISHES,
};

const prices = {};
let count = 0;
for (const o of ORIENTATIONS) {
  for (const f of FINISHES) {
    const byQty = FINISH_PRICES[f.slug];
    if (!byQty) continue;
    for (const [qtyStr, dollars] of Object.entries(byQty)) {
      prices[`${o.slug}:${f.slug}:${qtyStr}`] = Math.round(dollars * 100);
      count++;
    }
  }
}
console.log(`Computed ${count} price entries (${ORIENTATIONS.length} orientations × ${FINISHES.length} finishes × varying qty tiers).`);

const pricingTable = {
  axes,
  axis_order: ['orientation', 'finish'],
  qty_tiers: QTYS,
  prices,
};

const res = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH', headers: H,
  body: JSON.stringify({ pricing_table: pricingTable }),
});
if (!res.ok) throw new Error(`PATCH: ${res.status} ${await res.text()}`);
console.log('✓ pricing_table rewired to orientation × finish axes.');

// Spot-check
console.log('\nSpot-check (Horizontal and Vertical should match):');
const spots = [
  ['art_157',  'none', 500],
  ['option-2', 'none', 500],
  ['art_157',  'soft_touch', 1000],
  ['option-2', 'soft_touch', 1000],
  ['art_157',  'soft_touch_foil', 50000],
  ['option-2', 'soft_touch_foil', 80000],
  ['art_157',  'soft_touch_spot_uv_foil', 50000],
];
for (const s of spots) {
  const key = s.join(':');
  const cents = prices[key];
  console.log(`  ${key}: ${cents != null ? '$' + (cents / 100).toFixed(2) : 'NO PRICE'}`);
}
