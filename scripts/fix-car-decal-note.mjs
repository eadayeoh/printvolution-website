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
  // Kill the "Supplier tiers" note on car-decal's qty step.
  // The step is hidden when pricing_table is set, but keep the DB clean.
  const r = await sql`
    update public.product_configurator
    set step_config = step_config - 'note'
    where step_id = 'qty'
      and product_id = (select id from public.products where slug = 'car-decal')
    returning step_id, step_config
  `;
  console.log('updated:', r);

  // Scan for any other rows containing "supplier" or "e-print"
  const hits = await sql`
    select 'configurator' as where_, step_id, label, step_config
    from public.product_configurator
    where step_config::text ilike '%supplier%'
       or step_config::text ilike '%e-print%'
       or step_config::text ilike '%eprint%'
    union all
    select 'extras', pe.seo_title, p.slug, to_jsonb(pe.seo_body)
    from public.product_extras pe
    join public.products p on p.id = pe.product_id
    where pe.seo_body ilike '%supplier%'
       or pe.seo_body ilike '%e-print%'
       or pe.seo_body ilike '%eprint%'
  `;
  console.log('remaining hits:', hits);
} finally {
  await sql.end();
}
