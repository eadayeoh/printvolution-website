#!/usr/bin/env node
/**
 * Move the Print→Embroidery mega-menu section over to Gifts, populate it
 * with the 8 migrated embroidery gift products, and drop the now-stale
 * "Custom Embroidery" → `embroidery` item (the old Print embroidery
 * product).
 */
import fs from 'node:fs';
import postgres from 'postgres';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const pg = postgres(process.env.SUPABASE_DB_URL, {
  max: 1, connect_timeout: 30, ssl: { rejectUnauthorized: false },
});

try {
  // 1. Find the Print→Embroidery section
  const [printEmb] = await pg`
    select * from mega_menus
    where menu_key = 'print' and section_heading = 'Embroidery'
    limit 1
  `;
  if (!printEmb) {
    console.log('No Print→Embroidery section found — nothing to move.');
    process.exit(0);
  }
  console.log(`Found Print→Embroidery section: ${printEmb.id}`);

  // 2. Count current gifts sections to pick a display_order at the end
  const [{ count: giftCount }] = await pg`
    select count(*)::int as count from mega_menus where menu_key = 'gifts'
  `;
  const newOrder = Number(giftCount);

  // 3. Move section: menu_key → 'gifts', display_order → end of gifts
  await pg`
    update mega_menus
    set menu_key = 'gifts', display_order = ${newOrder}
    where id = ${printEmb.id}
  `;
  console.log(`→ moved to gifts (display_order ${newOrder})`);

  // 4. Clear existing items in that section (stale Print references)
  await pg`delete from mega_menu_items where mega_menu_id = ${printEmb.id}`;

  // 5. Repopulate with the 8 embroidery gift products — ordered for a sensible UX
  const items = [
    { slug: 'line-art-embroidery-shirt',       label: 'Line Art Shirt' },
    { slug: 'line-art-embroidery-long-sleeve', label: 'Line Art Long Sleeve' },
    { slug: 'line-art-embroidery-jacket',      label: 'Line Art Jacket' },
    { slug: 'full-color-embroidery-shirt',     label: 'Full Colour Shirt' },
    { slug: 'full-color-embroidery-long-sleeve', label: 'Full Colour Long Sleeve' },
    { slug: 'full-color-embroidery-jacket',    label: 'Full Colour Jacket' },
    { slug: 'embroidered-aprons',              label: 'Embroidered Aprons' },
    { slug: 'embroidered-towels',              label: 'Embroidered Towels' },
  ];
  for (let i = 0; i < items.length; i++) {
    await pg`
      insert into mega_menu_items (mega_menu_id, product_slug, label, display_order)
      values (${printEmb.id}, ${items[i].slug}, ${items[i].label}, ${i})
    `;
    console.log(`  + ${items[i].label}`);
  }

  console.log(`\n✓ Embroidery section is now under Gifts with ${items.length} items.`);
} finally {
  await pg.end({ timeout: 5 });
}
