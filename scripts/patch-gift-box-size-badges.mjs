// Gift Box: stamp dimensions onto each GB01-GB05 badge.
// Mapping inferred from the pricing tiers (GB01-03 small price tier,
// GB04-05 larger tier) + the supplied product images:
//
//   GB01 — 40 × 40 × 40mm · heart-tab tulip box
//   GB02 — 50 × 50 × 50mm · twist top
//   GB03 — 50 × 50 × 50mm · flower top
//   GB04 — 70 × 70 × 90mm · twist top
//   GB05 — 70 × 70 × 90mm · flower top

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };

// Find Gift Box product by slug
const [p] = await (await fetch(`${BASE}/rest/v1/products?slug=eq.gift-box&select=id,pricing_table`, { headers: H })).json();
if (!p) throw new Error('gift-box product not found');
const PID = p.id;

const SIZE_NOTES = {
  gb01: '40 × 40 × 40mm · heart-tab tulip',
  gb02: '50 × 50 × 50mm · twist top',
  gb03: '50 × 50 × 50mm · flower top',
  gb04: '70 × 70 × 90mm · twist top',
  gb05: '70 × 70 × 90mm · flower top',
};

// 1. Update pricing_table.axes.size with new notes
const pt = p.pricing_table;
const nextSizeAxis = pt.axes.size.map((o) => ({ ...o, note: SIZE_NOTES[o.slug] ?? o.note }));
const nextPt = { ...pt, axes: { ...pt.axes, size: nextSizeAxis } };
await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ pricing_table: nextPt }),
});
console.log('[1/2] pricing_table size axis badges stamped.');

// 2. Sync the configurator step's size options
const cfg = await (await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.size&select=options`, { headers: H })).json();
const nextOpts = (cfg[0]?.options ?? []).map((o) => ({ ...o, note: SIZE_NOTES[o.slug] ?? o.note }));
await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.size`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ options: nextOpts }),
});
console.log('[2/2] Configurator size step options stamped.');

console.log('\nSize badges now read:');
for (const slug of Object.keys(SIZE_NOTES)) {
  console.log(`  ${slug.toUpperCase()}: ${SIZE_NOTES[slug]}`);
}
