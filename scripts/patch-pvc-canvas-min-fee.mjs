// Re-adds the $15 per-piece minimum fee to PVC Canvas — applied to the
// Material (area) formula so that a tiny canvas still lands at $15/pc.
// Eyelets ($3 each) and Wooden Poles (+$15/pc) are charged on top.
//
// Surgical: only touches the Material option's price_formula. All other
// steps + options are left untouched.

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

// Material (area) formula with $15 per-piece floor.
// max($15, width × height × 100 / 93025 × $3.50) × qty
const MATERIAL_FORMULA = 'Math.max(15, width * height * 100 / 93025 * 3.50) * qty';

try {
  const [prod] = await sql`select id from public.products where slug='pvc-canvas'`;
  if (!prod) throw new Error('pvc-canvas not found');

  const [mat] = await sql`
    select options from public.product_configurator
    where product_id = ${prod.id} and step_id = 'material'
  `;
  if (!mat) throw new Error('material step missing — run patch-pvc-canvas-material-step.mjs first');

  const existing = Array.isArray(mat.options) ? mat.options : [];
  const patched = existing.map((o) =>
    o.slug === 'pvc' && o.price_formula !== MATERIAL_FORMULA
      ? { ...o, price_formula: MATERIAL_FORMULA, note: 'Waterproof canvas — area-priced with a S$15 per-piece floor' }
      : o
  );

  await sql`
    update public.product_configurator
    set options = ${sql.json(patched)}
    where product_id = ${prod.id} and step_id = 'material'
  `;
  console.log(`✓ patched Material formula — $15 per-piece floor applied`);
  for (const o of patched) console.log(`   - ${o.slug} "${o.label}" → ${o.price_formula}`);

  // Sample price check (per piece)
  function area(w, h) { return w * h * 100 / 93025 * 3.5; }
  function perPiece(w, h, e, poles = false) {
    return Math.max(15, area(w, h)) + e * 3 + (poles ? 15 : 0);
  }
  const samples = [
    [30, 30, 0, false, '30×30cm, no eyelets'],
    [50, 50, 0, false, '50×50cm, no eyelets'],
    [100, 100, 0, false, '1m × 1m, no eyelets'],
    [100, 100, 4, false, '1m × 1m, 4 eyelets'],
    [60, 40, 4, false, '60×40cm, 4 eyelets'],
    [200, 100, 4, true, '2m × 1m + poles + 4 eyelets'],
  ];
  console.log('\nsample per-piece (SGD):');
  for (const [w, h, e, poles, label] of samples) {
    const a = area(w, h).toFixed(2);
    const p = perPiece(w, h, e, poles).toFixed(2);
    const floored = area(w, h) < 15 ? ' ← floored' : '';
    console.log(`  ${label}: area=$${a}${floored} · total=$${p}`);
  }
} finally {
  await sql.end();
}
