// Turn on the shape picker (cutout + rectangle) on the 3 acrylic gift
// products that were the feature's brief. Template-kind row is left off
// for now — only one template exists repo-wide, not enough to populate
// a meaningful template sub-grid per product. Admin can add a template
// row once the template catalogue grows, via the Design tab editor.

import { openSql } from './_lib-merge-gift-group.mjs';

const TARGETS = ['acrylic-photo-wall-art', 'custom-cake-topper', 'spotify-music-plaque'];

const SHAPE_OPTIONS_DEFAULT = [
  { kind: 'cutout',    label: 'Follow my photo', price_delta_cents: 0 },
  { kind: 'rectangle', label: 'Full photo',       price_delta_cents: 0 },
];

const sql = await openSql();
try {
  const before = await sql`
    select slug, name, shape_options
      from gift_products
     where slug = any(${TARGETS})
     order by slug
  `;
  console.log('Before:');
  for (const row of before) {
    const has = row.shape_options && Array.isArray(row.shape_options) && row.shape_options.length > 0;
    console.log(`  ${row.slug}  —  ${has ? 'already has shape_options' : 'no shape_options'}`);
  }

  for (const slug of TARGETS) {
    await sql`
      update gift_products
         set shape_options = ${sql.json(SHAPE_OPTIONS_DEFAULT)},
             updated_at = now()
       where slug = ${slug}
    `;
  }

  const after = await sql`
    select slug,
           jsonb_array_length(coalesce(shape_options, '[]'::jsonb)) as shape_count
      from gift_products
     where slug = any(${TARGETS})
     order by slug
  `;
  console.log('\nAfter:');
  for (const row of after) {
    console.log(`  ${row.slug}  —  ${row.shape_count} shapes configured`);
  }
} finally {
  await sql.end();
}
