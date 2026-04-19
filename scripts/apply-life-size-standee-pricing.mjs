// Life Size Standee — formula-driven pricing (no pricing_table).
//
//   Height      — 160cm (S$120/pc) or 180cm (S$150/pc) · per-unit flat
//   Finish      — Matt / Gloss · included (no charge)
//   Volume disc — single auto-selected option: 5% off the whole line
//                 at qty 5 and above (placed LAST so it sees the full
//                 base from Height × Qty).
//   Quantity    — integer, min 1, price scales linearly.
//
// Was mis-configured: the admin had put the bulk-discount formula
// directly on the Height options, which meant there was no base price
// for the discount to reduce — product page kept falling back to the
// legacy matrix min ($120 "FROM") instead of computing a real total.

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

// Bulk-% discount formula — matches the admin formula-builder preset
// for `percent_bulk_discount`. -base × fraction × step-indicator.
// The step-indicator is 0 below threshold, 1 at/above threshold.
function bulkDiscountFormula({ percent, threshold }) {
  const p = Math.max(0, Number(percent || 0));
  const t = Math.max(1, Math.floor(Number(threshold || 1)));
  if (p <= 0) return '0';
  const shift = t - 1;
  const frac = p / 100;
  return `-base * ${frac} * Math.min(1, Math.max(0, qty - ${shift}))`;
}

const heightAxis = [
  { slug: '160', label: '160cm (5\'3")', note: 'Standard',   price_formula: 'qty * 120' },
  { slug: '180', label: '180cm (5\'11")',                     price_formula: 'qty * 150' },
];

const finishAxis = [
  { slug: 'matt',  label: 'Matt Lamination',  note: 'Included', price_formula: '0' },
  { slug: 'gloss', label: 'Gloss Lamination', note: 'Included', price_formula: '0' },
];

// Single-option step so the discount is always-on once qty hits the
// threshold. Admin can re-edit the % / threshold later via the editor.
const volumeDiscountAxis = [
  {
    slug: 'auto',
    label: 'Auto · 5% off at qty 5+',
    price_formula: bulkDiscountFormula({ percent: 5, threshold: 5 }),
  },
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

  const mergedHeight   = mergeOptionImages(heightAxis,          existingByStep.get('height'));
  const mergedFinish   = mergeOptionImages(finishAxis,          existingByStep.get('finish'));
  const mergedDiscount = mergeOptionImages(volumeDiscountAxis,  existingByStep.get('volume_discount'));

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
        ${sql.json({ presets: [1, 2, 5, 10, 20], min: 1, step: 1, note: 'Order 5 or more to auto-unlock the 5% volume discount.' })}
      ),
      (
        ${prod.id}, 'volume_discount', 3, 'Volume discount', 'swatch', true,
        ${sql.json(mergedDiscount)},
        null,
        ${sql.json({ note: 'Applied automatically when quantity is 5 or more.' })}
      )
  `;
  console.log('✓ configurator rebuilt — Height / Finish / Quantity / Volume discount');

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
