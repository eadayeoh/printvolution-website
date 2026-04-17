#!/usr/bin/env node
/**
 * Migrate the remaining Print products referenced from the Gifts mega
 * menu but still sitting in the `products` table — Drinkware, Wedding,
 * Frames, Keychains.
 */
import fs from 'node:fs';
import postgres from 'postgres';
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });

// slug → { mode, width_mm, height_mm }
const ASSIGN = {
  // Drinkware — UV print on a cylindrical or flat surface
  'tumblr-cup':          { mode: 'uv',    width_mm: 220, height_mm: 90 },
  'yeti-mug':            { mode: 'uv',    width_mm: 220, height_mm: 90 },
  'rhinestone-bottles':  { mode: 'uv',    width_mm: 200, height_mm: 80 },
  'acrylic-drink-stirrer':{ mode: 'uv',   width_mm: 40,  height_mm: 120 },

  // Frames — UV photo print
  'city-map-photo-frame':   { mode: 'uv', width_mm: 200, height_mm: 250 },
  'star-map-photo-frame':   { mode: 'uv', width_mm: 200, height_mm: 250 },
  'netflix-photo-frame':    { mode: 'uv', width_mm: 200, height_mm: 250 },

  // Wedding — mostly layout-based (photo-resize)
  'custom-cake-topper':      { mode: 'laser',        width_mm: 150, height_mm: 100 },
  'bridal-sash':             { mode: 'photo-resize', width_mm: 600, height_mm: 100 },
  'fancy-envelopes':         { mode: 'photo-resize', width_mm: 110, height_mm: 220 },
  'wedding-guestbook':       { mode: 'photo-resize', width_mm: 210, height_mm: 148 },
  'wedding-jigsaw-guestbook':{ mode: 'photo-resize', width_mm: 210, height_mm: 148 },
  'wedding-signage':         { mode: 'photo-resize', width_mm: 300, height_mm: 400 },

  // Keychains — laser-engraved
  'pet-keychain':         { mode: 'laser', width_mm: 50, height_mm: 50 },
  'leather-snap-keychain':{ mode: 'laser', width_mm: 50, height_mm: 70 },
};

try {
  const slugs = Object.keys(ASSIGN);
  const rows = await pg`
    select p.id, p.slug, p.name, p.description, p.tagline, p.is_active, p.category_id,
           ex.image_url, ex.seo_title, ex.seo_desc
    from products p
    left join product_extras ex on ex.product_id = p.id
    where p.slug = any(${slugs})
    order by p.name
  `;

  // Minimum price from pricing rows
  const priceRows = await pg`
    select product_id, rows from product_pricing where product_id = any(${rows.map(r => r.id)})
  `;
  const priceMap = new Map();
  for (const pr of priceRows) {
    let min = null;
    for (const row of (pr.rows || [])) {
      for (const p of (row.prices || [])) {
        if (typeof p === 'number' && p > 0 && (min === null || p < min)) min = p;
      }
    }
    priceMap.set(pr.product_id, min || 0);
  }

  let created = 0, skipped = 0, failed = 0;
  const modes = { laser: 0, uv: 0, embroidery: 0, 'photo-resize': 0 };

  for (const r of rows) {
    const assign = ASSIGN[r.slug];
    if (!assign) { console.log(`skip (no mapping): ${r.slug}`); continue; }

    const [exists] = await pg`select id from gift_products where slug = ${r.slug} limit 1`;
    if (exists) { console.log(`skip (exists): ${r.name}`); skipped++; continue; }

    const price = priceMap.get(r.id) || 0;
    console.log(`${assign.mode.padEnd(13)} · ${r.name.padEnd(30)} $${(price/100).toFixed(2)}`);

    try {
      await pg`
        insert into gift_products (
          slug, name, description, tagline, thumbnail_url,
          category_id, mode, template_mode,
          width_mm, height_mm, bleed_mm, safe_zone_mm, min_source_px,
          base_price_cents, seo_title, seo_desc, is_active
        ) values (
          ${r.slug}, ${r.name}, ${r.description ?? null}, ${r.tagline ?? null},
          ${r.image_url ?? null}, ${r.category_id ?? null},
          ${assign.mode}, 'none',
          ${assign.width_mm}, ${assign.height_mm}, 2, 3, 1200,
          ${price}, ${r.seo_title ?? null}, ${r.seo_desc ?? null},
          ${r.is_active}
        )
      `;
      await pg`delete from mega_menu_items where product_slug = ${r.slug} and mega_menu_id in (
        select id from mega_menus where menu_key = 'print'
      )`;
      await pg`delete from bundle_products where product_id = ${r.id}`;
      await pg`delete from product_related where product_id = ${r.id} or related_product_id = ${r.id}`;
      await pg`delete from products where id = ${r.id}`;
      created++;
      modes[assign.mode]++;
    } catch (err) {
      console.log(`  ✗ ${err.message}`);
      failed++;
    }
  }

  console.log(`\nMigrated: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log('By mode:', modes);
} finally {
  await pg.end({ timeout: 2 });
}
