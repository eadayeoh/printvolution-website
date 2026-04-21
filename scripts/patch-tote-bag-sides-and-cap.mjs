// Tote Bag updates:
//   1. Add "Print sides" step (single / double) — no price impact.
//   2. Remove qty tiers >= 10,000 (10k and 20k dropped from ladder).
//
// Surgical: PATCH pricing_table (trim qty_tiers + prune price entries)
// and insert the sides step between print_area and qty.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };

const PID = '32294086-397c-4c64-95f0-51834fe363d6';
const CAP = 10000; // drop tiers >= this

// --- 1. Trim pricing_table qty_tiers + prices ---
const [row] = await (await fetch(`${BASE}/rest/v1/products?id=eq.${PID}&select=pricing_table`, { headers: H })).json();
if (!row?.pricing_table) throw new Error('no pricing_table on tote-bag');
const pt = row.pricing_table;

const keepTiers = (pt.qty_tiers ?? []).filter((t) => t < CAP);
const droppedTiers = (pt.qty_tiers ?? []).filter((t) => t >= CAP);
const keepPrices = {};
let pruned = 0;
for (const [k, v] of Object.entries(pt.prices ?? {})) {
  const q = Number(k.split(':').pop());
  if (Number.isFinite(q) && q < CAP) keepPrices[k] = v;
  else pruned++;
}
const nextPt = { ...pt, qty_tiers: keepTiers, prices: keepPrices };
const r1 = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ pricing_table: nextPt }),
});
if (!r1.ok) throw new Error(`PATCH pricing_table: ${r1.status} ${await r1.text()}`);
console.log(`[1/2] Kept ${keepTiers.length} tiers: [${keepTiers.join(', ')}] · dropped [${droppedTiers.join(', ')}] · pruned ${pruned} prices.`);

// --- 2. Insert sides step (if missing) between print_area (1) and qty (2) ---
const existing = await (await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.sides&select=id`,
  { headers: H },
)).json();
if (existing.length > 0) {
  console.log('[2/2] sides step already exists — nothing to insert.');
  process.exit(0);
}

// Bump qty from order 2 → 3 to make room.
await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.qty`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ step_order: 3 }),
});

const sidesStep = {
  product_id: PID,
  step_id: 'sides',
  step_order: 2,
  label: 'Print sides',
  type: 'swatch',
  required: true,
  options: [
    { slug: 'single', label: 'Single-sided', note: 'Print on one face' },
    { slug: 'double', label: 'Double-sided', note: 'Print on both faces · same price' },
  ],
  show_if: null,
  step_config: {},
};
const r2 = await fetch(`${BASE}/rest/v1/product_configurator`, {
  method: 'POST', headers: H, body: JSON.stringify([sidesStep]),
});
if (!r2.ok) throw new Error(`INSERT sides: ${r2.status} ${await r2.text()}`);
console.log('[2/2] sides step inserted (single / double, no price impact).');
