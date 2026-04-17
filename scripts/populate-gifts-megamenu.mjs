#!/usr/bin/env node
/**
 * Populate the Gifts mega-menu sections with the full set of migrated
 * gift products. Existing items in each section are preserved (so the
 * items that are still Print products like Tumbler Cup, Yeti Mug, etc.
 * stay where they are). We only ADD the migrated gift slugs.
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

/**
 * For each Gifts section we say which gift-product slugs belong under it
 * and what label to show. Order within a section matters; existing
 * entries stay at the top.
 */
const ASSIGNMENTS = {
  'Frames & Plaques': [
    ['acrylic-photo-wall-art',     'Acrylic Photo Wall Art'],
    ['led-photo-frame',            'LED Photo Frame'],
    ['led-light-reveal-frame',     'LED Light Reveal Frame'],
    ['360-rotating-figurine',      'Rotating Figurine Frame'],
    ['song-lyrics-photo-frame',    'Song Lyrics Frame'],
    ['spotify-music-plaque',       'Spotify Music Plaque'],
    ['vinyl-memory-disc',          'Vinyl Memory Disc'],
    ['woodsnap',                   'WoodSnap'],
  ],
  'Lifestyle': [
    ['aluminium-fridge-magnets',   'Fridge Magnets'],
    ['bluetooth-spotify-magnet',   'Bluetooth Spotify Magnet'],
    ['luggage-tag',                'Luggage Tag'],
    ['led-black-base',             'LED Black Base'],
    ['led-wood-circle-base',       'LED Wood Circle Base'],
    ['led-wood-rectangle-base',    'LED Wood Rectangle Base'],
  ],
  'Jewellery': [
    ['bar-necklace',                   'Bar Necklace'],
    ['3d-vertical-bar-necklace',       '3D Vertical Bar Necklace'],
    ['book-necklace',                  'Book Necklace'],
    ['duo-heart-necklace',             'Duo Heart Necklace'],
    ['forever-necklace',               'Forever Necklace'],
    ['heart-charm-necklace',           'Heart Charm Necklace'],
    ['sleek-necklace',                 'Sleek Necklace'],
    ['secret-message-envelope-necklace','Secret Message Envelope'],
    ['disc-metallic-bracelet',         'Disc Metallic Bracelet'],
  ],
  'Keychains': [
    ['3d-bar-keychain',                  '3D Bar Keychain'],
    ['circular-metallic-keychain',       'Circular Metallic Keychain'],
    ['heartlink-metallic-keychain',      'HeartLink Keychain'],
    ['inspirational-keyring',            'Inspirational Keyring'],
    ['reflective-rectangle-keychain',    'Reflective Rectangle Keychain'],
    ['spotify-keychain',                 'Spotify Keychain'],
    ['timeless-keychain',                'Timeless Keychain'],
  ],
};

try {
  for (const [heading, items] of Object.entries(ASSIGNMENTS)) {
    const [section] = await pg`
      select id from mega_menus
      where menu_key = 'gifts' and section_heading = ${heading}
      limit 1
    `;
    if (!section) {
      console.log(`⚠ Section "${heading}" not found in Gifts menu — skipping`);
      continue;
    }
    console.log(`\n── ${heading}`);

    // Get existing items to compute next display_order and avoid duplicates
    const existing = await pg`
      select product_slug, display_order from mega_menu_items
      where mega_menu_id = ${section.id}
    `;
    const haveSlug = new Set(existing.map((r) => r.product_slug));
    let nextOrder = existing.length === 0 ? 0 : Math.max(...existing.map((r) => r.display_order)) + 1;

    for (const [slug, label] of items) {
      if (haveSlug.has(slug)) {
        console.log(`   skip   · ${label} (already present)`);
        continue;
      }
      await pg`
        insert into mega_menu_items (mega_menu_id, product_slug, label, display_order)
        values (${section.id}, ${slug}, ${label}, ${nextOrder})
      `;
      console.log(`   +      · ${label}`);
      nextOrder++;
    }
  }
  console.log('\n✓ Done');
} finally {
  await pg.end({ timeout: 5 });
}
