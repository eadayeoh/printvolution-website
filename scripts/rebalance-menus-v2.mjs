#!/usr/bin/env node
/**
 * Menu restructure v2 — more logical groupings instead of massive
 * lumped-together columns.
 */
import fs from 'node:fs';
import postgres from 'postgres';
for (const line of fs.readFileSync('.env.local','utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });

const PRINT = [
  { heading: 'Cards & Stationery', items: [
    ['name-card', 'Name Cards'],
    ['luxury-business-card', 'Luxury Name Cards'],
    ['pvc-card', 'PVC Cards'],
    ['transparent-card', 'Transparent Cards'],
    ['nfc-card', 'NFC Cards'],
    ['letterhead', 'Letterhead'],
    ['envelopes', 'Envelopes'],
    ['ncr-form', 'NCR Forms'],
    ['rubber-stamp', 'Rubber Stamps'],
  ]},
  { heading: 'Brochures & Print', items: [
    ['long-brochures', 'Brochures'],
    ['books', 'Booklets'],
    ['loose-sheets', 'Loose Sheets'],
    ['flyers', 'Flyers'],
  ]},
  { heading: 'Banners & Displays', items: [
    ['roll-up-banner', 'Roll-Up Banners'],
    ['x-stand-banner', 'X-Stand Banners'],
    ['pvc-canvas', 'PVC Canvas'],
    ['poster', 'Posters'],
    ['life-size-standee', 'Life Size Standee'],
    ['acrylic-signage', 'Acrylic Signage'],
    ['easel-stand', 'Easel Stand'],
  ]},
  { heading: 'Point-of-Sale', items: [
    ['table-tent', 'Table Tents'],
    ['wobbler', 'Wobblers'],
    ['door-hanger', 'Door Hangers'],
    ['hand-fan', 'Hand Fans'],
    ['car-decal', 'Car Decals'],
  ]},
  { heading: 'Stickers', items: [
    ['stickers', 'Stickers'],
    ['uv-dtf-sticker', 'UV DTF Stickers'],
  ]},
  { heading: 'Apparel & Packaging', items: [
    ['round-neck-shirts', 'T-Shirts'],
    ['polo-shirts', 'Polo Shirts'],
    ['aprons', 'Aprons'],
    ['tote-bag', 'Tote Bags'],
    ['paper-bag', 'Paper Bags'],
    ['hang-tag', 'Hang Tags'],
    ['money-packet', 'Ang Bao'],
  ]},
];

const GIFTS = [
  { heading: 'Photo Frames & Plaques', items: [
    ['led-photo-frame', 'LED Photo Frame'],
    ['led-light-reveal-frame', 'LED Light Reveal Frame'],
    ['360-rotating-figurine', 'Rotating Figurine Frame'],
    ['acrylic-photo-wall-art', 'Acrylic Photo Wall Art'],
    ['woodsnap', 'WoodSnap'],
    ['song-lyrics-photo-frame', 'Song Lyrics Frame'],
    ['spotify-music-plaque', 'Spotify Music Plaque'],
    ['vinyl-memory-disc', 'Vinyl Memory Disc'],
    ['city-map-photo-frame', 'City Map Frame'],
    ['star-map-photo-frame', 'Star Map Frame'],
    ['netflix-photo-frame', 'Netflix Frame'],
  ]},
  { heading: 'Lifestyle', items: [
    ['aluminium-fridge-magnets', 'Photo Magnets'],
    ['bluetooth-spotify-magnet', 'Bluetooth Spotify Magnet'],
    ['led-black-base', 'LED Black Base'],
    ['led-wood-circle-base', 'LED Wood Circle Base'],
    ['led-wood-rectangle-base', 'LED Wood Rectangle Base'],
    ['luggage-tag', 'Luggage Tag'],
  ]},
  { heading: 'Necklaces & Bracelets', items: [
    ['bar-necklace', 'Bar Necklace'],
    ['3d-vertical-bar-necklace', '3D Vertical Bar Necklace'],
    ['book-necklace', 'Book Necklace'],
    ['duo-heart-necklace', 'Duo Heart Necklace'],
    ['forever-necklace', 'Forever Necklace'],
    ['heart-charm-necklace', 'Heart Charm Necklace'],
    ['sleek-necklace', 'Sleek Necklace'],
    ['secret-message-envelope-necklace', 'Secret Message Envelope'],
    ['disc-metallic-bracelet', 'Metallic Bracelet'],
  ]},
  { heading: 'Keychains', items: [
    ['3d-bar-keychain', '3D Bar Keychain'],
    ['circular-metallic-keychain', 'Circular Keychain'],
    ['heartlink-metallic-keychain', 'HeartLink Keychain'],
    ['inspirational-keyring', 'Inspirational Keyring'],
    ['reflective-rectangle-keychain', 'Reflective Keychain'],
    ['spotify-keychain', 'Spotify Keychain'],
    ['timeless-keychain', 'Timeless Keychain'],
    ['pet-keychain', 'Pet Keychain'],
    ['leather-snap-keychain', 'Leather Snap Keychain'],
  ]},
  { heading: 'Embroidery', items: [
    ['line-art-embroidery-shirt', 'Line Art Shirt'],
    ['line-art-embroidery-long-sleeve', 'Line Art Long Sleeve'],
    ['line-art-embroidery-jacket', 'Line Art Jacket'],
    ['full-color-embroidery-shirt', 'Full Colour Shirt'],
    ['full-color-embroidery-long-sleeve', 'Full Colour Long Sleeve'],
    ['full-color-embroidery-jacket', 'Full Colour Jacket'],
    ['embroidered-aprons', 'Embroidered Aprons'],
    ['embroidered-towels', 'Embroidered Towels'],
  ]},
  { heading: 'Drinkware', items: [
    ['tumblr-cup', 'Tumbler Cup'],
    ['yeti-mug', 'Yeti Mug'],
    ['rhinestone-bottles', 'Rhinestone Bottle'],
    ['acrylic-drink-stirrer', 'Drink Stirrers'],
  ]},
  { heading: 'Wedding', items: [
    ['custom-cake-topper', 'Cake Topper'],
    ['bridal-sash', 'Bridal Sash'],
    ['fancy-envelopes', 'Fancy Envelopes'],
    ['wedding-guestbook', 'Guestbook'],
    ['wedding-jigsaw-guestbook', 'Jigsaw Guestbook'],
    ['wedding-signage', 'Wedding Signage'],
  ]},
];

async function applyMenu(menuKey, layout) {
  await pg`delete from mega_menu_items where mega_menu_id in (select id from mega_menus where menu_key = ${menuKey})`;
  await pg`delete from mega_menus where menu_key = ${menuKey}`;
  for (let i = 0; i < layout.length; i++) {
    const s = layout[i];
    const [{ id }] = await pg`
      insert into mega_menus (menu_key, section_heading, column_index, display_order)
      values (${menuKey}, ${s.heading}, ${i % 3}, ${i})
      returning id
    `;
    for (let j = 0; j < s.items.length; j++) {
      const [slug, label] = s.items[j];
      await pg`
        insert into mega_menu_items (mega_menu_id, product_slug, label, display_order)
        values (${id}, ${slug}, ${label}, ${j})
      `;
    }
    console.log(`  [${menuKey}] ${s.heading}: ${s.items.length}`);
  }
}

try {
  console.log('Print menu:');
  await applyMenu('print', PRINT);
  console.log('\nGifts menu:');
  await applyMenu('gifts', GIFTS);
  console.log('\n✓ Done');
} finally {
  await pg.end({ timeout: 2 });
}
