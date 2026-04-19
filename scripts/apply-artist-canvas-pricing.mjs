// Artist Canvas — additive-dimension formula pricing.
//
// Supplier table: per-dimension price = $20 + 0.5 × dimension_cm
//   20cm = $30 · 30cm = $35 · ... · 100cm = $70
// Total per piece = price(width) + price(height)
//            = (20 + 0.5 × width_cm) + (20 + 0.5 × height_cm)
//            = 40 + 0.5 × (width_cm + height_cm)
//
// Using mm inputs (for consistency with PVC Canvas), cm = mm / 10, so:
//   per_piece = 40 + (width_mm + height_mm) / 20
//
// User spec: no finishing step, no quantity presets, no tabled
// volume ladder — just width, height, and qty = 1+.
//
// First-time clean rebuild: legacy matrix + old swatch-based Size /
// Finish steps are replaced. Full DELETE + INSERT is OK here because
// the old option slugs (8x10, 12x16, gloss, satin) cannot carry over
// to the new Material / Width / Height / Qty structure.

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

// Material (swatch) — one option carrying the additive dimensional
// formula. Single option keeps the visual step in place so customers
// see "what this is" before dimensions.
const MATERIAL_OPTION = {
  slug: 'framed',
  label: 'Artist Canvas + Frame',
  note: 'Canvas stretched on wooden frame, ready to hang',
  price_formula: '(40 + (width + height) / 20) * qty',
};

try {
  const [prod] = await sql`select id from public.products where slug='artist-canvas'`;
  if (!prod) throw new Error('artist-canvas product not found');
  console.log('✓ found artist-canvas', prod.id);

  // Clean rebuild — old option slugs (8x10, 12x16, gloss, satin) cannot
  // migrate to the new Width / Height / Qty structure.
  await sql`delete from public.product_configurator where product_id = ${prod.id}`;
  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${prod.id}, 'material', 0, 'Material', 'swatch', true,
        ${sql.json([MATERIAL_OPTION])},
        null, null
      ),
      (
        ${prod.id}, 'width', 1, 'Width (mm)', 'number', true,
        '[]'::jsonb, null,
        ${sql.json({ min: 200, note: 'Enter in millimetres. Minimum 200mm (20cm). For example 500 = 50cm.' })}
      ),
      (
        ${prod.id}, 'height', 2, 'Height (mm)', 'number', true,
        '[]'::jsonb, null,
        ${sql.json({ min: 200, note: 'Enter in millimetres. Minimum 200mm (20cm). For example 500 = 50cm.' })}
      ),
      (
        ${prod.id}, 'qty', 3, 'Quantity', 'qty', true,
        '[]'::jsonb, null,
        ${sql.json({ min: 1, step: 1, note: 'Price per piece × quantity. No volume discount.', presets: [] })}
      )
  `;
  console.log('✓ configurator rebuilt — Material / Width / Height / Quantity');

  await sql`update public.products set pricing_table = null, pricing_compute = null where id = ${prod.id}`;
  await sql`delete from public.product_pricing where product_id = ${prod.id}`;
  console.log('✓ legacy pricing_table / pricing_matrix dropped');

  // Sanity: width_cm + height_cm → price
  function perPiece(w_mm, h_mm) { return 40 + (w_mm + h_mm) / 20; }
  const samples = [
    [200, 300, '20 × 30 cm (user example: $30 + $35)'],
    [200, 200, '20 × 20 cm'],
    [400, 500, '40 × 50 cm'],
    [600, 900, '60 × 90 cm'],
    [1000, 1000, '100 × 100 cm'],
  ];
  console.log('\nsample per-piece (SGD):');
  for (const [w, h, label] of samples) {
    console.log(`  ${label}: $${perPiece(w, h).toFixed(2)}`);
  }
} finally {
  await sql.end();
}
