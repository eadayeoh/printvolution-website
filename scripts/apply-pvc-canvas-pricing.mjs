// PVC Canvas — dimensional pricing, eyelets optional, no floor.
//
// Formula (per piece, before quantity):
//   base_sqft = (width_cm * 10) * (height_cm * 10) / 93025   // cm → mm² then ÷ (305²)
//   canvas    = base_sqft * 3.50                             // $3.50 per sq ft
//   eyelets   = eyelets_count * 3                            // $3 per eyelet
//   per_piece = canvas + eyelets                             // no minimum fee; 0 eyelets = $0 eyelet cost
//
// The /93025 constant (305²) is the square-feet conversion from mm².
// Keeping admin width/height in cm (friendly unit) and using
// `* 10 * * 10 = * 100` inside the formula preserves the user's
// "/93025" shape literally while still accepting cm inputs.
//
// Wooden Poles + Eyelets finishing adds $15/pc on top of the base.

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

// Merge admin-uploaded option.image_url values across a rebuild.
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

// Per-piece base — keep identical across all finishing options except
// where a finishing-specific surcharge applies. The formula references
// `width`, `height`, `eyelets` (populated from number-type steps). No
// minimum fee: width=0 / height=0 / eyelets=0 → per_piece = 0.
const baseFormula =
  'width * height * 100 / 93025 * 3.50 + eyelets * 3';

// Standard finishing options share the base formula multiplied by qty.
const standardFormula = `(${baseFormula}) * qty`;
// Wooden poles finishing: base per-piece + $15 per piece for the pole
// hardware, multiplied by qty.
const polesFormula = `((${baseFormula}) + 15) * qty`;

const finishingAxis = [
  {
    slug: 'eyelets',
    label: 'Eyelets',
    note: 'Standard — metal eyelets on the corners',
    price_formula: standardFormula,
  },
  {
    slug: 'hemmed',
    label: 'Hemmed + Eyelets',
    note: 'Folded, stitched edge for durability',
    price_formula: standardFormula,
  },
  {
    slug: 'poles',
    label: 'Wooden Poles + Eyelets',
    note: '+ S$15/pc — top and bottom poles included',
    price_formula: polesFormula,
  },
];

try {
  const [prod] = await sql`select id from public.products where slug='pvc-canvas'`;
  if (!prod) throw new Error('pvc-canvas product not found');
  console.log('✓ found pvc-canvas', prod.id);

  const existingCfg = await sql`
    select step_id, options from public.product_configurator where product_id = ${prod.id}
  `;
  const existingByStep = new Map();
  for (const row of existingCfg) existingByStep.set(row.step_id, row.options);
  const mergedFinishing = mergeOptionImages(finishingAxis, existingByStep.get('finishing'));

  await sql`delete from public.product_configurator where product_id = ${prod.id}`;
  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${prod.id}, 'width', 0, 'Width (cm)', 'number', true,
        '[]'::jsonb, null,
        ${sql.json({ min: 30, note: 'Minimum 30cm. Max ~300cm.' })}
      ),
      (
        ${prod.id}, 'height', 1, 'Height (cm)', 'number', true,
        '[]'::jsonb, null,
        ${sql.json({ min: 30, note: 'Minimum 30cm. Max ~300cm.' })}
      ),
      (
        ${prod.id}, 'eyelets', 2, 'Eyelets', 'number', false,
        '[]'::jsonb, null,
        ${sql.json({ min: 0, note: 'S$3 per eyelet. Leave 0 if none needed.' })}
      ),
      (
        ${prod.id}, 'finishing', 3, 'Finishing', 'swatch', true,
        ${sql.json(mergedFinishing)},
        null, null
      ),
      (
        ${prod.id}, 'qty', 4, 'Quantity', 'qty', true,
        '[]'::jsonb, null,
        ${sql.json({ presets: [1, 2, 5, 10], min: 1, step: 1, note: 'Price scales with canvas area and eyelet count — type the size above to see your total.' })}
      )
  `;
  console.log('✓ configurator rebuilt — Width / Height / Eyelets / Finishing / Quantity');

  // Drop the legacy pricing_table + pricing matrix so the new formula
  // drives price directly (no fromPrice fallback interference).
  await sql`update public.products set pricing_table = null, pricing_compute = null where id = ${prod.id}`;
  await sql`delete from public.product_pricing where product_id = ${prod.id}`;
  console.log('✓ legacy pricing_table / pricing_matrix dropped');

  // Sanity preview — tabulate a few sizes.
  function price(w, h, e, poles = false) {
    const base = w * h * 100 / 93025 * 3.5 + e * 3;
    return poles ? base + 15 : base;
  }
  const samples = [
    [30, 30, 0, false, '30×30cm, no eyelets'],
    [100, 100, 0, false, '1m × 1m, no eyelets'],
    [100, 100, 4, false, '1m × 1m, 4 eyelets'],
    [150, 100, 4, false, '1.5m × 1m, 4 eyelets'],
    [200, 100, 4, true, '2m × 1m with poles'],
    [300, 200, 8, false, '3m × 2m, 8 eyelets'],
  ];
  console.log('\nsample per-piece (SGD):');
  for (const [w, h, e, poles, label] of samples) {
    const p = price(w, h, e, poles);
    console.log(`  ${label}: $${p.toFixed(2)}`);
  }
} finally {
  await sql.end();
}
