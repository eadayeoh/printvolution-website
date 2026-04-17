#!/usr/bin/env node
import fs from 'node:fs';
import postgres from 'postgres';
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });

// Slugs currently referenced in the Gifts mega menu that are still in
// the Print `products` table — these should be migrated to gift_products.
try {
  const [gifts] = await pg`
    select array_agg(mmi.product_slug) as slugs
    from mega_menu_items mmi
    join mega_menus mm on mm.id = mmi.mega_menu_id
    where mm.menu_key = 'gifts'
  `;
  const slugs = gifts.slugs || [];
  console.log(`${slugs.length} slugs referenced from Gifts mega menu`);

  const stillPrint = await pg`
    select p.id, p.slug, p.name, c.name as category_name, p.is_active
    from products p
    left join categories c on c.id = p.category_id
    where p.slug = any(${slugs})
    order by p.name
  `;
  console.log(`\n${stillPrint.length} are still in the Print products table (need migration):\n`);
  for (const r of stillPrint) {
    console.log(`  • ${r.name.padEnd(30)} slug=${r.slug.padEnd(30)} cat=${r.category_name ?? '—'} active=${r.is_active}`);
  }
} finally {
  await pg.end({ timeout: 2 });
}
