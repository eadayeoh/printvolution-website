// Rewrite LED Bases customer-facing copy — name, tagline, SEO meta,
// keyword footer, long description. Run once.

import { openSql } from './_lib-merge-gift-group.mjs';

const PATCH = {
  name: 'LED Photo Lamp Base',
  tagline: 'Upload a photo · warm LED acrylic on wood or black base.',
  seo_title: 'LED Photo Lamp Base Singapore — Engraved Acrylic Warm LED Gifts',
  seo_desc: 'Personalised LED photo lamp base in Singapore — laser-engraved acrylic on warm wood, wood circle or matte black base. Upload any photo, pick line art or realistic. 5-day turnaround, islandwide delivery.',
  seo_body: 'LED photo lamp base Singapore — laser-engraved acrylic on warm wood or matte black base. Birthday gifts, anniversary, Mother\'s Day, baby keepsakes, corporate hampers. A5 / A4 portrait sizes, 5-day turnaround, Paya Lebar Square walk-in collection.',
  description: 'Swap your phone wallpaper for something real. Pick a base — warm wood rectangle, wood circle, or matte black with a Bluetooth speaker — upload any photo, and we laser-engrave it into a standing acrylic panel that lights up soft warm white when you flick the switch. A quiet nightlight for a kid\'s room. A retirement gift that outclasses yet another pen. A bar-top family portrait that glows at 10pm.',
};

const sql = await openSql();
try {
  const [before] = await sql`select slug, name, tagline, seo_title from gift_products where slug = 'led-bases'`;
  if (!before) { console.log('✗ LED Bases product not found'); process.exit(1); }
  console.log('Before:');
  console.log('  name:', before.name);
  console.log('  tagline:', before.tagline);

  await sql`
    update gift_products
       set name = ${PATCH.name},
           tagline = ${PATCH.tagline},
           seo_title = ${PATCH.seo_title},
           seo_desc = ${PATCH.seo_desc},
           seo_body = ${PATCH.seo_body},
           description = ${PATCH.description},
           updated_at = now()
     where slug = 'led-bases'
  `;

  const [after] = await sql`select name, tagline, seo_title, seo_desc, seo_body, description from gift_products where slug = 'led-bases'`;
  console.log('\nAfter:');
  for (const [k, v] of Object.entries(after)) {
    console.log(`  ${k}: ${String(v).slice(0, 160)}${String(v).length > 160 ? '…' : ''}`);
  }
} finally {
  await sql.end();
}
