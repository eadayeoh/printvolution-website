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
  const body = await fs.readFile(path.join(root, 'supabase/migrations/0022_product_extras_chooser_magazine.sql'), 'utf8');
  console.log('• applying 0022_product_extras_chooser_magazine');
  await sql.unsafe(body);
  const cols = await sql`
    select column_name, data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'product_extras'
      and column_name in ('chooser', 'seo_magazine')
  `;
  console.log('Columns:', cols);
} finally {
  await sql.end();
}
