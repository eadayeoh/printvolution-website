// Delete the legacy 'mug' product (Services) — user will recreate it
// as a gift_products row manually. Wipes product_extras, configurator,
// pricing, faqs, mega_menu_items entries, then the products row itself.

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

const PID = 'f9fa8e45-1157-49b6-917a-e57c7bc3718c';

async function del(url, label) {
  const r = await fetch(url, { method: 'DELETE', headers: H });
  if (!r.ok) throw new Error(`${label}: ${r.status} ${await r.text()}`);
  const rows = await r.json();
  console.log(`  ${label}: ${rows.length} row(s) deleted`);
}

await del(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, 'product_extras');
await del(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}`, 'product_configurator');
await del(`${BASE}/rest/v1/product_pricing?product_id=eq.${PID}`, 'product_pricing');
await del(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}`, 'product_faqs');
await del(`${BASE}/rest/v1/mega_menu_items?product_slug=eq.mug`, 'mega_menu_items');
await del(`${BASE}/rest/v1/products?id=eq.${PID}`, 'products');
console.log('\n✓ mug fully removed from services side.');
