// Paper Bag rope colours — strip the marketing notes
// ("Warm tan · premium retail" etc). The label + swatch already
// communicate the colour; the extra copy was noise.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };
const PID = 'f682c1d6-f6e7-4d36-afac-73b859ddb264';

const cfg = await (await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.rope&select=options`,
  { headers: H },
)).json();
const current = cfg[0]?.options ?? [];
if (current.length === 0) {
  console.log('No rope step found — nothing to do.');
  process.exit(0);
}
const nextOpts = current.map((o) => ({ ...o, note: null }));

const res = await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.rope`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ options: nextOpts }),
});
if (!res.ok) throw new Error(`PATCH: ${res.status} ${await res.text()}`);
console.log(`✓ Stripped rope notes on ${nextOpts.length} options.`);
