// Money Packet: add a "Pieces per pack" step (5 / 8 / 10) between
// Finishing and Quantity. Display-only — not part of pricing_table
// axis_order, no price_formula on any option, so the customer's pack
// choice doesn't change the total. Qty still = total money packets.

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

// Bail out if the step already exists so the script is idempotent.
const existing = await (await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.pack&select=id`,
  { headers: H },
)).json();
if (existing.length > 0) {
  console.log('· pack step already exists — nothing to do.');
  process.exit(0);
}

// Get current steps so we know how many exist — pack goes between
// 'finish' and 'qty', bumping 'qty' from order 2 to 3.
const current = await (await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&select=step_id,step_order&order=step_order`,
  { headers: H },
)).json();
console.log('Current steps:');
for (const s of current) console.log(`  ${s.step_order}. ${s.step_id}`);

const qtyStep = current.find((s) => s.step_id === 'qty');
if (!qtyStep) throw new Error('no qty step found');

// Bump qty to step_order 3 to make room for pack at 2.
await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.qty`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ step_order: 3 }),
});

const packStep = {
  product_id: PID,
  step_id: 'pack',
  step_order: 2,
  label: 'Pieces per pack',
  type: 'swatch',
  required: true,
  options: [
    { slug: 'pack_5',  label: '5 pieces / pack',  note: 'Small pack — ideal for gifting' },
    { slug: 'pack_8',  label: '8 pieces / pack',  note: 'Standard pack' },
    { slug: 'pack_10', label: '10 pieces / pack', note: 'Bulk pack' },
  ],
  show_if: null,
  step_config: {},
};

const res = await fetch(`${BASE}/rest/v1/product_configurator`, {
  method: 'POST', headers: H, body: JSON.stringify([packStep]),
});
if (!res.ok) throw new Error(`INSERT pack step: ${res.status} ${await res.text()}`);
console.log('\n✓ Pack step inserted (5 / 8 / 10). No price impact — not in pricing_table axis_order.');
