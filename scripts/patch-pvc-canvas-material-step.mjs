// Restructures PVC Canvas pricing so the dimensional (area) formula
// lives on a new Material step, separate from eyelet and finishing
// costs. Surgical — shifts existing step_order values and updates
// formulas in place; does NOT delete and re-insert the whole
// configurator (so admin reorderings / images / label edits survive).
//
// New composition:
//   Material   → "PVC Canvas"               width*height*100/93025*3.50*qty   (area price)
//   Width      → number input (cm)
//   Height     → number input (cm)
//   Eyelets    → number input (count)
//   Finishing  → "Eyelets"                  eyelets*3*qty                     (per-eyelet × count)
//                "Wooden Poles + Eyelets"   (eyelets*3 + 15)*qty              (per-eyelet + $15/pc poles)
//   Quantity   → qty stepper
//
// Total = sum of every step's formula at current qty / cfg.

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

// ── New formulas ──────────────────────────────────────────────
const AREA_FORMULA      = 'width * height * 100 / 93025 * 3.50 * qty';
const EYELETS_FORMULA   = 'eyelets * 3 * qty';
const POLES_FORMULA     = '(eyelets * 3 + 15) * qty';

const MATERIAL_OPTION = {
  slug: 'pvc',
  label: 'PVC Canvas',
  note: 'Waterproof canvas — area-priced by width × height',
  price_formula: AREA_FORMULA,
};

// Map old finishing formulas → new decoupled ones by slug.
const NEW_FINISHING_FORMULA_BY_SLUG = {
  eyelets: EYELETS_FORMULA,
  poles: POLES_FORMULA,
};

try {
  const [prod] = await sql`select id from public.products where slug='pvc-canvas'`;
  if (!prod) throw new Error('pvc-canvas not found');

  // 1. See if a Material step already exists. If yes, update its option
  //    formula. If not, insert it at step_order = 0 after shifting the
  //    others down by one.
  const [existingMaterial] = await sql`
    select step_id, options, step_order from public.product_configurator
    where product_id = ${prod.id} and step_id = 'material'
  `;

  if (existingMaterial) {
    // Patch the existing Material option's formula in place (preserve
    // any admin-customised label / image / additional options).
    const opts = Array.isArray(existingMaterial.options) ? existingMaterial.options : [];
    const patchedOpts = opts.length > 0
      ? opts.map((o) => (o.slug === 'pvc' ? { ...o, price_formula: AREA_FORMULA } : o))
      : [MATERIAL_OPTION];
    // Ensure at least one option with slug 'pvc' exists.
    if (!patchedOpts.some((o) => o.slug === 'pvc')) patchedOpts.unshift(MATERIAL_OPTION);
    await sql`
      update public.product_configurator
      set options = ${sql.json(patchedOpts)}
      where product_id = ${prod.id} and step_id = 'material'
    `;
    console.log(`✓ existing Material step patched (${patchedOpts.length} option(s))`);
  } else {
    // Shift the other steps down by one to make room at step_order=0.
    // Postgres unique (product_id, step_order) — shift in a single
    // UPDATE to avoid mid-shift collisions.
    await sql`
      update public.product_configurator
      set step_order = step_order + 100
      where product_id = ${prod.id}
    `;
    await sql`
      update public.product_configurator
      set step_order = step_order - 99
      where product_id = ${prod.id}
    `;
    // Net effect: every existing step is now at old+1.
    await sql`
      insert into public.product_configurator
        (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
      values (
        ${prod.id}, 'material', 0, 'Material', 'swatch', true,
        ${sql.json([MATERIAL_OPTION])},
        null, null
      )
    `;
    console.log('✓ Material step inserted at step_order = 0');
  }

  // 2. Update Finishing options: strip the dimensional part, keep only
  //    eyelet × $3 per pc + finishing surcharge. Only slugs in the map
  //    are patched; any admin-added option is left alone.
  const [fin] = await sql`
    select options from public.product_configurator
    where product_id = ${prod.id} and step_id = 'finishing'
  `;
  if (fin) {
    const existing = Array.isArray(fin.options) ? fin.options : [];
    const patched = existing.map((o) => {
      const nf = NEW_FINISHING_FORMULA_BY_SLUG[o.slug];
      return nf && o.price_formula !== nf ? { ...o, price_formula: nf } : o;
    });
    await sql`
      update public.product_configurator
      set options = ${sql.json(patched)}
      where product_id = ${prod.id} and step_id = 'finishing'
    `;
    console.log(`✓ Finishing options patched — dimensional formula stripped, per-eyelet + surcharge only:`);
    for (const o of patched) console.log(`   - ${o.slug} "${o.label}" → ${o.price_formula}`);
  }

  // 3. Sanity — enumerate the whole configurator in final order.
  const cfg = await sql`
    select step_id, step_order, label, type
    from public.product_configurator
    where product_id = ${prod.id}
    order by step_order
  `;
  console.log('\nfinal step order:');
  for (const s of cfg) console.log(`  [${s.step_order}] ${s.step_id} (${s.type}) — ${s.label}`);
} finally {
  await sql.end();
}
