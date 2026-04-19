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
    await fs.readFile(path.join(root, 'supabase/migrations/0029_home_why_header.sql'), 'utf8'),
  );
  const r = await sql`
    select section_key, data->'items'->0 as first_item
    from public.page_content
    where page_key='home'
      and section_key in ('why.header','categories.header','proof.header','faq.header','location.header')
    order by section_key
  `;
  for (const row of r) {
    console.log(row.section_key, '→', JSON.stringify(row.first_item));
  }
} finally {
  await sql.end();
}
