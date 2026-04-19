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

// Size axis
const sizes = [
  { slug: '90x54', label: '90mm × 54mm' },
  { slug: '130x170', label: '130mm × 170mm' },
  { slug: '115x120', label: '115mm × 120mm' },
  { slug: '90x420', label: '90mm × 420mm' },
];

// View axis — wording mirrors the supplier table exactly
const views = [
  { slug: 'face', label: 'Face In / Face Out View (4C + White Base)' },
  { slug: 'both', label: 'Both Side View (4C + White Base + 4C)' },
];

// Supplier qty breaks
const qtyTiers = [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

// Raw supplier prices (in $ — RM treated 1:1 per user).
// Arrays align with qtyTiers order: [200, 300, 400, …, 5000]
// Inner pair: [face_only, both_sides]
const RAW = {
  '90x54': [
    [49.50, 97.40], [59.80, 121.40], [70.20, 145.50], [80.50, 169.50],
    [95.80, 193.50], [111.20, 217.60], [126.50, 241.60], [141.80, 265.70],
    [157.10, 289.70], [235.60, 409.90], [314.20, 530.00], [354.40, 651.50],
    [471.30, 771.70], [549.80, 894.40], [628.40, 1015.80], [706.90, 1137.20],
    [785.50, 1258.70],
  ],
  '130x170': [
    [198.60, 291.00], [275.80, 406.10], [352.90, 521.20], [430.10, 636.30],
    [508.50, 752.70], [588.20, 870.30], [666.70, 986.70], [743.80, 1101.80],
    [822.30, 1218.20], [1214.40, 1800.10], [1606.60, 2382.00], [1997.40, 2962.60],
    [2388.30, 3543.30], [2780.50, 4125.20], [3172.60, 4707.10], [3563.50, 5287.70],
    [3955.70, 5869.60],
  ],
  '115x120': [
    [170.80, 251.70], [232.80, 344.10], [298.50, 442.80], [364.30, 540.20],
    [426.30, 632.50], [492.10, 731.20], [557.90, 828.60], [621.10, 922.20],
    [686.90, 1020.90], [1013.30, 1504.10], [1340.90, 1991.10], [1666.00, 2474.30],
    [1991.10, 2956.30], [2320.00, 3444.60], [2643.90, 3926.60], [2970.20, 4409.80],
    [3297.90, 4896.80],
  ],
  '90x420': [
    [318.80, 463.00], [445.30, 651.50], [579.40, 850.10], [707.10, 1041.10],
    [834.90, 1230.80], [967.70, 1428.20], [1096.80, 1620.50], [1224.50, 1810.20],
    [1357.30, 2007.60], [2002.50, 2967.70], [2654.00, 3936.70], [3302.90, 4901.90],
    [3949.30, 5863.30], [4599.50, 6831.00], [5249.80, 7797.50], [5894.90, 8757.60],
    [6546.40, 9726.60],
  ],
};

const prices = {};
for (const [sizeSlug, rows] of Object.entries(RAW)) {
  rows.forEach((pair, i) => {
    const qty = qtyTiers[i];
    prices[`${sizeSlug}:face:${qty}`] = Math.round(pair[0] * 100);
    prices[`${sizeSlug}:both:${qty}`] = Math.round(pair[1] * 100);
  });
}

const pricingTable = {
  axes: { size: sizes, view: views },
  axis_order: ['size', 'view'],
  qty_tiers: qtyTiers,
  prices,
};

try {
  // 1. Add pricing_table column
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0030_product_pricing_table.sql'), 'utf8'),
  );
  console.log('✓ migration applied');

  // 2. Find car-decal product
  const [product] = await sql`select id from public.products where slug='car-decal'`;
  if (!product) throw new Error('car-decal product not found');
  console.log('✓ found car-decal', product.id);

  // 3. Write pricing_table
  await sql`update public.products set pricing_table = ${sql.json(pricingTable)} where id = ${product.id}`;
  console.log('✓ pricing_table seeded — 136 price points');

  // 4. Replace configurator steps: Size, View, Qty
  await sql`delete from public.product_configurator where product_id = ${product.id}`;

  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${product.id}, 'size', 1, 'Size', 'swatch', true,
        ${sql.json(sizes.map((s) => ({ slug: s.slug, label: s.label })))},
        null, null
      ),
      (
        ${product.id}, 'view', 2, 'View Type', 'swatch', true,
        ${sql.json(views.map((v) => ({ slug: v.slug, label: v.label })))},
        null, null
      ),
      (
        ${product.id}, 'qty', 3, 'Quantity', 'qty', true,
        '[]'::jsonb, null,
        ${sql.json({ presets: qtyTiers, min: qtyTiers[0], step: 1, note: 'Supplier tiers — price snaps to nearest tier below.' })}
      )
  `;
  console.log('✓ configurator replaced — Size / View / Qty');

  // 5. Verify
  const [check] = await sql`
    select name, pricing_table->'axes' as axes,
           jsonb_array_length(pricing_table->'qty_tiers') as tiers,
           (select count(*) from jsonb_object_keys(pricing_table->'prices')) as price_count
    from public.products where id = ${product.id}
  `;
  console.log('verify:', JSON.stringify(check, null, 2));

  const steps = await sql`
    select step_id, step_order, label, type, jsonb_array_length(options) as opt_count
    from public.product_configurator
    where product_id = ${product.id}
    order by step_order
  `;
  console.log('steps:', steps);
} finally {
  await sql.end();
}
