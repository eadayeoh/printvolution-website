// Name Card + Luxury Business Card — add sub-option pickers for
// lamination, rounded corners and hotstamp. Prices don't change: all
// variants within each finishing share the same surcharge (the
// existing Yes/No axis still drives the pricing_table lookup).
//
//   Lamination       → Matt | Gloss
//   Rounded Corners  → 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 mm radius
//   Hotstamp         → Gold | Rose Gold | Silver
//
// Implemented as conditional sub-steps (shown via show_if when the
// parent finishing is set to "Yes"). They carry no price_formula so
// the engine treats them as pure metadata — captured on the order,
// zero price impact. This keeps the pricing_table at its current
// ~2,240 / ~960 entries instead of blowing up to 30k+.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
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

const PRODUCTS = [
  { slug: 'name-card',              id: 'e6e1d3ae-b7a9-46c9-b97b-adde24b565fc' },
  { slug: 'luxury-business-card',   id: '93828e8e-de23-4ea2-a3b8-407953271548' },
];

const LAM_TYPES = [
  { slug: 'matt',  label: 'Matt',  note: 'Default · fingerprint-resistant' },
  { slug: 'gloss', label: 'Gloss', note: 'High shine · colour pops' },
];
const RND_RADII = [
  { slug: 'r3',  label: '3mm' },
  { slug: 'r4',  label: '4mm' },
  { slug: 'r5',  label: '5mm' },
  { slug: 'r6',  label: '6mm' },
  { slug: 'r7',  label: '7mm' },
  { slug: 'r8',  label: '8mm' },
  { slug: 'r9',  label: '9mm' },
  { slug: 'r10', label: '10mm' },
];
const HOT_COLORS = [
  { slug: 'gold',      label: 'Gold',      swatch: '#C9A24B', note: 'Traditional · warm metallic' },
  { slug: 'rose_gold', label: 'Rose Gold', swatch: '#B7695A', note: 'Contemporary · pink-warm' },
  { slug: 'silver',    label: 'Silver',    swatch: '#BCBCBC', note: 'Cool · high-contrast' },
];

for (const p of PRODUCTS) {
  console.log(`\n=== ${p.slug} ===`);

  // Fetch current configurator to pick up the existing step order
  const cfgRes = await fetch(
    `${BASE}/rest/v1/product_configurator?product_id=eq.${p.id}&order=step_order.asc&select=*`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  );
  const existing = await cfgRes.json();
  const existingIds = new Set(existing.map((s) => s.step_id));

  // Skip if sub-steps already exist (idempotent)
  if (existingIds.has('lam_type') && existingIds.has('rnd_radius') && existingIds.has('hot_color')) {
    console.log('  sub-steps already exist — skipping insert');
    continue;
  }

  // Delete any partial remnants so we can re-insert cleanly
  await fetch(
    `${BASE}/rest/v1/product_configurator?product_id=eq.${p.id}&step_id=in.(lam_type,rnd_radius,hot_color)`,
    { method: 'DELETE', headers: H },
  );

  // step_order is an int column, so we renumber in whole integers.
  // Target ordering after the patch:
  //   0 material
  //   1 lam          2 lam_type (show_if lam=yes)
  //   3 rnd          4 rnd_radius (show_if rnd=yes)
  //   5 hot          6 hot_color  (show_if hot=yes)
  //   7 suv
  //   8 die
  //   (names, if present)
  //   (qty)
  const targetOrder = {
    material: 0,
    lam: 1,
    lam_type: 2,
    rnd: 3,
    rnd_radius: 4,
    hot: 5,
    hot_color: 6,
    suv: 7,
    die: 8,
  };
  let next = 9;
  for (const s of existing) {
    if (targetOrder[s.step_id] == null) {
      // Non-finishing steps (size, size_custom, names, qty, etc.) go to
      // the end in their existing order.
      targetOrder[s.step_id] = next++;
    }
  }

  // Bump existing rows to their new step_order if it changed.
  // Two-phase to avoid unique collisions: first shift everyone far out
  // of the way, then assign final values.
  for (const s of existing) {
    const want = targetOrder[s.step_id];
    if (want !== s.step_order) {
      const bumpRes = await fetch(
        `${BASE}/rest/v1/product_configurator?id=eq.${s.id}`,
        {
          method: 'PATCH',
          headers: H,
          body: JSON.stringify({ step_order: s.step_order + 100 }),
        },
      );
      if (!bumpRes.ok) throw new Error(`bump ${s.step_id}: ${await bumpRes.text()}`);
    }
  }
  for (const s of existing) {
    const want = targetOrder[s.step_id];
    if (want !== s.step_order) {
      const setRes = await fetch(
        `${BASE}/rest/v1/product_configurator?id=eq.${s.id}`,
        {
          method: 'PATCH',
          headers: H,
          body: JSON.stringify({ step_order: want }),
        },
      );
      if (!setRes.ok) throw new Error(`set ${s.step_id}: ${await setRes.text()}`);
    }
  }

  const subSteps = [
    {
      product_id: p.id,
      step_id: 'lam_type',
      step_order: targetOrder.lam_type,
      label: 'Lamination Finish',
      type: 'swatch',
      required: true,
      options: LAM_TYPES,
      show_if: { step: 'lam', value: 'yes' },
      step_config: null,
    },
    {
      product_id: p.id,
      step_id: 'rnd_radius',
      step_order: targetOrder.rnd_radius,
      label: 'Corner Radius',
      type: 'select',
      required: true,
      options: RND_RADII,
      show_if: { step: 'rnd', value: 'yes' },
      step_config: null,
    },
    {
      product_id: p.id,
      step_id: 'hot_color',
      step_order: targetOrder.hot_color,
      label: 'Hotstamp Colour',
      type: 'swatch',
      required: true,
      options: HOT_COLORS,
      show_if: { step: 'hot', value: 'yes' },
      step_config: null,
    },
  ];

  const insRes = await fetch(`${BASE}/rest/v1/product_configurator`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify(subSteps),
  });
  if (!insRes.ok) throw new Error(`INSERT sub-steps for ${p.slug}: ${insRes.status} ${await insRes.text()}`);
  console.log(`  ✓ inserted 3 sub-steps (lam_type, rnd_radius, hot_color)`);

  // Sanity check — show the new configurator ordering
  const verify = await fetch(
    `${BASE}/rest/v1/product_configurator?product_id=eq.${p.id}&order=step_order.asc&select=step_id,step_order,label,show_if`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  );
  const all = await verify.json();
  for (const s of all) {
    const cond = s.show_if ? ` (show_if: ${JSON.stringify(s.show_if)})` : '';
    console.log(`    ${String(s.step_order).padStart(5)}  ${s.step_id.padEnd(12)} ${s.label}${cond}`);
  }
}

console.log('\nDone. Variants are metadata-only — prices unchanged.');
