// Surgical patch for PVC Canvas: updates ONLY the price_formula on
// whichever Finishing options currently exist + the qty step note.
// Does NOT rebuild the configurator, so:
//   - options the admin has deleted stay deleted
//   - images + labels + option order stay as admin left them
//   - new options the admin added stay as-is
//
// Run this instead of apply-pvc-canvas-pricing.mjs when the only thing
// that has changed is the formula math.

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

// No min fee, no floor. width × height × 100 / 93025 × 3.50 is the
// area cost (cm² → mm² × sqft rate); eyelets × 3 adds $3 per eyelet.
const baseFormula = 'width * height * 100 / 93025 * 3.50 + eyelets * 3';
const standardFormula = `(${baseFormula}) * qty`;
const polesFormula = `((${baseFormula}) + 15) * qty`;

// Only patch options matching these slugs. Any other slug the admin has
// added (or left in place) is untouched. 'poles' is the only one that
// carries the +$15/pc pole surcharge.
const FORMULA_BY_SLUG = {
  eyelets: standardFormula,
  hemmed: standardFormula,
  poles: polesFormula,
};

// One-off correction: my earlier full-rebuild apply script wrongly
// restored 'hemmed' (Hemmed + Eyelets), which the admin had deleted
// via the product editor. Drop it again as a one-off. To keep any
// other options untouched, this runs ONCE.
const DROP_SLUGS_ONCE = new Set(['hemmed']);

try {
  const [prod] = await sql`select id from public.products where slug='pvc-canvas'`;
  if (!prod) throw new Error('pvc-canvas not found');

  // Read current finishing options and patch just the formula.
  const [fin] = await sql`
    select options from public.product_configurator
    where product_id = ${prod.id} and step_id = 'finishing'
  `;
  if (!fin) {
    console.log('! no finishing step — skipping (nothing to patch)');
  } else {
    const existing = Array.isArray(fin.options) ? fin.options : [];
    const afterDrop = existing.filter((o) => !DROP_SLUGS_ONCE.has(o.slug));
    const dropped = existing.length - afterDrop.length;
    const patched = afterDrop.map((o) => {
      const newFormula = FORMULA_BY_SLUG[o.slug];
      if (newFormula && o.price_formula !== newFormula) {
        return { ...o, price_formula: newFormula };
      }
      return o;
    });
    await sql`
      update public.product_configurator
      set options = ${sql.json(patched)}
      where product_id = ${prod.id} and step_id = 'finishing'
    `;
    if (dropped > 0) {
      console.log(`✓ removed ${dropped} option(s) previously restored by apply-script: ${[...DROP_SLUGS_ONCE].join(', ')}`);
    }
    console.log(`✓ patched formula on ${patched.length} finishing option(s):`);
    for (const o of patched) console.log(`   - ${o.slug}: ${o.price_formula}`);
  }

  // Patch the qty step note too (just the note; presets/min preserved).
  const [q] = await sql`
    select step_config from public.product_configurator
    where product_id = ${prod.id} and step_id = 'qty'
  `;
  if (q) {
    const cfg = q.step_config ?? {};
    const nextNote =
      'Price scales with canvas area and eyelet count — type the size above to see your total.';
    if (cfg.note !== nextNote) {
      const nextCfg = { ...cfg, note: nextNote };
      await sql`
        update public.product_configurator
        set step_config = ${sql.json(nextCfg)}
        where product_id = ${prod.id} and step_id = 'qty'
      `;
      console.log(`✓ updated qty note`);
    } else {
      console.log(`✓ qty note already current`);
    }
  }
} finally {
  await sql.end();
}
