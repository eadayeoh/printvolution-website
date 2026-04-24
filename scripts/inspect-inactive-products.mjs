import { openSql } from './_lib-merge-gift-group.mjs';
const sql = await openSql();
try {
  console.log('=== INACTIVE products (is_active=false) ===');
  const printInactive = await sql`
    select slug, name from products where is_active = false order by name
  `;
  for (const r of printInactive) console.log(`  [products]      ${r.slug.padEnd(40)} ${r.name}`);
  console.log(`  → ${printInactive.length} inactive print products.\n`);

  console.log('=== INACTIVE gift_products (is_active=false) ===');
  const giftInactive = await sql`
    select slug, name from gift_products where is_active = false order by name
  `;
  for (const r of giftInactive) console.log(`  [gift_products] ${r.slug.padEnd(40)} ${r.name}`);
  console.log(`  → ${giftInactive.length} inactive gift products.`);

  // Reference check: rows that SHOULD be kept because orders/assets point at them.
  console.log('\n=== DEPENDENCY CHECK (FK refs) ===');
  for (const table of ['products', 'gift_products']) {
    const rows = table === 'products' ? printInactive : giftInactive;
    if (rows.length === 0) { console.log(`  ${table}: no inactive rows`); continue; }
    const deps = await sql`
      select tc.table_name, kcu.column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name
       and tc.table_schema = kcu.table_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name
       and ccu.table_schema = tc.table_schema
      where tc.constraint_type = 'FOREIGN KEY'
        and ccu.table_name = ${table}
        and ccu.column_name = 'id'
      order by tc.table_name
    `;
    console.log(`  ${table} referenced by:`);
    for (const d of deps) console.log(`    - ${d.table_name}.${d.column_name}`);
  }
} finally {
  await sql.end();
}
