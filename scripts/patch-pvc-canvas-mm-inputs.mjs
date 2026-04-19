// Switch PVC Canvas Width + Height to millimetre inputs so the
// pricing formula uses the user-supplied shape literally:
//   Math.max(15, width * height / 93025 * 3.50) * qty
// Previously the inputs were cm and the formula carried a * 100 factor
// to convert cm² → mm². The math was equivalent but didn't match the
// source formula. Surgical — only width / height labels + min +
// step_config.note + the Material formula are touched.

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

const MATERIAL_FORMULA = 'Math.max(15, width * height / 93025 * 3.50) * qty';

try {
  const [prod] = await sql`select id from public.products where slug='pvc-canvas'`;
  if (!prod) throw new Error('pvc-canvas not found');

  // 1. Width → mm
  await sql`
    update public.product_configurator
    set label = 'Width (mm)',
        step_config = ${sql.json({ min: 300, note: 'Enter in millimetres. Minimum 300mm (30cm). For example 1000 = 1m.' })}
    where product_id = ${prod.id} and step_id = 'width'
  `;
  console.log('✓ width → mm');

  // 2. Height → mm
  await sql`
    update public.product_configurator
    set label = 'Height (mm)',
        step_config = ${sql.json({ min: 300, note: 'Enter in millimetres. Minimum 300mm (30cm). For example 1000 = 1m.' })}
    where product_id = ${prod.id} and step_id = 'height'
  `;
  console.log('✓ height → mm');

  // 3. Patch the Material option formula (surgical — only options with
  //    slug='pvc' are touched; other options the admin may have added
  //    are untouched).
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
  console.log('✓ Material formula updated → ' + MATERIAL_FORMULA);

  // Sample prices with mm inputs
  function area(w_mm, h_mm) { return w_mm * h_mm / 93025 * 3.50; }
  function perPiece(w, h, e, poles = false) {
    return Math.max(15, area(w, h)) + e * 3 + (poles ? 15 : 0);
  }
  const samples = [
    [300, 300, 0, false, '300×300mm (30cm square), no eyelets'],
    [600, 400, 4, false, '600×400mm, 4 eyelets'],
    [1000, 1000, 0, false, '1m × 1m, no eyelets'],
    [1000, 1000, 4, false, '1m × 1m, 4 eyelets'],
    [2000, 1000, 4, true, '2m × 1m + poles + 4 eyelets'],
    [3000, 2000, 8, false, '3m × 2m photocall, 8 eyelets'],
    [4000, 1000, 5, false, '4m × 1m long banner, 5 eyelets'],
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
