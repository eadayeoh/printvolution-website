#!/usr/bin/env node
/**
 * Rebalance the Print mega menu into 3 roughly-balanced columns so the
 * dropdown feels even. Current state has Advertising with 13 items and
 * others with just a few.
 */
import fs from 'node:fs';
import postgres from 'postgres';
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });

// Three logical columns for Print:
// 1. Signs & Displays — anything a customer would use at an event/shop
// 2. Paper & Cards — stationery, cards, printed paper
// 3. Packaging & Wearables — tote/bags/boxes/T-shirts
const LAYOUT = [
  {
    heading: 'Signs & Displays',
    items: [
      ['flyers',                       'Flyers'],
      ['roll-up-banner',               'Roll-Up Banner'],
      ['x-stand-banner',               'X-Stand Banner'],
      ['pvc-canvas',                   'PVC Canvas'],
      ['poster',                       'Posters'],
      ['life-size-standee',            'Life Size Standee'],
      ['acrylic-signage',              'Acrylic Signage'],
      ['easel-stand',                  'Easel Stand'],
    ],
  },
  {
    heading: 'Cards & Paper',
    items: [
      ['name-card',                    'Name Cards'],
      ['luxury-business-card',         'Luxury Name Cards'],
      ['pvc-card',                     'PVC Cards'],
      ['transparent-card',             'Transparent Cards'],
      ['nfc-card',                     'NFC Cards'],
      ['letterhead',                   'Letterhead'],
      ['envelopes',                    'Envelopes'],
      ['ncr-form',                     'NCR Forms'],
      ['rubber-stamp',                 'Rubber Stamps'],
      ['long-brochures',               'Brochures'],
      ['books',                        'Booklets'],
      ['loose-sheets',                 'Loose Sheets'],
    ],
  },
  {
    heading: 'Small Formats & Wearables',
    items: [
      ['stickers',                     'Stickers'],
      ['uv-dtf-sticker',               'UV DTF Stickers'],
      ['table-tent',                   'Table Tents'],
      ['wobbler',                      'Wobblers'],
      ['door-hanger',                  'Door Hangers'],
      ['hand-fan',                     'Hand Fans'],
      ['car-decal',                    'Car Decals'],
      ['round-neck-shirts',            'T-Shirts'],
      ['polo-shirts',                  'Polo Shirts'],
      ['aprons',                       'Aprons'],
      ['hang-tag',                     'Hang Tags'],
      ['paper-bag',                    'Paper Bags'],
      ['tote-bag',                     'Tote Bags'],
      ['money-packet',                 'Ang Bao'],
    ],
  },
];

try {
  // Hide all existing Print sections + their items, then insert fresh
  const { count: printCount } = (await pg`select count(*)::int as count from mega_menus where menu_key = 'print'`)[0];
  console.log(`Existing Print sections: ${printCount}`);

  // Delete old print sections
  await pg`delete from mega_menu_items where mega_menu_id in (select id from mega_menus where menu_key = 'print')`;
  await pg`delete from mega_menus where menu_key = 'print'`;
  console.log('Deleted old sections');

  // Insert new
  for (let i = 0; i < LAYOUT.length; i++) {
    const s = LAYOUT[i];
    const [{ id }] = await pg`
      insert into mega_menus (menu_key, section_heading, column_index, display_order)
      values ('print', ${s.heading}, ${i}, ${i})
      returning id
    `;
    for (let j = 0; j < s.items.length; j++) {
      const [slug, label] = s.items[j];
      await pg`
        insert into mega_menu_items (mega_menu_id, product_slug, label, display_order)
        values (${id}, ${slug}, ${label}, ${j})
      `;
    }
    console.log(`  ${s.heading}: ${s.items.length} items`);
  }
  console.log('\n✓ Print mega menu rebalanced into 3 columns');
} finally {
  await pg.end({ timeout: 2 });
}
