#!/usr/bin/env node
/**
 * Read-only audit: shows how many print + gift products have SEO title/desc
 * populated, and lists any that don't. Run before/after a rewrite to verify
 * coverage.
 */
import fs from 'node:fs';
import postgres from 'postgres';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });

try {
  const prints = await pg`
    select p.id, p.slug, p.name, p.is_active,
           pe.seo_title, pe.seo_desc
    from products p
    left join product_extras pe on pe.product_id = p.id
    order by p.name
  `;

  const gifts = await pg`
    select id, slug, name, is_active, seo_title, seo_desc
    from gift_products
    order by name
  `;

  const pMissing = prints.filter((p) => !p.seo_title || !p.seo_desc);
  const gMissing = gifts.filter((g) => !g.seo_title || !g.seo_desc);

  console.log(`── PRINT (${prints.length} total, ${prints.filter((p) => p.is_active).length} active) ──`);
  console.log(`   With SEO: ${prints.length - pMissing.length}`);
  console.log(`   Missing:  ${pMissing.length}`);
  if (pMissing.length) {
    for (const p of pMissing) {
      const flags = [!p.seo_title && 'title', !p.seo_desc && 'desc'].filter(Boolean).join('+');
      console.log(`   - ${p.slug.padEnd(36)} active=${p.is_active}  missing: ${flags}`);
    }
  }

  console.log(`\n── GIFT (${gifts.length} total, ${gifts.filter((g) => g.is_active).length} active) ──`);
  console.log(`   With SEO: ${gifts.length - gMissing.length}`);
  console.log(`   Missing:  ${gMissing.length}`);
  if (gMissing.length) {
    for (const g of gMissing) {
      const flags = [!g.seo_title && 'title', !g.seo_desc && 'desc'].filter(Boolean).join('+');
      console.log(`   - ${g.slug.padEnd(36)} active=${g.is_active}  missing: ${flags}`);
    }
  }

  console.log(`\nTotal missing: ${pMissing.length + gMissing.length} of ${prints.length + gifts.length}`);

  // Spot-check car-decal specifically since the user flagged it
  const car = prints.find((p) => p.slug === 'car-decal');
  if (car) {
    console.log(`\n── car-decal ──`);
    console.log(`  id:         ${car.id}`);
    console.log(`  active:     ${car.is_active}`);
    console.log(`  seo_title:  ${JSON.stringify(car.seo_title)}`);
    console.log(`  seo_desc:   ${JSON.stringify(car.seo_desc)}`);
  } else {
    console.log(`\n── car-decal not found as a print product ──`);
  }
} finally {
  await pg.end({ timeout: 2 });
}
