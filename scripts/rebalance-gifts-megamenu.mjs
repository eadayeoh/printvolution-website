#!/usr/bin/env node
/**
 * Rebalance the Gifts mega menu into 3 logical columns. Current state
 * has 7 sections of uneven size — consolidate into better groupings.
 */
import fs from 'node:fs';
import postgres from 'postgres';
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });

const LAYOUT = [
  {
    heading: 'Photo Gifts',
    items: [
      ['acrylic-photo-wall-art',    'Acrylic Photo Wall Art'],
      ['led-photo-frame',           'LED Photo Frame'],
      ['led-light-reveal-frame',    'LED Light Reveal Frame'],
      ['360-rotating-figurine',     'Rotating Figurine Frame'],
      ['woodsnap',                  'WoodSnap'],
      ['city-map-photo-frame',      'City Map Frame'],
      ['star-map-photo-frame',      'Star Map Frame'],
      ['netflix-photo-frame',       'Netflix Frame'],
      ['song-lyrics-photo-frame',   'Song Lyrics Frame'],
      ['spotify-music-plaque',      'Spotify Music Plaque'],
      ['vinyl-memory-disc',         'Vinyl Memory Disc'],
      ['aluminium-fridge-magnets',  'Photo Magnets'],
      ['bluetooth-spotify-magnet',  'Bluetooth Spotify Magnet'],
      ['led-black-base',            'LED Black Base'],
      ['led-wood-circle-base',      'LED Wood Circle Base'],
      ['led-wood-rectangle-base',   'LED Wood Rectangle Base'],
    ],
  },
  {
    heading: 'Jewellery & Keychains',
    items: [
      ['bar-necklace',                    'Bar Necklace'],
      ['3d-vertical-bar-necklace',        '3D Vertical Bar Necklace'],
      ['book-necklace',                   'Book Necklace'],
      ['duo-heart-necklace',              'Duo Heart Necklace'],
      ['forever-necklace',                'Forever Necklace'],
      ['heart-charm-necklace',            'Heart Charm Necklace'],
      ['sleek-necklace',                  'Sleek Necklace'],
      ['secret-message-envelope-necklace','Secret Message Envelope'],
      ['disc-metallic-bracelet',          'Metallic Bracelet'],
      ['3d-bar-keychain',                 '3D Bar Keychain'],
      ['circular-metallic-keychain',      'Circular Keychain'],
      ['heartlink-metallic-keychain',     'HeartLink Keychain'],
      ['inspirational-keyring',           'Inspirational Keyring'],
      ['reflective-rectangle-keychain',   'Reflective Keychain'],
      ['spotify-keychain',                'Spotify Keychain'],
      ['timeless-keychain',               'Timeless Keychain'],
      ['pet-keychain',                    'Pet Keychain'],
      ['leather-snap-keychain',           'Leather Snap Keychain'],
      ['luggage-tag',                     'Luggage Tag'],
    ],
  },
  {
    heading: 'Apparel, Drinkware & Wedding',
    items: [
      ['line-art-embroidery-shirt',       'Line Art Shirt'],
      ['line-art-embroidery-long-sleeve', 'Line Art Long Sleeve'],
      ['line-art-embroidery-jacket',      'Line Art Jacket'],
      ['full-color-embroidery-shirt',     'Full Colour Shirt'],
      ['full-color-embroidery-long-sleeve','Full Colour Long Sleeve'],
      ['full-color-embroidery-jacket',    'Full Colour Jacket'],
      ['embroidered-aprons',              'Embroidered Aprons'],
      ['embroidered-towels',              'Embroidered Towels'],
      ['tumblr-cup',                      'Tumbler Cup'],
      ['yeti-mug',                        'Yeti Mug'],
      ['rhinestone-bottles',              'Rhinestone Bottle'],
      ['acrylic-drink-stirrer',           'Drink Stirrers'],
      ['custom-cake-topper',              'Cake Topper'],
      ['bridal-sash',                     'Bridal Sash'],
      ['fancy-envelopes',                 'Fancy Envelopes'],
      ['wedding-guestbook',               'Guestbook'],
      ['wedding-jigsaw-guestbook',        'Jigsaw Guestbook'],
      ['wedding-signage',                 'Wedding Signage'],
    ],
  },
];

try {
  await pg`delete from mega_menu_items where mega_menu_id in (select id from mega_menus where menu_key = 'gifts')`;
  await pg`delete from mega_menus where menu_key = 'gifts'`;
  console.log('Cleared existing Gifts mega menu');

  for (let i = 0; i < LAYOUT.length; i++) {
    const s = LAYOUT[i];
    const [{ id }] = await pg`
      insert into mega_menus (menu_key, section_heading, column_index, display_order)
      values ('gifts', ${s.heading}, ${i}, ${i})
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
  console.log('\n✓ Gifts mega menu rebalanced into 3 columns');
} finally {
  await pg.end({ timeout: 2 });
}
