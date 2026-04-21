// Money Packet: strip qty tiers >= 10,000 — user reports nobody
// orders that volume in practice. Keeps 500-9000, drops 10k/15k/20k
// /25k/30k/35k/40k/45k/50k/60k/70k/80k. Removes the matching price
// entries too so the jsonb stays tight.

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
const CAP = 10000; // drop tiers >= this

const [row] = await (await fetch(
  `${BASE}/rest/v1/products?id=eq.${PID}&select=pricing_table`,
  { headers: H },
)).json();
if (!row?.pricing_table) throw new Error('no pricing_table on money packet');
const pt = row.pricing_table;

const keepTiers = (pt.qty_tiers ?? []).filter((t) => t < CAP);
const droppedTiers = (pt.qty_tiers ?? []).filter((t) => t >= CAP);

const keepPrices = {};
let dropped = 0;
for (const [k, v] of Object.entries(pt.prices ?? {})) {
  const qtyPart = k.split(':').pop();
  const qty = Number(qtyPart);
  if (!Number.isFinite(qty) || qty >= CAP) { dropped++; continue; }
  keepPrices[k] = v;
}

const next = { ...pt, qty_tiers: keepTiers, prices: keepPrices };

const res = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ pricing_table: next }),
});
if (!res.ok) throw new Error(`PATCH: ${res.status} ${await res.text()}`);

console.log(`✓ Kept ${keepTiers.length} tiers: [${keepTiers.join(', ')}]`);
console.log(`  Dropped ${droppedTiers.length} tiers: [${droppedTiers.join(', ')}]`);
console.log(`  Pruned ${dropped} price entries.`);
