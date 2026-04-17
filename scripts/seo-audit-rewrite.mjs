#!/usr/bin/env node
/**
 * SEO audit + rewrite: for every active product (Print + Gift),
 * produce a keyword-rich title (<= 60 chars) and meta description
 * (<= 155 chars) that:
 *
 *  - leads with the highest-converting keyword for that product
 *  - includes the location (Singapore) — critical for local search
 *  - includes a price or tier-specific hook where relevant
 *  - includes urgency / trust signals customers click on (same-day,
 *    free delivery, express, etc.)
 *  - ends with the brand "| Printvolution"
 *
 * Keyword priorities derived from search-intent data for SG printing
 * + personalised-gift queries. Highest-volume head terms first.
 *
 * Usage:
 *   node scripts/seo-audit-rewrite.mjs          # dry-run (preview)
 *   node scripts/seo-audit-rewrite.mjs --apply  # write to DB
 */
import fs from 'node:fs';
import postgres from 'postgres';
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const APPLY = process.argv.includes('--apply');
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });
const BRAND = 'Printvolution';
const TITLE_MAX = 60;
const DESC_MAX = 155;

function clip(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd().replace(/[,.:;]$/, '') + '…';
}

function formatSGD(cents) {
  return 'S$' + (Number(cents || 0) / 100).toFixed(0);
}

// ---------------------------------------------------------------------------
// Keyword heuristics per slug / category
// ---------------------------------------------------------------------------
// Returns the high-converting head-term for a product. Falls back to name.

const PRINT_HEAD_TERMS = {
  'name-card': 'Name Card Printing',
  'luxury-business-card': 'Luxury Business Card Printing',
  'pvc-card': 'PVC Card Printing',
  'transparent-card': 'Transparent Card Printing',
  'nfc-card': 'NFC Business Card',
  'letterhead': 'Letterhead Printing',
  'envelopes': 'Envelope Printing',
  'ncr-form': 'NCR Form Printing',
  'rubber-stamp': 'Custom Rubber Stamp',
  'flyers': 'Flyer Printing',
  'long-brochures': 'Brochure Printing',
  'books': 'Booklet Printing',
  'loose-sheets': 'A4 Loose Sheet Printing',
  'stickers': 'Sticker Printing',
  'uv-dtf-sticker': 'UV DTF Sticker Printing',
  'roll-up-banner': 'Roll Up Banner',
  'x-stand-banner': 'X-Stand Banner Printing',
  'pvc-canvas': 'PVC Canvas Banner',
  'poster': 'Poster Printing',
  'life-size-standee': 'Life Size Standee',
  'acrylic-signage': 'Acrylic Signage',
  'easel-stand': 'Easel Stand Printing',
  'table-tent': 'Table Tent Cards',
  'wobbler': 'POS Wobbler Printing',
  'door-hanger': 'Door Hanger Printing',
  'hand-fan': 'Custom Hand Fan Printing',
  'car-decal': 'Car Decal Printing',
  'round-neck-shirts': 'T-Shirt Printing',
  'polo-shirts': 'Polo Shirt Printing',
  'aprons': 'Apron Printing',
  'hang-tag': 'Hang Tag Printing',
  'paper-bag': 'Paper Bag Printing',
  'tote-bag': 'Tote Bag Printing',
  'money-packet': 'Custom Ang Bao Printing',
  'embroidery': 'Custom Embroidery',
};

const GIFT_HEAD_TERMS = {
  // Photo frames & plaques
  'led-photo-frame': 'LED Photo Frame',
  'led-light-reveal-frame': 'LED Light Reveal Frame',
  '360-rotating-figurine': 'Rotating Figurine Photo Frame',
  'acrylic-photo-wall-art': 'Acrylic Photo Print',
  'woodsnap': 'Wood Photo Print',
  'song-lyrics-photo-frame': 'Song Lyrics Photo Frame',
  'spotify-music-plaque': 'Spotify Music Plaque',
  'vinyl-memory-disc': 'Vinyl Memory Disc',
  'city-map-photo-frame': 'City Map Photo Frame',
  'star-map-photo-frame': 'Star Map Photo Frame',
  'netflix-photo-frame': 'Netflix Memory Photo Frame',
  'aluminium-fridge-magnets': 'Photo Fridge Magnets',
  'bluetooth-spotify-magnet': 'Bluetooth Spotify Magnet',
  'led-black-base': 'LED Photo Display Base',
  'led-wood-circle-base': 'LED Wood Photo Base',
  'led-wood-rectangle-base': 'LED Wood Photo Base',
  'luggage-tag': 'Personalised Luggage Tag',
  // Jewellery
  'bar-necklace': 'Personalised Bar Necklace',
  '3d-vertical-bar-necklace': '3D Vertical Bar Necklace',
  'book-necklace': 'Custom Book Necklace',
  'duo-heart-necklace': 'Duo Heart Necklace',
  'forever-necklace': 'Forever Necklace',
  'heart-charm-necklace': 'Heart Charm Necklace',
  'sleek-necklace': 'Personalised Sleek Necklace',
  'secret-message-envelope-necklace': 'Secret Message Necklace',
  'disc-metallic-bracelet': 'Personalised Disc Bracelet',
  // Keychains
  '3d-bar-keychain': '3D Bar Keychain',
  'circular-metallic-keychain': 'Circular Metal Keychain',
  'heartlink-metallic-keychain': 'HeartLink Keychain',
  'inspirational-keyring': 'Inspirational Keyring',
  'reflective-rectangle-keychain': 'Reflective Keychain',
  'spotify-keychain': 'Spotify Keychain',
  'timeless-keychain': 'Custom Metal Keychain',
  'pet-keychain': 'Personalised Pet Keychain',
  'leather-snap-keychain': 'Leather Snap Keychain',
  // Embroidery
  'line-art-embroidery-shirt': 'Line Art Embroidery Shirt',
  'line-art-embroidery-long-sleeve': 'Line Art Embroidery Long Sleeve',
  'line-art-embroidery-jacket': 'Line Art Embroidery Jacket',
  'full-color-embroidery-shirt': 'Full Colour Embroidery Shirt',
  'full-color-embroidery-long-sleeve': 'Full Colour Embroidery Long Sleeve',
  'full-color-embroidery-jacket': 'Full Colour Embroidery Jacket',
  'embroidered-aprons': 'Custom Embroidered Apron',
  'embroidered-towels': 'Embroidered Towel',
  // Drinkware
  'tumblr-cup': 'Personalised Tumbler',
  'yeti-mug': 'Custom Yeti Mug',
  'rhinestone-bottles': 'Rhinestone Water Bottle',
  'acrylic-drink-stirrer': 'Custom Drink Stirrer',
  // Wedding
  'custom-cake-topper': 'Custom Cake Topper',
  'bridal-sash': 'Custom Bridal Sash',
  'fancy-envelopes': 'Custom Fancy Envelope',
  'wedding-guestbook': 'Wedding Guestbook',
  'wedding-jigsaw-guestbook': 'Wedding Jigsaw Guestbook',
  'wedding-signage': 'Custom Wedding Signage',
};

// Conversion hooks — tiered by price to pick the right angle
function printHook(name, priceCents) {
  if (priceCents && priceCents < 5000) return 'Express 24h';
  if (priceCents && priceCents < 15000) return 'Same-day';
  return 'Free pickup';
}
function giftHook(mode) {
  switch (mode) {
    case 'laser': return 'Laser Engraved';
    case 'uv': return 'UV Printed';
    case 'embroidery': return 'Hand-embroidered';
    default: return 'Photo Gift';
  }
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function buildPrintMeta(p) {
  const head = PRINT_HEAD_TERMS[p.slug] ?? p.name;
  // Title: head + Singapore + brand
  const rawTitle = `${head} Singapore | ${BRAND}`;
  const title = clip(rawTitle, TITLE_MAX);

  // Description: price + benefit + location + urgency
  const pricePart = p.min_price_cents ? `from ${formatSGD(p.min_price_cents)}` : 'affordable rates';
  const urgency = printHook(p.name, p.min_price_cents);
  const raw = `${head} in Singapore ${pricePart}. Order online, we print fast at Paya Lebar Square. ${urgency}, free pickup, island-wide delivery.`;
  const desc = clip(raw, DESC_MAX);
  return { seo_title: title, seo_desc: desc };
}

function buildGiftMeta(g) {
  const head = GIFT_HEAD_TERMS[g.slug] ?? `Personalised ${g.name}`;
  const hook = giftHook(g.mode);
  // Title
  const rawTitle = `${head} Singapore | ${BRAND}`;
  const title = clip(rawTitle, TITLE_MAX);

  // Description: personalised + upload-a-photo + location + trust
  const priceBit = g.base_price_cents ? `from ${formatSGD(g.base_price_cents)}` : '';
  const parts = [
    `${head} in Singapore ${priceBit}`.trim().replace(/\s+/g, ' '),
    `${hook}, made to order at Paya Lebar Square`,
    `Upload a photo, preview, checkout`,
  ];
  const raw = parts.filter(Boolean).join('. ') + '.';
  const desc = clip(raw, DESC_MAX);
  return { seo_title: title, seo_desc: desc };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

try {
  console.log(APPLY ? '── APPLY ──' : '── DRY RUN ──\n');

  // Print — we need pricing info to pick the right hook
  const prints = await pg`
    select p.id, p.slug, p.name,
           (
             select min(price)
             from product_pricing pp, lateral jsonb_array_elements(pp.rows) r, lateral jsonb_array_elements(r->'prices') price_val,
             lateral (select (price_val)::int as price) _
             where pp.product_id = p.id and (price_val)::int > 0
           ) as min_price_cents
    from products p
    where p.is_active = true
    order by p.name
  `.catch(async () => {
    // Fallback — many Supabase projects error on that subquery variant. Use simpler lookup.
    return pg`
      select p.id, p.slug, p.name, null::int as min_price_cents
      from products p where p.is_active = true order by p.name`;
  });

  let pDone = 0;
  for (const p of prints) {
    const meta = buildPrintMeta(p);
    console.log(`  print · ${p.slug.padEnd(32)} T:${meta.seo_title.length}ch  D:${meta.seo_desc.length}ch`);
    console.log(`         "${meta.seo_title}"`);
    console.log(`         "${meta.seo_desc}"`);
    if (APPLY) {
      const [ex] = await pg`select product_id from product_extras where product_id = ${p.id}`;
      if (ex) {
        await pg`update product_extras set seo_title = ${meta.seo_title}, seo_desc = ${meta.seo_desc} where product_id = ${p.id}`;
      } else {
        await pg`insert into product_extras (product_id, seo_title, seo_desc) values (${p.id}, ${meta.seo_title}, ${meta.seo_desc})`;
      }
    }
    pDone++;
  }

  // Gift
  const gifts = await pg`
    select id, slug, name, mode, base_price_cents
    from gift_products where is_active = true order by name
  `;
  let gDone = 0;
  for (const g of gifts) {
    const meta = buildGiftMeta(g);
    console.log(`  gift  · ${g.slug.padEnd(32)} T:${meta.seo_title.length}ch  D:${meta.seo_desc.length}ch`);
    console.log(`         "${meta.seo_title}"`);
    console.log(`         "${meta.seo_desc}"`);
    if (APPLY) {
      await pg`update gift_products set seo_title = ${meta.seo_title}, seo_desc = ${meta.seo_desc} where id = ${g.id}`;
    }
    gDone++;
  }

  console.log(`\n${APPLY ? 'Applied' : 'Would apply'}: ${pDone} print + ${gDone} gift = ${pDone + gDone}`);
} finally {
  await pg.end({ timeout: 2 });
}
