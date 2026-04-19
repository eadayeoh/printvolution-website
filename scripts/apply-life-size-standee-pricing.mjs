// Life Size Standee — formula-driven pricing (no pricing_table).
//
//   Height      — 160cm (S$120/pc) or 180cm (S$150/pc) · per-unit price
//                 WITH a built-in 5% bulk discount at qty 5+. The discount
//                 is baked into each Height option's formula via the
//                 `per_unit_with_bulk_discount` preset — no separate
//                 discount step in the configurator.
//   Finish      — Matt / Gloss · included (no charge)
//   Quantity    — integer, min 1, price scales linearly.

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

// Merge admin-uploaded option.image_url values from the existing
// configurator rows into the rebuilt option list (keyed by slug per
// step). Without this, re-running the script would wipe any images
// the admin has set through the editor.
function mergeOptionImages(newOptions, existingOptions) {
  if (!Array.isArray(existingOptions) || existingOptions.length === 0) return newOptions;
  const imgBySlug = new Map();
  for (const o of existingOptions) {
    if (o?.slug && typeof o.image_url === 'string' && o.image_url) imgBySlug.set(o.slug, o.image_url);
  }
  return newOptions.map((o) => {
    const existing = imgBySlug.get(o.slug);
    return existing ? { ...o, image_url: existing } : o;
  });
}

// Per-unit-with-bulk-discount formula — matches the admin
// formula-builder preset `per_unit_with_bulk_discount`. Emits:
//   qty * PRICE * (1 - FRAC * Math.min(1, Math.max(0, qty - SHIFT)))
// which is PRICE/pc below threshold, (PRICE × (1 - FRAC))/pc at/above.
function perUnitWithBulkDiscountFormula({ price, percent, threshold }) {
  const p = Math.max(0, Number(price || 0));
  const pct = Math.max(0, Number(percent || 0));
  const t = Math.max(1, Math.floor(Number(threshold || 1)));
  if (p <= 0) return '0';
  if (pct <= 0) return `qty * ${p}`;
  const shift = t - 1;
  const frac = pct / 100;
  return `qty * ${p} * (1 - ${frac} * Math.min(1, Math.max(0, qty - ${shift})))`;
}

const heightAxis = [
  {
    slug: '160',
    label: '160cm (5\'3")',
    note: 'Standard · 5% off at qty 5+',
    price_formula: perUnitWithBulkDiscountFormula({ price: 120, percent: 5, threshold: 5 }),
  },
  {
    slug: '180',
    label: '180cm (5\'11")',
    note: '5% off at qty 5+',
    price_formula: perUnitWithBulkDiscountFormula({ price: 150, percent: 5, threshold: 5 }),
  },
];

const finishAxis = [
  { slug: 'matt',  label: 'Matt Lamination',  note: 'Included', price_formula: '0' },
  { slug: 'gloss', label: 'Gloss Lamination', note: 'Included', price_formula: '0' },
];

try {
  const [prod] = await sql`select id from public.products where slug='life-size-standee'`;
  if (!prod) throw new Error('life-size-standee product not found');
  console.log('✓ found life-size-standee', prod.id);

  // Snapshot existing options to preserve admin-uploaded images.
  const existingCfg = await sql`
    select step_id, options from public.product_configurator where product_id = ${prod.id}
  `;
  const existingByStep = new Map();
  for (const row of existingCfg) existingByStep.set(row.step_id, row.options);

  const mergedHeight = mergeOptionImages(heightAxis, existingByStep.get('height'));
  const mergedFinish = mergeOptionImages(finishAxis, existingByStep.get('finish'));

  await sql`delete from public.product_configurator where product_id = ${prod.id}`;
  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${prod.id}, 'height', 0, 'Height', 'swatch', true,
        ${sql.json(mergedHeight)},
        null, null
      ),
      (
        ${prod.id}, 'finish', 1, 'Finish', 'swatch', true,
        ${sql.json(mergedFinish)},
        null, null
      ),
      (
        ${prod.id}, 'qty', 2, 'Quantity', 'qty', true,
        '[]'::jsonb, null,
        ${sql.json({ presets: [1, 2, 5, 10, 20], min: 1, step: 1, note: 'Order 5 or more to unlock the 5% bulk discount built into the Height price.' })}
      )
  `;
  console.log('✓ configurator rebuilt — Height / Finish / Quantity (discount baked into Height options)');

  // Drop the legacy matrix so it stops feeding the FROM fallback.
  await sql`delete from public.product_pricing where product_id = ${prod.id}`;
  console.log('✓ legacy product_pricing dropped');

  // Show the price math so the user can eyeball it.
  const table = [
    ['160', 1,  1 * 120],
    ['160', 4,  4 * 120],
    ['160', 5,  5 * 120 * 0.95],
    ['160', 10, 10 * 120 * 0.95],
    ['180', 1,  1 * 150],
    ['180', 5,  5 * 150 * 0.95],
    ['180', 10, 10 * 150 * 0.95],
  ];
  console.log('\nsample totals (SGD, after discount):');
  for (const [h, q, t] of table) {
    const dis = q >= 5 ? ' (−5%)' : '';
    console.log(`  ${h}cm × ${q} pc${q > 1 ? 's' : ''}: $${t.toFixed(2)}${dis}`);
  }
} finally {
  await sql.end();
}
