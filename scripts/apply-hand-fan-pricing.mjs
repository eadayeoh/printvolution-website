// Hand fan — supplier-sheet pricing (not in pvpricelist).
//
// Three variants bundled from the supplier table's "Type" grouping:
//   - synthetic-500      → 500gsm Synthetic Card, 173×175mm, with handle
//                          (Type A on supplier sheet)
//   - art-310-handle     → 310gsm Art Card + Matt Lamination, with handle
//                          (Type B–K — 10 shape templates, same price)
//   - art-310-no-handle  → 310gsm Art Card + Matt Lamination, no handle
//                          (Type L–N — 3 shape templates, same price)
//
// Pricing shown is for the hand fan body + plastic handle without
// assembly. Assembly is a separate fee on request.
//
// Qty tiers differ per variant:
//   - synthetic-500 and art-310-handle: 100, 200, 300, 400, 500, 1000
//   - art-310-no-handle: 100, 200, 300, 400, 500, 1000, 2000, 3000

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = await fs.readFile(path.join(root, '.env.local'), 'utf8');
for (const raw of envFile.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });

const variantAxis = [
  { slug: 'art-310-handle',    label: '310gsm Art Card + Matt Lam · with handle',   note: 'Popular · 10 shapes' },
  { slug: 'art-310-no-handle', label: '310gsm Art Card + Matt Lam · no handle',      note: 'Low-cost · 3 shapes' },
  { slug: 'synthetic-500',     label: '500gsm Synthetic Card · with handle',         note: 'Premium · 173×175mm' },
];

const qtyTiers = [100, 200, 300, 400, 500, 1000, 2000, 3000];

// Supplier prices in $ (RM treated 1:1 as SGD).
const RAW = {
  'synthetic-500': {
    100: 350.50, 200: 437.20, 300: 524.10, 400: 610.90, 500: 722.70, 1000: 1160.90,
  },
  'art-310-handle': {
    100: 235.90, 200: 330.20, 300: 358.50, 400: 405.70, 500: 443.40, 1000: 582.10,
  },
  'art-310-no-handle': {
    100: 216.00, 200: 290.00, 300: 298.00, 400: 325.00, 500: 343.00,
    1000: 382.00, 2000: 637.00, 3000: 918.00,
  },
};

const prices = {};
let priceCount = 0;
for (const [variant, tierMap] of Object.entries(RAW)) {
  for (const [qty, dollars] of Object.entries(tierMap)) {
    prices[`${variant}:${qty}`] = Math.round(dollars * 100);
    priceCount++;
  }
}

const pricingTable = {
  axes: { variant: variantAxis },
  axis_order: ['variant'],
  qty_tiers: qtyTiers,
  prices,
};

try {
  const [prod] = await sql`select id from public.products where slug='hand-fan'`;
  if (!prod) throw new Error('hand-fan product not found');
  console.log('✓ found hand-fan', prod.id);

  await sql`update public.products set pricing_table = ${sql.json(pricingTable)}, pricing_compute = null where id = ${prod.id}`;
  console.log(`✓ pricing_table seeded — ${priceCount} prices across ${variantAxis.length} variants`);

  await sql`delete from public.product_configurator where product_id = ${prod.id}`;
  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${prod.id}, 'variant', 0, 'Material & Handle', 'swatch', true,
        ${sql.json(variantAxis)},
        null, null
      ),
      (
        ${prod.id}, 'qty', 1, 'Quantity', 'qty', true,
        '[]'::jsonb, null,
        ${sql.json({ presets: qtyTiers, min: 100, step: 1, note: 'Supplier tiers — price snaps to nearest tier below.' })}
      )
  `;
  console.log('✓ configurator rebuilt — Variant + Qty (2 steps)');

  // Keep lead_time_days + print_mode (already 7 / Offset); drop legacy
  // product_pricing matrix since pricing_table is authoritative now.
  await sql`delete from public.product_pricing where product_id = ${prod.id}`;
  console.log('✓ legacy product_pricing matrix dropped');

  const [check] = await sql`
    select p.name, p.lead_time_days, p.print_mode,
           jsonb_array_length(p.pricing_table->'qty_tiers') as tiers,
           (select count(*) from jsonb_object_keys(p.pricing_table->'prices')) as price_count
    from public.products p where p.id = ${prod.id}
  `;
  console.log('\nverify:', JSON.stringify(check, null, 2));

  const samples = [
    ['art-310-handle:100', '310gsm Art + Matt Lam w/ handle × 100 pcs'],
    ['art-310-handle:1000', '310gsm Art + Matt Lam w/ handle × 1000 pcs'],
    ['art-310-no-handle:3000', '310gsm Art + Matt Lam no-handle × 3000 pcs'],
    ['synthetic-500:500', '500gsm Synthetic Card × 500 pcs'],
  ];
  console.log('\nsample prices (SGD):');
  for (const [key, label] of samples) {
    const cents = prices[key] ?? 0;
    console.log(`  ${label}: $${(cents / 100).toFixed(2)}`);
  }
} finally {
  await sql.end();
}
