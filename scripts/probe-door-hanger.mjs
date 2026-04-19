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
const [r] = await sql`
  select p.name, p.tagline, p.description,
         e.h1, e.h1em, e.seo_title, e.seo_desc, e.intro,
         (e.matcher is not null) as has_matcher,
         (e.seo_magazine is not null) as has_magazine,
         (e.how_we_print is not null) as has_hwp,
         jsonb_array_length(coalesce(e.seo_magazine->'articles','[]'::jsonb)) as articles,
         (select count(*) from public.product_faqs f where f.product_id = p.id) as faqs
  from public.products p left join public.product_extras e on e.product_id = p.id
  where p.slug = 'door-hanger'
`;
console.log(JSON.stringify(r, null, 2));
await sql.end();
