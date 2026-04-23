import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = ['/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', path.join(root, '.env.local')].find((p) => {
  try { fsSync.accessSync(p); return true; } catch { return false; }
});
const envFile = await fs.readFile(envPath, 'utf8');
for (const raw of envFile.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('='); if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });
try {
  await sql.unsafe(
    await fs.readFile(path.join(root, 'supabase/migrations/0042_gift_variants_colour_swatches.sql'), 'utf8'),
  );
  console.log('✓ migration 0042 applied (colour_swatches jsonb on gift_product_variants)');
} finally {
  await sql.end();
}
