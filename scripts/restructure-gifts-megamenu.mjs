// Restructure the Gifts mega menu to match the post-merge catalogue:
//  - 9 necklace / bracelet items collapse into 1 parent link
//  - 7 merged keychain items collapse into 1 parent link (pet-keychain
//    and leather-snap-keychain weren't merged; they stay as siblings).
//  - 6 line-art / full-colour embroidery items collapse into 2 parent
//    links (embroidered-aprons + embroidered-towels stay).
// All other sections (Photo Frames, Lifestyle, Drinkware, Wedding) are
// copied verbatim from the current live layout so we don't lose them.
//
// Idempotent: wipes the existing gifts menu rows and reinserts.

import { openSql } from './_lib-merge-gift-group.mjs';
const sql = await openSql();

const LAYOUT = [
  {
    heading: 'Photo Frames & Plaques',
    items: [
      ['led-photo-frame',         'LED Photo Frame'],
      ['led-light-reveal-frame',  'LED Light Reveal Frame'],
      ['360-rotating-figurine',   'Rotating Figurine Frame'],
      ['acrylic-photo-wall-art',  'Acrylic Photo Wall Art'],
      ['woodsnap',                'WoodSnap'],
      ['song-lyrics-photo-frame', 'Song Lyrics Frame'],
      ['spotify-music-plaque',    'Spotify Music Plaque'],
      ['vinyl-memory-disc',       'Vinyl Memory Disc'],
      ['city-map-photo-frame',    'City Map Frame'],
      ['star-map-photo-frame',    'Star Map Frame'],
      ['netflix-photo-frame',     'Netflix Frame'],
    ],
  },
  {
    heading: 'Lifestyle',
    items: [
      ['aluminium-fridge-magnets', 'Photo Magnets'],
      ['bluetooth-spotify-magnet', 'Bluetooth Spotify Magnet'],
      ['led-base',                 'LED Base'],
      ['luggage-tag',              'Luggage Tag'],
    ],
  },
  {
    heading: 'Necklaces & Bracelets',
    items: [
      ['engraved-necklace-bracelet', 'Engraved Necklace & Bracelet'],
    ],
  },
  {
    heading: 'Keychains',
    items: [
      ['engraved-keychain',      'Engraved Keychain'],
      ['pet-keychain',           'Pet Keychain'],
      ['leather-snap-keychain',  'Leather Snap Keychain'],
    ],
  },
  {
    heading: 'Embroidery',
    items: [
      ['line-art-embroidery',     'Line Art Embroidery'],
      ['full-colour-embroidery',  'Full Colour Embroidery'],
      ['embroidered-aprons',      'Embroidered Aprons'],
      ['embroidered-towels',      'Embroidered Towels'],
    ],
  },
  {
    heading: 'Drinkware',
    items: [
      ['tumblr-cup',            'Tumbler Cup'],
      ['yeti-mug',              'Yeti Mug'],
      ['rhinestone-bottles',    'Rhinestone Bottle'],
      ['acrylic-drink-stirrer', 'Drink Stirrers'],
    ],
  },
  {
    heading: 'Wedding',
    items: [
      ['custom-cake-topper',        'Cake Topper'],
      ['bridal-sash',               'Bridal Sash'],
      ['fancy-envelopes',           'Fancy Envelopes'],
      ['wedding-guestbook',         'Guestbook'],
      ['wedding-jigsaw-guestbook',  'Jigsaw Guestbook'],
      ['wedding-signage',           'Wedding Signage'],
    ],
  },
];

try {
  await sql`
    delete from mega_menu_items
    where mega_menu_id in (select id from mega_menus where menu_key = 'gifts')
  `;
  await sql`delete from mega_menus where menu_key = 'gifts'`;
  console.log('Cleared existing Gifts mega menu');

  for (let i = 0; i < LAYOUT.length; i++) {
    const s = LAYOUT[i];
    const [{ id }] = await sql`
      insert into mega_menus (menu_key, section_heading, column_index, display_order)
      values ('gifts', ${s.heading}, 0, ${i})
      returning id
    `;
    for (let j = 0; j < s.items.length; j++) {
      const [slug, label] = s.items[j];
      await sql`
        insert into mega_menu_items (mega_menu_id, product_slug, label, display_order)
        values (${id}, ${slug}, ${label}, ${j})
      `;
    }
    console.log(`  ${s.heading.padEnd(26)} ${s.items.length} item${s.items.length === 1 ? '' : 's'}`);
  }
  console.log('\n✓ Gifts mega menu restructured');
} finally {
  await sql.end();
}
