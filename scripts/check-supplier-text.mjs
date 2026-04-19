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
const PATTERNS = ['%supplier%', '%e-print%', '%eprint%', '%e.print%'];
async function scan(t, c) {
  const clause = PATTERNS.map(() => `(${c}) ilike $?`).join(' or ');
  try {
    const rows = await sql.unsafe(
      `select ${c.includes('::') ? c : c} as val
       from public.${t}
       where ${clause}
       limit 50`,
      PATTERNS,
    );
    if (rows.length) {
      console.log(`\n=== ${t}.${c.replace('::text', '')} (${rows.length} rows) ===`);
      for (const r of rows) console.log('-', String(r.val).slice(0, 220));
    }
  } catch (e) {
    // column may not exist; skip silently
  }
}
try {
  await scan('page_content', 'data::text');
  await scan('products', 'name');
  await scan('products', 'tagline');
  await scan('products', 'description');
  await scan('product_extras', 'seo_title');
  await scan('product_extras', 'seo_desc');
  await scan('product_extras', 'seo_body');
  await scan('product_extras', 'intro');
  await scan('product_extras', 'h1');
  await scan('product_extras', 'h1em');
  await scan('product_faqs', 'question');
  await scan('product_faqs', 'answer');
  await scan('product_configurator', 'label');
  await scan('product_configurator', 'step_config::text');
  await scan('product_configurator', 'options::text');
  await scan('gift_products', 'name');
  await scan('gift_products', 'tagline');
  await scan('gift_products', 'description');
  await scan('gift_products', 'seo_body::text');
  await scan('gift_products', 'seo_magazine::text');
  await scan('gift_products', 'faqs::text');
  await scan('site_settings', 'value::text');
} finally {
  await sql.end();
}
