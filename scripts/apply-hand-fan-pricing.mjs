// Hand fan — four-axis configurator matching the supplier sheet.
//
//   Material × Finishing × Handle → price (pricing_table)
//   Type → shape/design selector (no price impact, visibility filtered
//          per material+finishing+handle combo via option-level show_if)
//   Assembly → optional add-on formula ($0.212/pc when Yes)
//   Quantity → tier snap
//
// Valid combinations from the supplier sheet:
//   500gsm Synthetic Card + None + with handle  → Type A (1 shape, 100–1000 pcs)
//   310gsm Art Card + Matt Lam + with handle    → Types B–K (10 shapes, 100–1000 pcs)
//   310gsm Art Card + Matt Lam + without handle → Types L–N (3 designs, 100–3000 pcs)
//
// Invalid combinations (e.g. 500gsm + matt, 500gsm without handle,
// 310gsm without matt lam) have no types visible and no price.

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
// Axis options
// ────────────────────────────────────────────────────────────────────
const materialAxis = [
  { slug: '310gsm', label: '310gsm Art Card', note: 'Most popular' },
  { slug: '500gsm', label: '500gsm Synthetic Card', note: 'Premium · waterproof' },
];

const finishingAxis = [
  // 'none' only makes sense on 500gsm (supplier doesn't offer bare 310)
  { slug: 'none', label: 'None', show_if: { step: 'material', value: '500gsm' } },
  // 'matt' only makes sense on 310gsm (500gsm doesn't get matt lam)
  { slug: 'matt', label: 'Matt Lamination', show_if: { step: 'material', value: '310gsm' } },
];

const handleAxis = [
  { slug: 'yes', label: 'Yes — with plastic handle', note: 'Popular' },
  // no-handle is only a 310gsm option per supplier sheet
  { slug: 'no',  label: 'No — hand-held only', show_if: { step: 'material', value: '310gsm' } },
];

// Type (shape) — option-level show_if restricts to the (material,
// finishing, handle) combo that supplier actually offers each shape in.
// Dimensions from supplier screenshot, verbatim.
const WITH_HANDLE_310_MATT = [
  { step: 'material',  value: '310gsm' },
  { step: 'finishing', value: 'matt' },
  { step: 'handle',    value: 'yes' },
];
const NO_HANDLE_310_MATT = [
  { step: 'material',  value: '310gsm' },
  { step: 'finishing', value: 'matt' },
  { step: 'handle',    value: 'no' },
];
const TYPE_A_CONDITIONS = [
  { step: 'material',  value: '500gsm' },
  { step: 'finishing', value: 'none' },
  { step: 'handle',    value: 'yes' },
];

const typeAxis = [
  { slug: 'a', label: 'Type A · Round (173 × 175mm)',          show_if: TYPE_A_CONDITIONS },
  { slug: 'b', label: 'Type B · Cloud (170 × 157mm)',          show_if: WITH_HANDLE_310_MATT },
  { slug: 'c', label: 'Type C · Cross-pattern (182 × 169mm)',  show_if: WITH_HANDLE_310_MATT },
  { slug: 'd', label: 'Type D · Soft square (159 × 171mm)',    show_if: WITH_HANDLE_310_MATT },
  { slug: 'e', label: 'Type E · Flower (180 × 165mm)',         show_if: WITH_HANDLE_310_MATT },
  { slug: 'f', label: 'Type F · Star (169 × 162mm)',           show_if: WITH_HANDLE_310_MATT },
  { slug: 'g', label: 'Type G · Raindrop circle (172 × 149mm)',show_if: WITH_HANDLE_310_MATT },
  { slug: 'h', label: 'Type H · Bear (180 × 156mm)',           show_if: WITH_HANDLE_310_MATT },
  { slug: 'i', label: 'Type I · Thumbs-up (169 × 175mm)',      show_if: WITH_HANDLE_310_MATT },
  { slug: 'j', label: 'Type J · Polka circle (172 × 171mm)',   show_if: WITH_HANDLE_310_MATT },
  { slug: 'k', label: 'Type K · Small diamond (130 × 124mm)',  show_if: WITH_HANDLE_310_MATT },
  { slug: 'l', label: 'Type L · Round no-handle (170 × 170mm)',show_if: NO_HANDLE_310_MATT },
  { slug: 'm', label: 'Type M · Round no-handle (170 × 170mm)',show_if: NO_HANDLE_310_MATT },
  { slug: 'n', label: 'Type N · Round no-handle (170 × 170mm)',show_if: NO_HANDLE_310_MATT },
];

// Handle fans always ship fully assembled — the supplier only quotes
// the body-glued-to-handle build. Kept as a single-option step so the
// $0.212/pc assembly fee is visible in the breakdown rather than
// silently baked into tier prices.
const assemblyAxis = [
  { slug: 'yes', label: 'Fully assembled', price_formula: 'qty*0.212' },
];

const qtyTiers = [100, 200, 300, 400, 500, 1000, 2000, 3000];

// ────────────────────────────────────────────────────────────────────
// Prices — keyed material:finishing:handle:qty
// ────────────────────────────────────────────────────────────────────
const RAW = {
  // 500gsm · none · with handle (Type A only, qty 100–1000)
  '500gsm:none:yes': {
    100: 350.50, 200: 437.20, 300: 524.10, 400: 610.90, 500: 722.70, 1000: 1160.90,
  },
  // 310gsm + Matt Lam · with handle (Types B–K, qty 100–1000)
  '310gsm:matt:yes': {
    100: 235.90, 200: 330.20, 300: 358.50, 400: 405.70, 500: 443.40, 1000: 582.10,
  },
  // 310gsm + Matt Lam · without handle (Types L–N, qty 100–3000)
  '310gsm:matt:no': {
    100: 216.00, 200: 290.00, 300: 298.00, 400: 325.00, 500: 343.00,
    1000: 382.00, 2000: 637.00, 3000: 918.00,
  },
};

const prices = {};
let priceCount = 0;
for (const [combo, tierMap] of Object.entries(RAW)) {
  for (const [qty, dollars] of Object.entries(tierMap)) {
    prices[`${combo}:${qty}`] = Math.round(dollars * 100);
    priceCount++;
  }
}

const pricingTable = {
  axes: {
    material:  materialAxis,
    finishing: finishingAxis,
    handle:    handleAxis,
  },
  axis_order: ['material', 'finishing', 'handle'],
  qty_tiers: qtyTiers,
  prices,
};

// Merge admin-uploaded option.image_url values from existing configurator
// rows into a freshly-built option array. We key by step_id + slug so
// that even if the option list is reordered, an image uploaded by the
// admin for (e.g.) step='type', slug='b' carries across a re-run of
// this script. Previously this script DELETE+INSERTed the configurator
// with hardcoded options, wiping every image_url the admin had set.
function mergeOptionImages(newOptions, existingOptions) {
  if (!Array.isArray(existingOptions) || existingOptions.length === 0) return newOptions;
  const imgBySlug = new Map();
  for (const o of existingOptions) {
    if (o?.slug && typeof o.image_url === 'string' && o.image_url) {
      imgBySlug.set(o.slug, o.image_url);
    }
  }
  return newOptions.map((o) => {
    const existing = imgBySlug.get(o.slug);
    return existing ? { ...o, image_url: existing } : o;
  });
}

try {
  const [prod] = await sql`select id from public.products where slug='hand-fan'`;
  if (!prod) throw new Error('hand-fan product not found');
  console.log('✓ found hand-fan', prod.id);

  await sql`update public.products set pricing_table = ${sql.json(pricingTable)}, pricing_compute = null where id = ${prod.id}`;
  console.log(`✓ pricing_table seeded — ${priceCount} prices across 3 valid combos`);

  // Snapshot existing configurator before delete so we can carry
  // admin-uploaded option images into the rebuilt rows.
  const existingCfg = await sql`
    select step_id, options from public.product_configurator where product_id = ${prod.id}
  `;
  const existingByStep = new Map();
  for (const row of existingCfg) existingByStep.set(row.step_id, row.options);
  const mergedMaterial  = mergeOptionImages(materialAxis,  existingByStep.get('material'));
  const mergedFinishing = mergeOptionImages(finishingAxis, existingByStep.get('finishing'));
  const mergedHandle    = mergeOptionImages(handleAxis,    existingByStep.get('handle'));
  const mergedType      = mergeOptionImages(typeAxis,      existingByStep.get('type'));
  const mergedAssembly  = mergeOptionImages(assemblyAxis,  existingByStep.get('assembly'));

  await sql`delete from public.product_configurator where product_id = ${prod.id}`;
  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${prod.id}, 'material', 0, 'Material', 'swatch', true,
        ${sql.json(mergedMaterial)},
        null, null
      ),
      (
        ${prod.id}, 'finishing', 1, 'Finishing', 'swatch', true,
        ${sql.json(mergedFinishing)},
        null, null
      ),
      (
        ${prod.id}, 'handle', 2, 'Handle', 'swatch', true,
        ${sql.json(mergedHandle)},
        null, null
      ),
      (
        ${prod.id}, 'type', 3, 'Type (shape)', 'swatch', true,
        ${sql.json(mergedType)},
        null, null
      ),
      (
        ${prod.id}, 'assembly', 4, 'Assembly', 'swatch', true,
        ${sql.json(mergedAssembly)},
        ${sql.json({ step: 'handle', value: 'yes' })},
        ${sql.json({ note: 'Included — body glued to handle, ready to wave. S$0.21/pc.' })}
      ),
      (
        ${prod.id}, 'qty', 5, 'Quantity', 'qty', true,
        '[]'::jsonb, null,
        ${sql.json({ presets: qtyTiers, min: 100, step: 1, note: 'Price tiers — price snaps to the nearest tier at or below your quantity.' })}
      )
  `;
  console.log('✓ configurator rebuilt — Material / Finishing / Handle / Type / Assembly / Qty (6 steps)');

  await sql`delete from public.product_pricing where product_id = ${prod.id}`;
  console.log('✓ legacy product_pricing dropped');

  const [check] = await sql`
    select p.name, p.lead_time_days, p.print_mode,
           jsonb_array_length(p.pricing_table->'qty_tiers') as tiers,
           (select count(*) from jsonb_object_keys(p.pricing_table->'prices')) as price_count
    from public.products p where p.id = ${prod.id}
  `;
  console.log('\nverify:', JSON.stringify(check, null, 2));

  const samples = [
    ['310gsm:matt:yes:500', '310gsm + Matt · with handle · 500 pcs (Type B–K)'],
    ['310gsm:matt:no:3000', '310gsm + Matt · no handle · 3000 pcs (Type L–N)'],
    ['500gsm:none:yes:500', '500gsm Synthetic · with handle · 500 pcs (Type A)'],
  ];
  console.log('\nsample prices (SGD, body + handle only, no assembly):');
  for (const [key, label] of samples) {
    const cents = prices[key] ?? 0;
    console.log(`  ${label}: $${(cents / 100).toFixed(2)}`);
  }
} finally {
  await sql.end();
}
