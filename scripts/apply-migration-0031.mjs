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
try {
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0031_product_lead_time_print_mode.sql'), 'utf8'),
  );
  console.log('✓ migration 0031 applied');

  // Seed car-decal
  const r = await sql`
    update public.products
    set lead_time_days = 7, print_mode = 'Offset'
    where slug = 'car-decal'
    returning slug, lead_time_days, print_mode
  `;
  console.log('car-decal:', r[0]);
} finally {
  await sql.end();
}
