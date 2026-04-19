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

// Single axis — supplier presents six discrete SKUs (paper × finish is
// non-orthogonal: Spot UV is 260gsm-only, so baking them together avoids
// invalid-combo UI handling).
const finishes = [
  { slug: '260-art',  label: '260gsm Art Card' },
  { slug: '260-matt', label: '260gsm + Matt Lamination' },
  { slug: '260-uv1',  label: '260gsm + Matt Lam + 1-Side Spot UV' },
  { slug: '260-uv2',  label: '260gsm + Matt Lam + 2-Side Spot UV' },
  { slug: '310-art',  label: '310gsm Art Card' },
  { slug: '310-matt', label: '310gsm + Matt Lamination' },
];

// Union of all supplier qty breaks across combos.
const qtyTiers = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

// Supplier prices in $ (RM treated 1:1 as SGD, per car-decal convention).
// Sparse: absent qty for a combo = not offered by supplier at that tier.
const RAW = {
  '260-art': {
    100: 56.60, 200: 96.60, 300: 108.60, 500: 142.00, 1000: 188.60,
    2000: 356.60, 3000: 534.00, 5000: 840.00, 10000: 1458.40,
  },
  '260-matt': {
    100: 83.00, 200: 117.60, 300: 123.60, 400: 154.00, 500: 166.60,
    1000: 212.00, 2000: 404.00, 3000: 606.00, 5000: 960.00, 10000: 1698.40,
  },
  '260-uv1': {
    100: 131.00, 200: 165.60, 300: 180.00, 400: 217.60, 500: 232.00,
    1000: 332.00, 2000: 614.00, 3000: 906.00, 5000: 1440.00, 10000: 2622.40,
  },
  '260-uv2': {
    200: 222.60, 300: 234.00, 500: 292.00, 1000: 410.00,
    2000: 770.00, 3000: 1146.00, 5000: 1836.00, 10000: 3414.40,
  },
  '310-art': {
    200: 102.00, 300: 132.00, 500: 196.00, 1000: 254.00,
    2000: 488.00, 5000: 1170.00, 10000: 2118.40,
  },
  '310-matt': {
    100: 101.60, 200: 150.00, 300: 180.00, 400: 205.00, 500: 220.00,
    1000: 250.40, 2000: 449.60, 3000: 664.20, 4000: 847.80, 5000: 1036.80,
    6000: 1191.60, 7000: 1356.80, 8000: 1511.60, 9000: 1671.40, 10000: 1826.20,
  },
};

const prices = {};
let priceCount = 0;
for (const [finishSlug, tierMap] of Object.entries(RAW)) {
  for (const [qty, dollars] of Object.entries(tierMap)) {
    prices[`${finishSlug}:${qty}`] = Math.round(dollars * 100);
    priceCount++;
  }
}

const pricingTable = {
  axes: { finish: finishes },
  axis_order: ['finish'],
  qty_tiers: qtyTiers,
  prices,
};

const seoBody =
  'Door hanger printing Singapore — HDB estate drops, property launch campaigns, F&B promotion hangers, hotel privacy tags, real-estate listing hangers. ' +
  '260gsm or 310gsm art card with optional matt lamination and 1- or 2-side spot UV, clean 240×89mm die-cut hole, bundle-packed for door-by-door distribution.';

try {
  const [product] = await sql`select id from public.products where slug = 'door-hanger'`;
  if (!product) throw new Error('door-hanger product not found');
  console.log('✓ found door-hanger', product.id);

  // 1. pricing_table — authoritative for calculator
  await sql`update public.products set pricing_table = ${sql.json(pricingTable)} where id = ${product.id}`;
  console.log(`✓ pricing_table seeded — ${priceCount} price points across ${finishes.length} combos`);

  // 2. Replace configurator: Paper & Finish + Qty (drops old lamination/sides steps)
  await sql`delete from public.product_configurator where product_id = ${product.id}`;
  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${product.id}, 'finish', 1, 'Paper & Finish', 'swatch', true,
        ${sql.json(finishes.map((f) => ({
          slug: f.slug,
          label: f.label,
          ...(f.slug === '260-matt' ? { note: 'Popular' } : {}),
        })))},
        null, null
      ),
      (
        ${product.id}, 'qty', 2, 'Quantity', 'qty', true,
        '[]'::jsonb, null,
        ${sql.json({ presets: qtyTiers, min: qtyTiers[0], step: 1, note: 'Supplier tiers — price snaps to nearest tier below.' })}
      )
  `;
  console.log('✓ configurator replaced — Paper & Finish / Qty');

  // 3. Lead time + print mode (matches car-decal: offset jobs @ these qtys)
  await sql`update public.products set lead_time_days = 7, print_mode = 'Offset' where id = ${product.id}`;
  console.log('✓ lead_time_days=7, print_mode=Offset');

  // 4. SEO body — 2 lines, keyword-dense
  await sql`update public.product_extras set seo_body = ${seoBody} where product_id = ${product.id}`;
  console.log('✓ seo_body rewritten');

  // 5. Verify
  const [check] = await sql`
    select p.name, p.lead_time_days, p.print_mode,
           jsonb_array_length(p.pricing_table->'qty_tiers') as tiers,
           (select count(*) from jsonb_object_keys(p.pricing_table->'prices')) as price_count,
           length(e.seo_body) as seo_body_len
    from public.products p
    left join public.product_extras e on e.product_id = p.id
    where p.id = ${product.id}
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
