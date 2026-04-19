// Round PVC Canvas per-piece area price UP to the next 10-cent
// increment (e.g., 33.86 → 33.90). Applied on the Material (area)
// formula so the rounded per-piece value flows through to the final
// line total × qty.
//
// New Material formula:
//   Math.ceil(Math.max(15, width * height / 93025 * 3.50) * 10) / 10 * qty
//
// ceil(x * 10) / 10 = round up to next 0.10.
// Math.max(15, ...) keeps the $15 per-piece floor.
// Surgical — only the material step's pvc option formula is touched.

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

const MATERIAL_FORMULA =
  'Math.ceil(Math.max(15, width * height / 93025 * 3.50) * 10) / 10 * qty';

try {
  const [prod] = await sql`select id from public.products where slug='pvc-canvas'`;
  if (!prod) throw new Error('pvc-canvas not found');

  const [mat] = await sql`
    select options from public.product_configurator
    where product_id = ${prod.id} and step_id = 'material'
  `;
  if (!mat) throw new Error('material step missing');

  const opts = Array.isArray(mat.options) ? mat.options : [];
  const patched = opts.map((o) =>
    o.slug === 'pvc' && o.price_formula !== MATERIAL_FORMULA
      ? { ...o, price_formula: MATERIAL_FORMULA }
      : o
  );
  await sql`
    update public.product_configurator
    set options = ${sql.json(patched)}
    where product_id = ${prod.id} and step_id = 'material'
  `;
  console.log('✓ Material formula updated →', MATERIAL_FORMULA);

  // Sample
  function area(w, h) { return w * h / 93025 * 3.50; }
  function ceil10(x) { return Math.ceil(x * 10) / 10; }
  function perPiece(w, h, e, poles) {
    return ceil10(Math.max(15, area(w, h))) + e * 3 + (poles ? 15 : 0);
  }
  const samples = [
    [300, 300, 0, false, '300×300 mm'],
    [600, 400, 0, false, '600×400 mm'],
    [900, 900, 4, false, '900×900 mm, 4 eyelets'],
    [1000, 1000, 0, false, '1m × 1m'],
    [2000, 1000, 4, false, '2m × 1m, 4 eyelets'],
    [3000, 2000, 8, false, '3m × 2m, 8 eyelets'],
  ];
  console.log('\nsample per-piece (SGD):');
  for (const [w, h, e, poles, label] of samples) {
    const raw = area(w, h);
    const rounded = ceil10(Math.max(15, raw));
    const pp = perPiece(w, h, e, poles);
    console.log(`  ${label}: raw area=${raw.toFixed(4)} → rounded=${rounded.toFixed(2)} → per-piece=$${pp.toFixed(2)}`);
  }
} finally {
  await sql.end();
}
