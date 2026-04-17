#!/usr/bin/env node
// Lists all Print products where is_gift = true, with relevant fields
// to help decide how to migrate them into the new gift_products table.
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const envFile = path.resolve(process.cwd(), '.env.local');
for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const pg = postgres(process.env.SUPABASE_DB_URL, {
  max: 1, connect_timeout: 30, ssl: { rejectUnauthorized: false },
});

try {
  const rows = await pg`
    select p.id, p.slug, p.name, p.is_gift, p.is_active, p.category_id,
           p.description,
           c.name as category_name,
           (select count(*) from gift_personalisation gp where gp.product_id = p.id) as personalisation_count
    from products p
    left join categories c on c.id = p.category_id
    where p.is_gift = true
    order by p.name;
  `;
  console.log(`Found ${rows.length} gift products:\n`);
  for (const r of rows) {
    console.log(`• ${r.name}`);
    console.log(`  slug: ${r.slug}`);
    console.log(`  category: ${r.category_name ?? '—'}`);
    console.log(`  active: ${r.is_active}`);
    console.log(`  has personalisation fields: ${r.personalisation_count > 0}`);
    console.log('');
  }
} finally {
  await pg.end({ timeout: 5 });
}
