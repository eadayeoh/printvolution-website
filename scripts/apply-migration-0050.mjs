import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = [
  '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
  path.join(root, '.env.local'),
].find((p) => { try { return (fs.statSync ?? (() => true))(p); } catch { return false; } });
const envFile = await fs.readFile(envPath ?? path.join(root, '.env.local'), 'utf8');
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
try {
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0050_gift_product_sizes.sql'), 'utf8'),
  );
  const col = await sql`select column_name from information_schema.columns where table_schema='public' and table_name='gift_products' and column_name='sizes'`;
  console.log('sizes column exists:', col.length === 1);

  const withSizes = await sql`select slug, name, jsonb_array_length(sizes) as n, sizes from gift_products where jsonb_array_length(sizes) > 0`;
  console.log('\nProducts with sizes:');
  for (const r of withSizes) {
    console.log(`  ${r.name} (${r.n} size${r.n === 1 ? '' : 's'})`);
    for (const s of r.sizes) console.log(`     • ${s.name} — ${s.width_mm}×${s.height_mm}mm  +S$${(s.price_delta_cents/100).toFixed(2)}`);
  }

  const remainingSize = await sql`select count(*)::int as n from gift_product_variants where variant_kind='size'`;
  console.log('\nRemaining size-kind variants (should be 0):', remainingSize[0].n);
} finally {
  await sql.end();
}
