// Surgical patch: stickers pricing_table.qty_mode = per_unit_at_tier_rate.
// Typed qty now multiplies the tier's per-sheet rate (e.g. 7 sheets at tier
// 1 rate $15/sheet = $105) instead of returning the tier's total. Leaves
// prices and qty_tiers untouched.

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

const PID = 'adb6bb6d-63d0-41c2-8908-64e64541ef04';

async function main() {
  const [p] = await (await fetch(
    `${BASE}/rest/v1/products?id=eq.${PID}&select=pricing_table`,
    { headers: H },
  )).json();
  if (!p?.pricing_table) throw new Error('no pricing_table on stickers');

  const next = { ...p.pricing_table, qty_mode: 'per_unit_at_tier_rate' };

  const res = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ pricing_table: next }),
  });
  if (!res.ok) throw new Error(`PATCH: ${res.status} ${await res.text()}`);
  console.log('✓ stickers.pricing_table.qty_mode = per_unit_at_tier_rate');
}

main().catch((e) => { console.error(e); process.exit(1); });
