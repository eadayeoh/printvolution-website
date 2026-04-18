// Dump gift product data for content authoring. Writes scripts/gift-data.json.

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

const rows = await sql`
  select slug, name, mode, tagline, description, base_price_cents,
         price_tiers, width_mm, height_mm
  from gift_products
  where is_active = true
  order by slug
`;

const out = rows.map((r) => ({
  slug: r.slug,
  name: r.name,
  mode: r.mode,
  tagline: r.tagline,
  description: (r.description ?? '').slice(0, 600),
  base_price_cents: r.base_price_cents,
  price_tiers: r.price_tiers,
  width_mm: parseFloat(r.width_mm),
  height_mm: parseFloat(r.height_mm),
}));

await fs.writeFile(
  new URL('../scripts/gift-data.json', import.meta.url),
  JSON.stringify(out, null, 2),
);
console.log(`✓ dumped ${out.length} gifts to scripts/gift-data.json`);
await sql.end();
