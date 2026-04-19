// Flyers — hybrid Digital / Offset configurator.
//
// Digital: existing configurator step formulas stay authoritative
//   (size/sides/paper/lamination/qty). No tier lookup.
// Offset: supplier-accurate pricing_table on Method=Offset combos.
//   Sizes: A5 only for now (A4/DL offset coming later).
//   Papers: 128 / 157 gsm Art Paper · 260 / 310 gsm Art Card.
//   Sides: 4C+0C (single sided) · 4C+4C (double sided).
//
// The calculator now falls through to step formulas when the pricing
// table has no entry for the current combo, so Digital + Offset live
// in one product without fighting each other.

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

// ────────────────────────────────────────────────────────────────────
// Axes (pricing_table)
// ────────────────────────────────────────────────────────────────────
const methodAxis = [
  { slug: 'digital', label: 'Digital' },
  { slug: 'offset',  label: 'Offset' },
];

const sizeOffsetAxis = [
  { slug: 'a5', label: 'A5 (148 × 210mm)' },
];

const paperOffsetAxis = [
  { slug: '128art', label: '128gsm Art Paper' },
  { slug: '157art', label: '157gsm Art Paper' },
  { slug: '260card', label: '260gsm Art Card' },
  { slug: '310card', label: '310gsm Art Card' },
];

const sidesOffsetAxis = [
  { slug: '4c0c', label: 'Single Sided (4C + 0C)' },
  { slug: '4c4c', label: 'Double Sided (4C + 4C)' },
];

// Union of digital + offset tiers (sorted, deduped).
// Digital = [500, 1000, 2000, 5000], offset card = up to 10k,
// offset paper extends to 200k.
const qtyTiers = [
  500, 600, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
  12000, 14000, 16000, 18000, 20000, 40000, 60000, 100000, 200000,
];

// ────────────────────────────────────────────────────────────────────
// Offset prices (RM treated 1:1 as SGD, cents in the table).
// Key: offset:a5:<paper>:<sides>:<qty>
// ────────────────────────────────────────────────────────────────────
const RAW_OFFSET = {
  // 128gsm Art Paper — 16 tiers 600 → 200,000
  '128art:4c0c': {
    600: 68.40,   1000: 82.80,   2000: 110.70,  4000: 142.50,
    6000: 195.90, 8000: 249.30,  10000: 285.90, 12000: 339.50,
    14000: 393.10,16000: 446.60, 18000: 470.10, 20000: 494.00,
    40000: 1014.30,60000: 1512.40,100000: 2419.50,200000: 4826.70,
  },
  '128art:4c4c': {
    600: 103.00,  1000: 120.40,  2000: 133.80,  4000: 189.70,
    6000: 233.00, 8000: 276.30,  10000: 329.20, 12000: 387.00,
    14000: 444.70,16000: 502.50, 18000: 531.00, 20000: 561.50,
    40000: 1108.90,60000: 1651.30,100000: 2628.70,200000: 5241.20,
  },

  // 157gsm Art Paper — 16 tiers 600 → 200,000
  '157art:4c0c': {
    600: 78.00,   1000: 95.30,   2000: 116.50,  4000: 160.80,
    6000: 216.10, 8000: 271.50,  10000: 323.40, 12000: 380.00,
    14000: 435.70,16000: 491.90, 18000: 520.80, 20000: 560.00,
    40000: 1125.00,60000: 1654.20,100000: 2813.50,200000: 5613.60,
  },
  '157art:4c4c': {
    600: 104.90,  1000: 127.10,  2000: 141.50,  4000: 207.90,
    6000: 254.10, 8000: 300.30,  10000: 368.70, 12000: 431.00,
    14000: 494.00,16000: 555.40, 18000: 587.70, 20000: 636.00,
    40000: 1275.00,60000: 1832.40,100000: 3022.70,200000: 6028.10,
  },

  // 260gsm Art Card — 11 tiers 600 → 10,000 (thicker stock, shorter run range)
  '260card:4c0c': {
    600: 120.60, 1000: 130.00, 2000: 190.60, 3000: 217.60,
    4000: 263.80,5000: 313.80, 6000: 380.20, 7000: 440.90,
    8000: 501.50,9000: 562.10, 10000: 622.80,
  },
  '260card:4c4c': {
    600: 159.70, 1000: 173.30, 2000: 221.70, 3000: 273.40,
    4000: 322.50,5000: 369.60, 6000: 431.20, 7000: 481.30,
    8000: 526.50,9000: 589.10, 10000: 651.70,
  },

  // 310gsm Art Card — 11 tiers 600 → 10,000
  '310card:4c0c': {
    600: 144.80, 1000: 156.00, 2000: 228.80, 3000: 261.20,
    4000: 316.60,5000: 376.60, 6000: 456.30, 7000: 529.10,
    8000: 601.80,9000: 674.60, 10000: 747.40,
  },
  '310card:4c4c': {
    600: 191.70, 1000: 208.00, 2000: 256.50, 3000: 328.10,
    4000: 387.00,5000: 443.60, 6000: 517.50, 7000: 577.60,
    8000: 631.80,9000: 707.00, 10000: 782.10,
  },
};

const prices = {};
let priceCount = 0;
for (const [comboKey, tierMap] of Object.entries(RAW_OFFSET)) {
  for (const [qty, dollars] of Object.entries(tierMap)) {
    // Key shape: method:size:paper:sides:qty
    prices[`offset:a5:${comboKey}:${qty}`] = Math.round(dollars * 100);
    priceCount++;
  }
}

const pricingTable = {
  axes: {
    method: methodAxis,
    size_offset: sizeOffsetAxis,
    paper_offset: paperOffsetAxis,
    sides_offset: sidesOffsetAxis,
  },
  axis_order: ['method', 'size_offset', 'paper_offset', 'sides_offset'],
  qty_tiers: qtyTiers,
  prices,
};

// ────────────────────────────────────────────────────────────────────
// Configurator steps — digital steps stay formula-driven, offset
// steps exist for pricing_table lookup. show_if scopes each set to its
// method.
// ────────────────────────────────────────────────────────────────────

// Digital formulas (preserved from the current setup — the existing
// "pv pricing table" the user mentioned, expressed as per-step formulas).
const digitalSizeOpts = [
  { slug: 'a4', label: 'A4 (210 × 297mm)',  price_formula: '(qty/500)*(110-Math.min(10,(qty/500)-1))', note: 'Most common' },
  { slug: 'a5', label: 'A5 (148 × 210mm)',  price_formula: '(qty/500)*(75-Math.min(10,(qty/500)-1))' },
  { slug: 'dl', label: 'DL (99 × 210mm)',   price_formula: '(qty/500)*(65-Math.min(10,(qty/500)-1))' },
];

const digitalSidesOpts = [
  { slug: '2', label: 'Double Sided', price_formula: '(qty/500)*(25-Math.min(5,(qty/500)-1))', note: 'Recommended' },
  { slug: '1', label: 'Single Sided', price_formula: '0' },
];

const digitalPaperOpts = [
  { slug: '115art', label: '115gsm Art Paper', price_formula: '0', note: 'Standard' },
  { slug: '128art', label: '128gsm Art Paper', price_formula: '(qty/500)*10' },
  { slug: '157art', label: '157gsm Art Paper', price_formula: '(qty/500)*20' },
];

const digitalLamOpts = [
  { slug: 'none',  label: 'No Lamination',    price_formula: '0' },
  { slug: 'matt',  label: 'Matt Lamination',  price_formula: '(qty/500)*20' },
  { slug: 'gloss', label: 'Gloss Lamination', price_formula: '(qty/500)*15' },
];

const digitalShowIf  = { step: 'method', value: 'digital' };
const offsetShowIf   = { step: 'method', value: 'offset' };

const offsetQtyTiers = [600, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 14000, 16000, 18000, 20000, 40000, 60000, 100000, 200000];
const digitalQtyTiers = [500, 1000, 2000, 5000];

try {
  const [prod] = await sql`select id from public.products where slug='flyers'`;
  if (!prod) throw new Error('flyers product not found');
  console.log('✓ found flyers', prod.id);

  // 1. Seed pricing_table (offset entries only; digital falls through
  //    to formulas thanks to the calculator patch).
  await sql`update public.products set pricing_table = ${sql.json(pricingTable)} where id = ${prod.id}`;
  console.log(`✓ pricing_table seeded — ${priceCount} offset price points (4 papers × 2 sides × 11–16 tiers)`);

  // 2. Wipe + rebuild configurator.
  await sql`delete from public.product_configurator where product_id = ${prod.id}`;

  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      -- 0. Print Method — top of the configurator, drives everything else
      (
        ${prod.id}, 'method', 0, 'Print Method', 'swatch', true,
        ${sql.json([
          { slug: 'digital', label: 'Digital', note: 'Short runs · 500 → 5,000 pcs · 1-day turnaround' },
          { slug: 'offset',  label: 'Offset',  note: 'Bulk runs · 600 → 200,000 pcs · 7-day turnaround' },
        ])},
        null, null
      ),
      -- 1. Digital size
      (
        ${prod.id}, 'size', 1, 'Size', 'swatch', true,
        ${sql.json(digitalSizeOpts)},
        ${sql.json(digitalShowIf)}, null
      ),
      -- 2. Offset size (A5 only for now)
      (
        ${prod.id}, 'size_offset', 2, 'Size', 'swatch', true,
        ${sql.json(sizeOffsetAxis)},
        ${sql.json(offsetShowIf)}, null
      ),
      -- 3. Digital paper
      (
        ${prod.id}, 'paper', 3, 'Paper', 'swatch', true,
        ${sql.json(digitalPaperOpts)},
        ${sql.json(digitalShowIf)}, null
      ),
      -- 4. Offset paper
      (
        ${prod.id}, 'paper_offset', 4, 'Paper', 'swatch', true,
        ${sql.json(paperOffsetAxis)},
        ${sql.json(offsetShowIf)}, null
      ),
      -- 5. Digital sides
      (
        ${prod.id}, 'sides', 5, 'Printing Sides', 'swatch', true,
        ${sql.json(digitalSidesOpts)},
        ${sql.json(digitalShowIf)}, null
      ),
      -- 6. Offset sides
      (
        ${prod.id}, 'sides_offset', 6, 'Printing Sides', 'swatch', true,
        ${sql.json(sidesOffsetAxis.map((s) => ({
          ...s,
          ...(s.slug === '4c4c' ? { note: 'Recommended' } : {}),
        })))},
        ${sql.json(offsetShowIf)}, null
      ),
      -- 7. Digital lamination (offset doesn't offer lamination on this sheet)
      (
        ${prod.id}, 'lamination', 7, 'Lamination', 'swatch', true,
        ${sql.json(digitalLamOpts)},
        ${sql.json(digitalShowIf)}, null
      ),
      -- 8. Digital qty
      (
        ${prod.id}, 'qty', 8, 'Quantity', 'qty', true,
        '[]'::jsonb,
        ${sql.json(digitalShowIf)},
        ${sql.json({ presets: digitalQtyTiers, min: 500, step: 500, note: '500-piece steps. Enter any multiple of 500 from 500 to 5,000.' })}
      ),
      -- 9. Offset qty
      (
        ${prod.id}, 'qty_offset', 9, 'Quantity', 'qty', true,
        '[]'::jsonb,
        ${sql.json(offsetShowIf)},
        ${sql.json({ presets: offsetQtyTiers, min: 600, step: 1, note: 'Supplier tiers — price snaps to nearest tier below.' })}
      )
  `;
  console.log('✓ configurator rebuilt — method + 4 digital steps + 4 offset steps + 2 qty steps (10 total)');

  // 3. Lead time / print mode — flyers has BOTH methods, so a single
  //    field can't describe both. Leave nulls so the chips don't show
  //    stale info. (Future: method-aware lead_time display.)
  await sql`update public.products set lead_time_days = null, print_mode = null where id = ${prod.id}`;
  console.log('✓ lead_time_days / print_mode cleared (method-specific — set in UI copy instead)');

  // 4. Drop the $0 legacy product_pricing stub — it's not doing anything.
  await sql`delete from public.product_pricing where product_id = ${prod.id}`;
  console.log('✓ legacy product_pricing stub dropped');

  // 5. Verify
  const [check] = await sql`
    select p.name, p.lead_time_days, p.print_mode,
           jsonb_array_length(p.pricing_table->'qty_tiers') as tiers,
           (select count(*) from jsonb_object_keys(p.pricing_table->'prices')) as price_count
    from public.products p where p.id = ${prod.id}
  `;
  console.log('\nverify:', JSON.stringify(check, null, 2));

  const steps = await sql`
    select step_id, step_order, label, type, jsonb_array_length(options) as opt_count, show_if
    from public.product_configurator where product_id = ${prod.id} order by step_order
  `;
  console.log('\nsteps:');
  for (const s of steps) console.log(` ${s.step_order}. ${s.step_id} "${s.label}" [${s.type}] opts=${s.opt_count} show_if=${JSON.stringify(s.show_if)}`);

  console.log(`\n✅ Digital: ${digitalQtyTiers.length} qty presets · formula-based pricing preserved`);
  console.log(`✅ Offset: ${Object.keys(RAW_OFFSET).length} paper+sides combos × ${priceCount / Object.keys(RAW_OFFSET).length} avg tiers = ${priceCount} supplier prices`);
} finally {
  await sql.end();
}
