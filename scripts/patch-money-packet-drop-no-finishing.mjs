// Money Packet: remove "No Finishing" as a finish option entirely.
// Soft Touch is now the minimum finish tier. Trims:
//   • pricing_table.axes.finish — drop the 'none' option
//   • pricing_table.prices — drop every :none: keyed entry
//   • product_configurator.finish step — drop 'none' from options
// Content rewrite is in a separate follow-up patch.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };

const PID = 'e7b979d0-d327-439a-9e4b-ae4abefe755b';

const [row] = await (await fetch(`${BASE}/rest/v1/products?id=eq.${PID}&select=pricing_table`, { headers: H })).json();
if (!row?.pricing_table) throw new Error('no pricing_table on money packet');
const pt = row.pricing_table;

const nextFinish = (pt.axes?.finish ?? []).filter((o) => o.slug !== 'none');
const keptPrices = {};
let pruned = 0;
for (const [k, v] of Object.entries(pt.prices ?? {})) {
  // key shape: <orientation>:<finish>:<qty>
  const parts = k.split(':');
  const finishSlug = parts[1];
  if (finishSlug === 'none') { pruned++; continue; }
  keptPrices[k] = v;
}
const nextPt = { ...pt, axes: { ...pt.axes, finish: nextFinish }, prices: keptPrices };

const r1 = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ pricing_table: nextPt }),
});
if (!r1.ok) throw new Error(`PATCH pricing_table: ${r1.status} ${await r1.text()}`);
console.log(`[1/2] pricing_table trimmed: finish has ${nextFinish.length} options; pruned ${pruned} 'none' price entries.`);

// Drop 'none' from the configurator step's options list too.
const cfg = await (await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.finish&select=options`,
  { headers: H },
)).json();
const currentOpts = cfg[0]?.options ?? [];
const nextOpts = currentOpts.filter((o) => o.slug !== 'none');
const r2 = await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.finish`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ options: nextOpts }),
});
if (!r2.ok) throw new Error(`PATCH finish step: ${r2.status} ${await r2.text()}`);
console.log(`[2/2] finish step options: ${currentOpts.length} → ${nextOpts.length} ('none' removed).`);
