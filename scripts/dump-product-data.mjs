// Dump product data (name, description, configurator options, pricing hints)
// for all non-gift service products so we can reference real configurator
// values while authoring content.

import fs from 'node:fs/promises';
import postgres from 'postgres';

const env = await fs.readFile(new URL('../.env.local', import.meta.url), 'utf8');
for (const raw of env.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('='); if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const sql = postgres(process.env.SUPABASE_DB_URL, { prepare: false });

const products = await sql`
  select p.slug, p.name, p.description, p.tagline, c.name as cat
  from products p
  left join categories c on c.id = p.category_id
  where p.is_gift = false and p.is_active = true
  order by p.slug
`;

const out = [];
for (const p of products) {
  const steps = await sql`
    select step_id, label, type, options
    from product_configurator
    where product_id = (select id from products where slug = ${p.slug})
    order by step_order
  `;
  const pricing = await sql`
    select label, configs, rows
    from product_pricing
    where product_id = (select id from products where slug = ${p.slug})
  `;
  out.push({
    slug: p.slug,
    name: p.name,
    category: p.cat,
    tagline: p.tagline,
    description: p.description,
    configurator: steps.map((s) => ({
      step_id: s.step_id, label: s.label, type: s.type,
      options: (s.options || []).map((o) => ({
        slug: o.slug, label: o.label, price_formula: o.price_formula, note: o.note,
      })),
    })),
    pricing: pricing[0] || null,
  });
}

await fs.writeFile(
  new URL('../scripts/product-data.json', import.meta.url),
  JSON.stringify(out, null, 2)
);
console.log(`✓ dumped ${out.length} products to scripts/product-data.json`);
await sql.end();
