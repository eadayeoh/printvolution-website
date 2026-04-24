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
    await fs.readFile(
      path.join(root, 'supabase/migrations/0061_gift_variant_mockup_by_prompt.sql'),
      'utf8',
    ),
  );
  const r = await sql`
    select column_name from information_schema.columns
    where table_schema='public' and table_name='gift_product_variants'
      and column_name = 'mockup_by_prompt_id'
  `;
  console.log('column present:', r.length === 1 ? 'yes' : 'NO');
} finally {
  await sql.end();
}
