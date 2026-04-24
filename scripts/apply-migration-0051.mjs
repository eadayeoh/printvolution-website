import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = await fs.readFile('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
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
  await sql.unsafe(await fs.readFile(path.join(root, 'supabase/migrations/0051_variant_mockup_bounds.sql'), 'utf8'));
  const col = await sql`select column_name from information_schema.columns where table_schema='public' and table_name='gift_product_variants' and column_name='mockup_bounds'`;
  console.log('mockup_bounds column exists:', col.length === 1);
  const r = await sql`select slug, mockup_area, mockup_bounds from gift_product_variants where mockup_url is not null`;
  for (const v of r) {
    console.log(`  ${v.slug}  area=${JSON.stringify(v.mockup_area)}  bounds=${JSON.stringify(v.mockup_bounds)}`);
  }
} finally {
  await sql.end();
}
