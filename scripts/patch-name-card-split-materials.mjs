// Name Card — split the lumped "Premium RJ ..." material options into
// their actual paper names and relabel:
//
//   (was) Premium RJ 250–299GSM · 200GSM Tangerine White
//   (now) 200GSM Tangerine White                                 → dig_rj250
//
//   (was) Premium RJ 300–349GSM · 300GSM Maple Bright / White
//   (now) 300GSM Maple Bright                                    → dig_rj300
//   (now) 300GSM Maple White                                     → dig_rj300
//
//   (was) Premium RJ 350–400GSM · 350GSM Grandeur / Shiruku
//   (now) 350GSM Grandeur                                        → dig_rj350
//   (now) 350GSM Shiruku                                         → dig_rj350
//
// Basic and Basic+ keep the same slugs. The three original RJ slugs
// are retired and replaced with paper-name slugs. All pricing_table
// entries are rebuilt with the new slug keys so the old prefixes
// cannot linger.
//
// Rebuilds: products.pricing_table, product_configurator.material.
// Does NOT touch extras / faqs since the body copy already refers to
// papers by their real names.

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

const PID = 'e6e1d3ae-b7a9-46c9-b97b-adde24b565fc';
const PRICELIST = JSON.parse(fs.readFileSync('scripts/pvpricelist-snapshot.json', 'utf8'));
const NC = PRICELIST.rates.namecards;

// -----------------------------------------------------------------------------
// 1. New material list — 7 options, keyed by paper name
// -----------------------------------------------------------------------------
const MATERIALS = [
  { slug: 'basic',           rate_key: 'dig_basic',   label: 'Basic — 250GSM Art Card',   note: 'Standard weight · most popular' },
  { slug: 'basicp',          rate_key: 'dig_basicp',  label: 'Basic+ — 300GSM Art Card',  note: 'Heavier · reads more premium' },
  { slug: 'tangerine_white', rate_key: 'dig_rj250',   label: '200GSM Tangerine White',    note: 'Uncoated · cotton-feel' },
  { slug: 'maple_bright',    rate_key: 'dig_rj300',   label: '300GSM Maple Bright',       note: 'Textured · subtle wood grain' },
  { slug: 'maple_white',     rate_key: 'dig_rj300',   label: '300GSM Maple White',        note: 'Textured · white-core variant' },
  { slug: 'grandeur',        rate_key: 'dig_rj350',   label: '350GSM Grandeur',           note: 'Heavyweight · cotton-feel executive' },
  { slug: 'shiruku',         rate_key: 'dig_rj350',   label: '350GSM Shiruku',            note: 'Heavyweight · silk-finish executive' },
];

const YESNO = [
  { slug: 'no',  label: 'No' },
  { slug: 'yes', label: 'Yes' },
];

const FINISHINGS = [
  { axis: 'lam', fin_key: 'lam' },
  { axis: 'rnd', fin_key: 'rnd' },
  { axis: 'hot', fin_key: 'hot' },
  { axis: 'suv', fin_key: 'suv' },
  { axis: 'die', fin_key: 'die' },
];
const QTY_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// -----------------------------------------------------------------------------
// 2. Rebuild pricing_table with new slug keys
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

const axisOrder = ['material', 'lam', 'rnd', 'hot', 'suv', 'die'];
const prices = {};
let comboCount = 0;

for (const m of MATERIALS) {
  for (const lam of YESNO) {
    for (const rnd of YESNO) {
      for (const hot of YESNO) {
        for (const suv of YESNO) {
          for (const die of YESNO) {
            for (const boxes of QTY_TIERS) {
              const base = boxes * perBoxRate(m.rate_key, boxes);
              let surcharge = 0;
              const finState = { lam, rnd, hot, suv, die };
              for (const f of FINISHINGS) {
                if (finState[f.axis].slug === 'yes') {
                  surcharge += finSurcharge(f.fin_key, boxes);
                }
              }
              const totalDollars = base + surcharge;
              const key = `${m.slug}:${lam.slug}:${rnd.slug}:${hot.slug}:${suv.slug}:${die.slug}:${boxes}`;
              prices[key] = Math.round(totalDollars * 100);
              comboCount++;
            }
          }
        }
      }
    }
  }
}

const pricingTable = {
  axes: {
    material: MATERIALS.map((m) => ({ slug: m.slug, label: m.label, note: m.note })),
    lam: YESNO,
    rnd: YESNO,
    hot: YESNO,
    suv: YESNO,
    die: YESNO,
  },
  axis_order: axisOrder,
  qty_tiers: QTY_TIERS,
  prices,
};

console.log(`Built ${comboCount} price entries (7 materials × 2^5 finishings × 10 box tiers).`);

const prodRes = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ pricing_table: pricingTable }),
});
if (!prodRes.ok) throw new Error(`PATCH products: ${prodRes.status} ${await prodRes.text()}`);
console.log('✓ pricing_table rebuilt with 7 materials');

// -----------------------------------------------------------------------------
// 3. product_configurator — update material step options
// -----------------------------------------------------------------------------
const cfgPatch = await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.material`,
  {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({
      options: MATERIALS.map((m) => ({ slug: m.slug, label: m.label, note: m.note })),
    }),
  },
);
if (!cfgPatch.ok) throw new Error(`PATCH configurator: ${cfgPatch.status} ${await cfgPatch.text()}`);
console.log('✓ configurator material step updated to 7 options');

// -----------------------------------------------------------------------------
// 4. Spot-check — Maple Bright and Maple White share rj300 rates;
//    Grandeur and Shiruku share rj350 rates.
// -----------------------------------------------------------------------------
function check(slug, qty, expected) {
  const key = `${slug}:no:no:no:no:no:${qty}`;
  const got = (prices[key] ?? 0) / 100;
  const pass = got === expected ? '✓' : '✗';
  console.log(`  ${pass} ${key.padEnd(36)} → $${got} (expect $${expected})`);
}
console.log('\nSpot-check rates:');
check('basic',           1,  24);
check('basic',           10, 140);
check('basicp',          10, 180);
check('tangerine_white', 1,  32);  // rj250:1
check('tangerine_white', 10, 230); // rj250:10 → 10 × 23
check('maple_bright',    5,  155); // rj300:5 → 5 × 31
check('maple_white',     5,  155); // same as maple_bright
check('grandeur',        10, 310); // rj350:10 → 10 × 31
check('shiruku',         10, 310); // same as grandeur
