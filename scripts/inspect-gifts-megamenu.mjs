// Dump the current gifts mega-menu so we can see the exact columns,
// headings, and sub-headings before restructuring.

import { openSql } from './_lib-merge-gift-group.mjs';
const sql = await openSql();
try {
  // Discover the schema first since the restructure script below has
  // to match the actual column names, not guesses.
  const cols = await sql`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_name in ('mega_menus', 'mega_menu_items')
    order by table_name, ordinal_position
  `;
  console.log('=== schema ===');
  for (const c of cols) {
    console.log(`  ${c.table_name.padEnd(18)}  ${c.column_name.padEnd(22)}  ${c.data_type}`);
  }
  console.log('\n=== current gifts mega-menu ===');
  const rows = await sql`
    select mm.section_heading, mm.column_index, mm.display_order as sec_order,
           mmi.product_slug, mmi.label, mmi.display_order as item_order
    from mega_menus mm
    left join mega_menu_items mmi on mmi.mega_menu_id = mm.id
    where mm.menu_key = 'gifts'
    order by mm.column_index, mm.display_order, mmi.display_order
  `;
  let lastHeading = '';
  for (const r of rows) {
    if (r.section_heading !== lastHeading) {
      console.log(`\n[col ${r.column_index}] ${r.section_heading}`);
      lastHeading = r.section_heading;
    }
    console.log(`    ${(r.product_slug ?? '—').padEnd(36)}  ${r.label ?? ''}`);
  }
} finally {
  await sql.end();
}
