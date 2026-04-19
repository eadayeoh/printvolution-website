// Clears any per-product how_we_print overrides — the section is
// site-wide now, sourced only from site_settings.product_features.
// Run once after shipping the admin + render changes.

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
  const before = await sql`
    select count(*)::int as n
    from public.product_extras
    where how_we_print is not null
  `;
  console.log(`rows with how_we_print override: ${before[0].n}`);
  await sql`update public.product_extras set how_we_print = null`;
  const after = await sql`
    select count(*)::int as n
    from public.product_extras
    where how_we_print is not null
  `;
  console.log(`after: ${after[0].n}`);
} finally {
  await sql.end();
}
