// Tote Bag pricing — 3 canvas bag sizes (CB1 L / CB2 M / CB3 S) with
// heat-transfer print. Four print areas (A6, A5, A4, A3) on CB1 and
// CB2; CB3 supports only A6, A5, A4 (no A3 per supplier sheet).
// Single-sided and double-sided same price per user — not an axis.
// Qty 100 to 20,000.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };
const PID = '32294086-397c-4c64-95f0-51834fe363d6';

const QTYS = [100,200,300,400,500,600,700,800,900,1000,2000,3000,4000,5000,10000,20000];

// { qty → dollars } per (bag, print_area).
const PRICES = {
  cb1: {
    a6: { 100:1481.30,200:2791.50,300:4089.80,400:5385.00,500:6683.30,600:7987.50,700:9291.80,800:10596.00,900:11900.30,1000:13204.50,2000:26259.80,3000:39315.00,4000:52370.30,5000:65425.50,10000:130701.00,20000:261279.00 },
    a5: { 100:1742.30,200:3151.50,300:4533.80,400:5916.00,500:7298.30,600:8695.50,700:10089.80,800:11484.00,900:12881.30,1000:14275.50,2000:28257.00,3000:42238.50,4000:56220.00,5000:70201.50,10000:140109.00,20000:279984.00 },
    a4: { 100:2264.30,200:3865.50,300:5415.80,400:6966.00,500:8519.30,600:10093.50,700:11670.80,800:13248.00,900:14825.30,1000:16399.50,2000:32217.80,3000:48036.00,4000:63854.30,5000:79672.50,10000:158766.00,20000:317064.00 },
    a3: { 100:3042.20,200:4929.30,300:6731.60,400:8533.80,500:10333.10,600:12182.10,700:14028.80,800:15875.10,900:17721.20,1000:19567.50,2000:38124.90,3000:56682.50,4000:75240.00,5000:93797.40,10000:186584.40,20000:372359.00 },
  },
  cb2: {
    a6: { 100:1084.50,200:1998.00,300:2899.50,400:3798.00,500:4699.50,600:5607.00,700:6514.50,800:7422.00,900:8329.50,1000:9237.00,2000:18324.80,3000:27412.50,4000:36500.30,5000:45588.00,10000:91026.00,20000:181929.00 },
    a5: { 100:1345.50,200:2358.00,300:3343.50,400:4329.00,500:5314.50,600:6315.00,700:7312.50,800:8310.00,900:9310.50,1000:10308.00,2000:20322.00,3000:30336.00,4000:40350.00,5000:50364.00,10000:100434.00,20000:200634.00 },
    a4: { 100:1867.50,200:3072.00,300:4225.50,400:5379.00,500:6535.50,600:7713.00,700:8893.50,800:10074.00,900:11254.50,1000:12432.00,2000:24282.80,3000:36133.50,4000:47984.30,5000:59835.00,10000:119091.00,20000:237714.00 },
    a3: { 100:2645.40,200:4135.80,300:5541.30,400:6946.80,500:8349.30,600:9801.60,700:11251.50,800:12701.10,900:14150.40,1000:15600.00,2000:30189.90,3000:44780.00,4000:59370.00,5000:73959.90,10000:146909.40,20000:293009.00 },
  },
  cb3: {
    a6: { 100:912.00,200:1653.00,300:2382.00,400:3108.00,500:3837.00,600:4572.00,700:5307.00,800:6042.00,900:6777.00,1000:7512.00,2000:14874.80,3000:22237.50,4000:29600.30,5000:36963.00,10000:73776.00,20000:147429.00 },
    a5: { 100:1173.00,200:2013.00,300:2826.00,400:3639.00,500:4452.00,600:5280.00,700:6105.00,800:6930.00,900:7758.00,1000:8583.00,2000:16872.00,3000:25161.00,4000:33450.00,5000:41739.00,10000:83184.00,20000:166134.00 },
    a4: { 100:1695.00,200:2727.00,300:3708.00,400:4689.00,500:5673.00,600:6678.00,700:7686.00,800:8694.00,900:9702.00,1000:10707.00,2000:20832.80,3000:30958.50,4000:41084.30,5000:51210.00,10000:101841.00,20000:203214.00 },
    // CB3 has no A3 per the supplier sheet.
  },
};

const axes = {
  bag_size: [
    { slug: 'cb1', label: 'CB1 · Large',  note: '620 × 440 × 160mm' },
    { slug: 'cb2', label: 'CB2 · Medium', note: '470 × 420 × 140mm' },
    { slug: 'cb3', label: 'CB3 · Small',  note: '340 × 360 × 80mm' },
  ],
  print_area: [
    { slug: 'a6', label: 'A6 print area' },
    { slug: 'a5', label: 'A5 print area' },
    { slug: 'a4', label: 'A4 print area' },
    { slug: 'a3', label: 'A3 print area', show_if: { step: 'bag_size', value: ['cb1', 'cb2'] } },
  ],
};

const prices = {};
let count = 0;
for (const bag of Object.keys(PRICES)) {
  for (const area of Object.keys(PRICES[bag])) {
    for (const [qty, dollars] of Object.entries(PRICES[bag][area])) {
      prices[`${bag}:${area}:${qty}`] = Math.round(dollars * 100);
      count++;
    }
  }
}
console.log(`Computed ${count} tote-bag price entries.`);

const pricing_table = {
  axes,
  axis_order: ['bag_size', 'print_area'],
  qty_tiers: QTYS,
  prices,
};

const steps = [
  { step_id: 'bag_size',   step_order: 0, label: 'Canvas bag size', type: 'swatch', required: true, options: axes.bag_size, show_if: null, step_config: {} },
  { step_id: 'print_area', step_order: 1, label: 'Print area size', type: 'swatch', required: true, options: axes.print_area, show_if: null, step_config: {} },
  { step_id: 'qty',        step_order: 2, label: 'Quantity', type: 'qty', required: false, options: [], show_if: null,
    step_config: { min: 100, step: 100, presets: [100, 500, 1000, 2000, 5000, 10000], note: 'Single-sided and double-sided priced the same.', discount_note: null, labelMultiplier: null } },
];

async function main() {
  const p1 = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ pricing_table, pricing_compute: null, lead_time_days: 14, print_mode: 'Heat Transfer' }),
  });
  if (!p1.ok) throw new Error(`PATCH products: ${p1.status} ${await p1.text()}`);
  console.log('[1/3] pricing_table + lead_time + print_mode updated.');

  await fetch(`${BASE}/rest/v1/product_pricing?product_id=eq.${PID}`, { method: 'DELETE', headers: H });
  await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}`, { method: 'DELETE', headers: H });
  const ins = await fetch(`${BASE}/rest/v1/product_configurator`, {
    method: 'POST', headers: H,
    body: JSON.stringify(steps.map((s) => ({ ...s, product_id: PID }))),
  });
  if (!ins.ok) throw new Error(`INSERT cfg: ${ins.status} ${await ins.text()}`);
  console.log(`[2/3] Configurator rewritten (${(await ins.json()).length} steps).`);

  console.log('\n[3/3] Spot-check:');
  for (const k of ['cb1:a6:100','cb1:a3:20000','cb2:a5:1000','cb3:a4:3000']) {
    console.log(`  ${k}: $${((prices[k] ?? 0) / 100).toFixed(2)}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
