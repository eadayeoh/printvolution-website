// Table Tent — pricing_table with four axes:
//
//   Material   — 310gsm Art Card (standard; single option for now)
//   Lamination — None (no prices yet) | Matt Lamination (2-sided, priced)
//   Spot UV    — No | Yes (1 side)
//   Type       — TC-01 / TC-02 / TC-03 / TC-04
//
// Quantity tiers: 100, 200, 300, 500, 1000, 2000, 3000.
// Spot UV-Yes does not quote the 200 tier — orders of 200 snap down to
// the 100 tier rate via the standard snapToTier logic.
//
// NOTE: "None" lamination is exposed as a customer-visible option per
// the user's spec, but no prices were provided for it. Combos with
// lam=none return no pricing_table entry → hero shows "FROM" fallback.
// Once the admin gives prices for None, add them to RAW.

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

// ────────────────────────────────────────────────────────────────────
// Axes
// ────────────────────────────────────────────────────────────────────
const materialAxis = [
  { slug: '310gsm', label: '310gsm Art Card', note: 'Standard' },
];

const lamAxis = [
  { slug: 'none', label: 'None' },
  { slug: 'matt', label: 'Matt Lamination', note: '2-sided · standard' },
];

const spotuvAxis = [
  { slug: 'no',  label: 'No' },
  { slug: 'yes', label: 'Yes — 1 Side Spot UV' },
];

const typeAxis = [
  { slug: 'tc01', label: 'TC-01' },
  { slug: 'tc02', label: 'TC-02' },
  { slug: 'tc03', label: 'TC-03' },
  { slug: 'tc04', label: 'TC-04' },
];

// ────────────────────────────────────────────────────────────────────
// Prices — keyed material:lam:spotuv:type:qty (matches axis_order)
// ────────────────────────────────────────────────────────────────────
const RAW = {
  // Matt Lam + no Spot UV
  '310gsm:matt:no:tc01': { 100: 127.60, 200: 157.80, 300: 187.80, 500: 236.70, 1000: 326.70, 2000: 564.00, 3000: 855.70 },
  '310gsm:matt:no:tc02': { 100: 236.30, 200: 277.80, 300: 337.80, 500: 416.70, 1000: 596.70, 2000: 995.90, 3000: 1503.80 },
  '310gsm:matt:no:tc03': { 100: 290.60, 200: 337.80, 300: 412.80, 500: 506.70, 1000: 731.70, 2000: 1211.80, 3000: 1827.90 },
  '310gsm:matt:no:tc04': { 100: 381.20, 200: 437.80, 300: 537.80, 500: 656.70, 1000: 956.70, 2000: 1571.70, 3000: 2368.00 },

  // Matt Lam + 1-side Spot UV (supplier sheet does not quote 200 tier here)
  '310gsm:matt:yes:tc01': { 100: 181.40, 300: 211.60, 500: 272.30, 1000: 368.50, 2000: 714.00, 3000: 1065.10 },
  '310gsm:matt:yes:tc02': { 100: 343.80, 300: 385.30, 500: 488.00, 1000: 680.40, 2000: 1295.90, 3000: 1922.70 },
  '310gsm:matt:yes:tc03': { 100: 425.00, 300: 472.20, 500: 595.80, 1000: 836.40, 2000: 1586.80, 3000: 2351.50 },
  '310gsm:matt:yes:tc04': { 100: 560.40, 300: 617.00, 500: 775.50, 1000: 1096.30, 2000: 2071.70, 3000: 3066.10 },
};

const qtyTiers = [100, 200, 300, 500, 1000, 2000, 3000];

const prices = {};
let priceCount = 0;
for (const [combo, tierMap] of Object.entries(RAW)) {
  for (const [q, dollars] of Object.entries(tierMap)) {
    prices[`${combo}:${q}`] = Math.round(dollars * 100);
    priceCount++;
  }
}

const pricingTable = {
  axes: {
    material: materialAxis,
    lam: lamAxis,
    spotuv: spotuvAxis,
    type: typeAxis,
  },
  axis_order: ['material', 'lam', 'spotuv', 'type'],
  qty_tiers: qtyTiers,
  prices,
};

try {
  const [prod] = await sql`select id from public.products where slug='table-tent'`;
  if (!prod) throw new Error('table-tent product not found');
  console.log('✓ found table-tent', prod.id);

  const existingCfg = await sql`
    select step_id, options from public.product_configurator where product_id = ${prod.id}
  `;
  const existingByStep = new Map();
  for (const row of existingCfg) existingByStep.set(row.step_id, row.options);

  const mergedMaterial = mergeOptionImages(materialAxis, existingByStep.get('material'));
  const mergedLam      = mergeOptionImages(lamAxis,      existingByStep.get('lam'));
  const mergedSpotuv   = mergeOptionImages(spotuvAxis,   existingByStep.get('spotuv'));
  const mergedType     = mergeOptionImages(typeAxis,     existingByStep.get('type'));

  // Final pricing_table uses the merged (image-carrying) axes so the
  // gallery shows admin-uploaded pictures.
  pricingTable.axes.material = mergedMaterial;
  pricingTable.axes.lam      = mergedLam;
  pricingTable.axes.spotuv   = mergedSpotuv;
  pricingTable.axes.type     = mergedType;

  await sql`update public.products set pricing_table = ${sql.json(pricingTable)}, pricing_compute = null where id = ${prod.id}`;
  console.log(`✓ pricing_table seeded — ${priceCount} price points across type × lam × spotuv`);

  await sql`delete from public.product_configurator where product_id = ${prod.id}`;
  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${prod.id}, 'type', 0, 'Type', 'swatch', true,
        ${sql.json(mergedType)},
        null, null
      ),
      (
        ${prod.id}, 'material', 1, 'Material', 'swatch', true,
        ${sql.json(mergedMaterial)},
        null, null
      ),
      (
        ${prod.id}, 'lam', 2, 'Lamination', 'swatch', true,
        ${sql.json(mergedLam)},
        null, null
      ),
      (
        ${prod.id}, 'spotuv', 3, 'Spot UV', 'swatch', true,
        ${sql.json(mergedSpotuv)},
        null, null
      ),
      (
        ${prod.id}, 'qty', 4, 'Quantity', 'qty', true,
        '[]'::jsonb, null,
        ${sql.json({ presets: qtyTiers, min: 100, step: 1, note: 'Price tiers — price snaps to the nearest tier at or below your quantity.' })}
      )
  `;
  console.log('✓ configurator rebuilt — Type / Material / Lamination / Spot UV / Quantity');

  // Drop legacy matrix so nothing leaks into fromPrice.
  await sql`delete from public.product_pricing where product_id = ${prod.id}`;
  console.log('✓ legacy product_pricing dropped');

  const samples = [
    ['310gsm:matt:no:tc01:100',   'TC-01 · Matt Lam · no UV · 100 pcs'],
    ['310gsm:matt:no:tc04:1000',  'TC-04 · Matt Lam · no UV · 1,000 pcs'],
    ['310gsm:matt:yes:tc02:500',  'TC-02 · Matt Lam · + Spot UV · 500 pcs'],
    ['310gsm:matt:yes:tc04:3000', 'TC-04 · Matt Lam · + Spot UV · 3,000 pcs'],
  ];
  console.log('\nsample prices (SGD):');
  for (const [key, label] of samples) {
    const cents = prices[key] ?? 0;
    console.log(`  ${label}: $${(cents / 100).toFixed(2)}`);
  }
} finally {
  await sql.end();
}
