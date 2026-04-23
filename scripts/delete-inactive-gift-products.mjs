// Hard-delete every gift_products row that is_active=false AND has no
// dependent rows in the gift ecosystem (gift_assets, gift_orders,
// gift_order_items, gift_product_variants, bundle_gift_items, etc.).
//
// Rows with dependents are skipped and reported — nothing is orphaned.

import { openSql } from './_lib-merge-gift-group.mjs';

const sql = await openSql();

try {
  // Discover every FK column that references gift_products.id so we
  // don't have to hand-maintain the list.
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
      and ccu.table_name = 'gift_products'
      and ccu.column_name = 'id'
    order by tc.table_name
  `;
  const DEPENDENT_TABLES = deps.map((r) => ({ table: r.table_name, col: r.column_name }));
  console.log(`Tables referencing gift_products.id: ${DEPENDENT_TABLES.map((d) => `${d.table}.${d.col}`).join(', ')}`);

  const inactive = await sql`
    select id, slug, name
    from gift_products
    where is_active = false
    order by name
  `;
  console.log(`Found ${inactive.length} inactive gift_products.`);

  const toDelete = [];
  const skipped = [];
  for (const row of inactive) {
    const deps = [];
    for (const { table, col } of DEPENDENT_TABLES) {
      const [{ count }] = await sql.unsafe(
        `select count(*)::int as count from ${table} where ${col} = $1`,
        [row.id],
      );
      if (count > 0) deps.push(`${table}:${count}`);
    }
    if (deps.length > 0) {
      skipped.push({ row, deps });
    } else {
      toDelete.push(row);
    }
  }

  for (const { row, deps } of skipped) {
    console.log(`  skipped ${row.slug.padEnd(36)} — has dependents: ${deps.join(', ')}`);
  }

  if (toDelete.length === 0) {
    console.log('Nothing safe to delete. Done.');
  } else {
    console.log(`\nDeleting ${toDelete.length} rows:`);
    for (const row of toDelete) {
      await sql`delete from gift_products where id = ${row.id}`;
      console.log(`  deleted ${row.slug}`);
    }
    console.log('Done.');
  }
} finally {
  await sql.end();
}
