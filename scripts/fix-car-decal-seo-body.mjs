// Shorten car-decal SEO body to 2-line keyword-dense crawler footer.
// Long narrative content will move into seo_magazine in the next pass.

import fs from 'node:fs/promises';
import postgres from 'postgres';

const env = await fs.readFile(new URL('../.env.local', import.meta.url), 'utf8');
for (const raw of env.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('='); if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const sql = postgres(process.env.SUPABASE_DB_URL, { prepare: false });

const seo_body =
  'Custom car decal printing Singapore — vehicle stickers, van wraps, PHV decals, fleet branding, outdoor vinyl graphics. Weatherproof cast vinyl, clean-peel adhesive, same-day pickup and islandwide delivery.';

const [prod] = await sql`select id from products where slug = 'car-decal'`;
await sql`update product_extras set seo_body = ${seo_body} where product_id = ${prod.id}`;
console.log('✓ car-decal seo_body shortened');
await sql.end();
