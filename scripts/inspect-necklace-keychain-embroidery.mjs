// One-off inspection: show where the necklace / keychain / embroidery
// catalogue items live (products vs gift_products) + their slugs, so we
// can decide the merge-script shape.

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
  console.log('\n=== products where name matches necklace/bracelet/keychain/keyring/embroidery/line art/full colour/shirt/long sleeve/jacket ===');
  const products = await sql`
    select p.id, p.slug, p.name, p.is_gift, p.is_active, c.name as category, c.slug as cat_slug
    from products p
    left join categories c on c.id = p.category_id
    where p.name ~* '(necklace|bracelet|keychain|keyring|line art|full colour|full color|embroidery|long sleeve|jacket|shirt)'
    order by p.name
  `;
  for (const p of products) {
    console.log(`  [${p.is_gift ? 'GIFT' : 'PRNT'}${p.is_active ? '' : '/inactive'}] ${p.name.padEnd(36)}  ${p.slug.padEnd(34)}  cat=${p.cat_slug ?? '—'}`);
  }

  console.log('\n=== gift_products (all) ===');
  const gifts = await sql`
    select id, slug, name, mode, template_mode, is_active
    from gift_products
    order by name
  `;
  for (const g of gifts) {
    console.log(`  [${g.is_active ? 'OK' : 'INACTIVE'}] ${g.name.padEnd(32)}  ${g.slug.padEnd(32)}  mode=${g.mode} tpl=${g.template_mode}`);
  }

  console.log('\n=== gift_product_variants (all) ===');
  const variants = await sql`
    select v.id, v.slug, v.name, v.variant_kind, v.base_price_cents, gp.name as parent
    from gift_product_variants v
    join gift_products gp on gp.id = v.gift_product_id
    order by gp.name, v.display_order
  `;
  for (const v of variants) {
    console.log(`  ${(v.parent + ' → ' + v.name).padEnd(52)}  ${v.slug.padEnd(24)}  kind=${v.variant_kind}  $${(v.base_price_cents/100).toFixed(2)}`);
  }

  console.log('\n=== categories tree (for context) ===');
  const cats = await sql`select slug, name, parent_id from categories order by name`;
  for (const c of cats) {
    console.log(`  ${c.slug.padEnd(30)}  ${c.name}`);
  }
} finally {
  await sql.end();
}
