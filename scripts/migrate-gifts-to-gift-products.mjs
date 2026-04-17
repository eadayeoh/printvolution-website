#!/usr/bin/env node
/**
 * One-shot migration: copy every product where is_gift=true into the new
 * gift_products table with an auto-detected mode, then DELETE the
 * original Print row (and its child rows — extras, pricing, configurator,
 * faqs, personalisation, related — via cascade).
 *
 * Usage: node scripts/migrate-gifts-to-gift-products.mjs [--dry-run]
 *
 * Mode mapping (admin can change in gift editor any time):
 *   - category = Embroidery  OR  name has "embroidery"      → embroidery
 *   - name has "laser"                                      → laser
 *   - category Jewellery (keychains/necklaces/bracelets)    → laser
 *   - category Personalised Gifts / Lifestyle + photo/frame → uv
 *   - anything else                                         → photo-resize (safe default)
 */
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const envFile = path.resolve(process.cwd(), '.env.local');
for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const DRY = process.argv.includes('--dry-run');

const pg = postgres(process.env.SUPABASE_DB_URL, {
  max: 1, connect_timeout: 30, ssl: { rejectUnauthorized: false },
});

function inferMode(name, categoryName) {
  const n = (name || '').toLowerCase();
  const c = (categoryName || '').toLowerCase();

  if (c === 'embroidery' || n.includes('embroider')) return 'embroidery';
  if (n.includes('laser')) return 'laser';

  // Jewellery: keychains / necklaces / bracelets / rings — laser-engraved metal
  if (c === 'jewellery') return 'laser';

  // UV-printable photo gifts
  if (n.includes('photo') || n.includes('frame') || n.includes('plaque')
      || n.includes('magnet') || n.includes('wall art')
      || n.includes('luggage') || n.includes('woodsnap')
      || n.includes('vinyl') || n.includes('spotify')) return 'uv';

  return 'photo-resize';
}

// Default physical dimensions per mode (admin should fine-tune)
function defaultDims(mode) {
  switch (mode) {
    case 'embroidery':  return { width_mm: 120, height_mm: 80  };
    case 'laser':       return { width_mm: 40,  height_mm: 40  };
    case 'uv':          return { width_mm: 100, height_mm: 100 };
    default:            return { width_mm: 150, height_mm: 100 };
  }
}

try {
  const rows = await pg`
    select p.id, p.slug, p.name, p.description, p.tagline, p.icon,
           p.category_id, p.subcategory_id, p.is_active,
           c.name as category_name,
           ex.image_url, ex.seo_title, ex.seo_desc
    from products p
    left join categories c on c.id = p.category_id
    left join product_extras ex on ex.product_id = p.id
    where p.is_gift = true
    order by p.name;
  `;

  console.log(`${DRY ? '[DRY RUN] ' : ''}Migrating ${rows.length} gift products...\n`);

  // Get the minimum price from product_pricing.rows for each product
  const priceRows = await pg`
    select pp.product_id, pp.rows
    from product_pricing pp
    where pp.product_id in ${pg(rows.map(r => r.id))};
  `;
  const priceMap = new Map();
  for (const pr of priceRows) {
    let min = null;
    for (const row of (pr.rows || [])) {
      for (const price of (row.prices || [])) {
        if (typeof price === 'number' && price > 0 && (min === null || price < min)) {
          min = price;
        }
      }
    }
    priceMap.set(pr.product_id, min || 0);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];
  const modeCounts = { laser: 0, uv: 0, embroidery: 0, 'photo-resize': 0 };

  for (const r of rows) {
    const mode = inferMode(r.name, r.category_name);
    const dims = defaultDims(mode);
    const price = priceMap.get(r.id) ?? 0;

    // Check if already migrated (same slug in gift_products)
    const [existing] = await pg`select id from gift_products where slug = ${r.slug} limit 1;`;
    if (existing) {
      console.log(`  skip   · ${r.name} (already in gift_products)`);
      skipped++;
      continue;
    }

    console.log(`  ${mode.padEnd(13)} · ${r.name}  ($${(price/100).toFixed(2)})`);

    if (!DRY) {
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
            ${mode}, 'none',
            ${dims.width_mm}, ${dims.height_mm}, 2, 3, 1200,
            ${price}, ${r.seo_title ?? null}, ${r.seo_desc ?? null},
            ${r.is_active}
          );
        `;
        // Delete original Print row — child tables cascade via FK definitions.
        // We also explicitly clean up tables that might not cascade (mega_menu_items,
        // bundle_products) so we don't leave dangling references.
        await pg`delete from mega_menu_items where product_slug = ${r.slug};`;
        await pg`delete from bundle_products where product_id = ${r.id};`;
        await pg`delete from product_related where product_id = ${r.id} or related_product_id = ${r.id};`;
        await pg`delete from products where id = ${r.id};`;
        created++;
        modeCounts[mode]++;
      } catch (err) {
        failures.push(`${r.name}: ${err.message}`);
        failed++;
      }
    } else {
      modeCounts[mode]++;
    }
  }

  console.log(`\n${DRY ? '[DRY RUN] ' : ''}Summary:`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already migrated): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\n  By mode:`);
  for (const [mode, count] of Object.entries(modeCounts)) {
    if (count > 0) console.log(`    ${mode.padEnd(14)} ${count}`);
  }
  if (failures.length > 0) {
    console.log(`\n  Failures:`);
    for (const f of failures) console.log(`    - ${f}`);
  }
  if (!DRY && created > 0) {
    console.log(`\n  Originals deleted from 'products' table.`);
  }
} finally {
  await pg.end({ timeout: 5 });
}
