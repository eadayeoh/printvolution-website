// Paper Bag: stamp real dimensions from the supplied PB01-PB10
// reference images into each size badge.
//
// Dimensions (W × H × D mm per the photos you sent):
//   PB01: 203 × 180 × 80
//   PB02: 203 × 222 × 80
//   PB03: (image didn't include a dimension line — leaving the
//          placeholder for you to fill via admin)
//   PB04: 380 × 350 × 100
//   PB05: 432 × 305 × 140
//   PB06: 210 × 250 × 110
//   PB07: 210 × 250 × 90
//   PB08: 135 × 175 × 80
//   PB09: 340 × 250 × 120
//   PB10: 200 × 310 × 110

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };

const PID = 'f682c1d6-f6e7-4d36-afac-73b859ddb264';

const SIZE_NOTES = {
  pb01: '203 × 180 × 80mm',
  pb02: '203 × 222 × 80mm',
  // pb03 intentionally not set — dimension line was missing from the
  // supplied image; leave the earlier placeholder in place.
  pb04: '380 × 350 × 100mm',
  pb05: '432 × 305 × 140mm',
  pb06: '210 × 250 × 110mm',
  pb07: '210 × 250 × 90mm',
  pb08: '135 × 175 × 80mm',
  pb09: '340 × 250 × 120mm',
  pb10: '200 × 310 × 110mm',
};

const [p] = await (await fetch(`${BASE}/rest/v1/products?id=eq.${PID}&select=pricing_table`, { headers: H })).json();
const pt = p.pricing_table;
const nextSizeAxis = pt.axes.size.map((o) => SIZE_NOTES[o.slug] ? { ...o, note: SIZE_NOTES[o.slug] } : o);
await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ pricing_table: { ...pt, axes: { ...pt.axes, size: nextSizeAxis } } }),
});
console.log('[1/2] pricing_table size axis dimensions stamped.');

const cfg = await (await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.size&select=options`, { headers: H })).json();
const nextOpts = (cfg[0]?.options ?? []).map((o) => SIZE_NOTES[o.slug] ? { ...o, note: SIZE_NOTES[o.slug] } : o);
await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.size`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ options: nextOpts }),
});
console.log('[2/2] Configurator size step dimensions stamped.');

console.log('\nFinal badges:');
for (const o of nextOpts) console.log(`  ${o.slug.toUpperCase()}: ${o.note}`);
