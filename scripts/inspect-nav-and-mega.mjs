import { openSql } from './_lib-merge-gift-group.mjs';
const sql = await openSql();
try {
  console.log('=== navigation (top-level) ===');
  for (const r of await sql`select label, type, action, mega_key, is_hidden, display_order from navigation order by display_order`) {
    console.log(`  [${r.display_order}] ${(r.label ?? '—').padEnd(20)} type=${(r.type ?? '—').padEnd(10)} action=${(r.action ?? '—').padEnd(20)} mega=${r.mega_key ?? '—'} hidden=${r.is_hidden}`);
  }
  console.log('\n=== mega_menus (Gifts only) ===');
  for (const r of await sql`
    select mm.menu_key, mm.section_heading, mm.display_order, count(mmi.*) as n
    from mega_menus mm left join mega_menu_items mmi on mmi.mega_menu_id = mm.id
    where mm.menu_key = 'gifts'
    group by mm.id
    order by mm.display_order
  `) {
    console.log(`  [${r.display_order}] ${r.section_heading.padEnd(28)} items=${r.n}`);
  }
  console.log('\n=== mega_menu_items (Gifts) ===');
  for (const r of await sql`
    select mm.section_heading, mmi.product_slug, mmi.label, mmi.display_order
    from mega_menu_items mmi
    join mega_menus mm on mm.id = mmi.mega_menu_id
    where mm.menu_key = 'gifts'
    order by mm.display_order, mmi.display_order
  `) {
    console.log(`  ${r.section_heading.padEnd(28)} → ${r.label.padEnd(32)} (${r.product_slug})`);
  }
} finally {
  await sql.end();
}
