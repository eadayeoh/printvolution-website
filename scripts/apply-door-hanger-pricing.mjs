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

// Three orthogonal axes matching the user-requested UI shape.
const papers = [
  { slug: '260', label: '260GSM Art Card' },
  { slug: '310', label: '310GSM Art Card' },
];

const laminations = [
  { slug: 'none', label: 'None' },
  { slug: 'matt', label: 'Matt Lamination' },
];

// Spot UV only makes physical sense on Matt Lamination (UV sits on lam)
// AND is only offered by supplier on 260gsm — enforced via show_if below.
const uvs = [
  { slug: 'none',   label: 'None' },
  { slug: 'single', label: 'Single Sided' },
  { slug: 'double', label: 'Double Sided' },
];

// Union of supplier qty breaks across all valid combos.
const qtyTiers = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

// Supplier prices in $ (RM treated 1:1 as SGD).
// Key: `${paper}:${lamination}:${uv}` — only valid supplier combos present.
const RAW = {
  '260:none:none': {
    100: 56.60, 200: 96.60, 300: 108.60, 500: 142.00, 1000: 188.60,
    2000: 356.60, 3000: 534.00, 5000: 840.00, 10000: 1458.40,
  },
  '260:matt:none': {
    100: 83.00, 200: 117.60, 300: 123.60, 400: 154.00, 500: 166.60,
    1000: 212.00, 2000: 404.00, 3000: 606.00, 5000: 960.00, 10000: 1698.40,
  },
  '260:matt:single': {
    100: 131.00, 200: 165.60, 300: 180.00, 400: 217.60, 500: 232.00,
    1000: 332.00, 2000: 614.00, 3000: 906.00, 5000: 1440.00, 10000: 2622.40,
  },
  '260:matt:double': {
    200: 222.60, 300: 234.00, 500: 292.00, 1000: 410.00,
    2000: 770.00, 3000: 1146.00, 5000: 1836.00, 10000: 3414.40,
  },
  '310:none:none': {
    200: 102.00, 300: 132.00, 500: 196.00, 1000: 254.00,
    2000: 488.00, 5000: 1170.00, 10000: 2118.40,
  },
  '310:matt:none': {
    100: 101.60, 200: 150.00, 300: 180.00, 400: 205.00, 500: 220.00,
    1000: 250.40, 2000: 449.60, 3000: 664.20, 4000: 847.80, 5000: 1036.80,
    6000: 1191.60, 7000: 1356.80, 8000: 1511.60, 9000: 1671.40, 10000: 1826.20,
  },
};

const prices = {};
let priceCount = 0;
for (const [comboKey, tierMap] of Object.entries(RAW)) {
  for (const [qty, dollars] of Object.entries(tierMap)) {
    prices[`${comboKey}:${qty}`] = Math.round(dollars * 100);
    priceCount++;
  }
}

const pricingTable = {
  axes: { paper: papers, lamination: laminations, uv: uvs },
  axis_order: ['paper', 'lamination', 'uv'],
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
  console.log(`✓ pricing_table seeded — ${priceCount} price points across ${Object.keys(RAW).length} valid combos`);

  // 2. Replace configurator: Paper, Lamination, Spot UV (conditional), Qty
  await sql`delete from public.product_configurator where product_id = ${product.id}`;

  // Spot UV step shows only when paper=260 AND lamination=matt (AND over
  // an array of conditions — requires the multi-condition show_if patch
  // in product-page.tsx).
  const uvShowIf = [
    { step: 'paper', value: '260' },
    { step: 'lamination', value: 'matt' },
  ];

  await sql`
    insert into public.product_configurator
      (product_id, step_id, step_order, label, type, required, options, show_if, step_config)
    values
      (
        ${product.id}, 'paper', 1, 'Paper', 'swatch', true,
        ${sql.json(papers)},
        null, null
      ),
      (
        ${product.id}, 'lamination', 2, 'Lamination', 'swatch', true,
        ${sql.json(laminations.map((l) => ({
          ...l,
          ...(l.slug === 'matt' ? { note: 'Popular' } : {}),
        })))},
        null, null
      ),
      (
        ${product.id}, 'uv', 3, 'Spot UV', 'swatch', false,
        ${sql.json(uvs)},
        ${sql.json(uvShowIf)},
        ${sql.json({ note: '260gsm + Matt Lamination only — adds a glossy raised accent over printed areas.' })}
      ),
      (
        ${product.id}, 'qty', 4, 'Quantity', 'qty', true,
        '[]'::jsonb, null,
        ${sql.json({ presets: qtyTiers, min: qtyTiers[0], step: 1, note: 'Supplier tiers — price snaps to nearest tier below.' })}
      )
  `;
  console.log('✓ configurator replaced — Paper / Lamination / Spot UV (conditional) / Qty');

  // 3. Lead time + print mode
  await sql`update public.products set lead_time_days = 7, print_mode = 'Offset' where id = ${product.id}`;
  console.log('✓ lead_time_days=7, print_mode=Offset');

  // 4. SEO body
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
    select step_id, step_order, label, type, required, jsonb_array_length(options) as opt_count, show_if
    from public.product_configurator
    where product_id = ${product.id}
    order by step_order
  `;
  console.log('steps:', steps);
} finally {
  await sql.end();
}
