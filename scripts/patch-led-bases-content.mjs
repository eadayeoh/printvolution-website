// Rewrite LED Bases copy from the ACTUAL config:
//   - 3 bases: Black (S$55, Bluetooth speaker + 7-colour LED + USB/battery)
//              Wood Circle (S$55, 7-colour LED + remote + USB/battery)
//              Wood Rectangle (S$40, warm light + USB only)
//   - 2 sizes: A5 portrait (148×210, +S$0), A4 portrait (210×297, +S$10)
//   - 2 styles: Line Art, Realistic Imagery (laser engraving)
//   - 1-day turnaround
//
// Accurate facts only — no invented workshop location or cure time.

import { openSql } from './_lib-merge-gift-group.mjs';

const PATCH = {
  name: 'LED Photo Lamp Base',
  tagline: 'From S$40 · Upload a photo, pick your base, light it up.',
  seo_title: 'LED Photo Lamp Base Singapore · Engraved Acrylic from S$40',
  seo_desc: 'Personalised LED photo lamp base in Singapore. Pick Black (Bluetooth speaker + 7-colour LED), Wood Circle (remote + 7-colour LED) or Wood Rectangle (warm light). Laser-engraved acrylic, A5 or A4, 1-day turnaround.',
  seo_body: 'LED photo lamp base Singapore — laser-engraved acrylic on Black base with Bluetooth speaker, Wood Circle with remote, or Wood Rectangle warm light. Line art or realistic imagery engraving, A5 (148×210mm) or A4 (210×297mm), 1-day turnaround.',
  description: 'Three bases, one photo, one lamp. The Black base packs a Bluetooth speaker and 7-colour LED. The Wood Circle ships with a remote and runs the same 7 colours. The Wood Rectangle keeps it pure — warm white light, USB-powered, under S$50. Upload any photo; pick line art for crisp vector strokes or realistic imagery for tonal greyscale engraving. A5 (148×210mm) or A4 (210×297mm) acrylic panel, engraved overnight for next-day collection.',
};

const sql = await openSql();
try {
  const [before] = await sql`select slug, name, tagline from gift_products where slug = 'led-bases'`;
  if (!before) { console.log('LED Bases not found'); process.exit(1); }
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
    console.log(`  ${k}: ${v}`);
    console.log('');
  }
} finally {
  await sql.end();
}
