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
  const rows = await sql`
    select page_key, section_key, data::text as d
    from public.page_content
    where section_key = 'announce' or data::text ilike '%delivery%'
    limit 20
  `;
  for (const r of rows) console.log(r.page_key, '/', r.section_key, '→', r.d.slice(0, 400));
  console.log('---');
  const gifts = await sql`
    select slug, substring(seo_body from 1 for 200) as seo_body_snippet
    from public.gift_products
    where seo_body ilike '%S$80%' or description ilike '%S$80%'
    limit 10
  `;
  for (const g of gifts) console.log('gift', g.slug, '→', g.seo_body_snippet);
} finally {
  await sql.end();
}
