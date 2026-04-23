// Merge the 3 LED base gift_products into one parent "LED Base" with
// black / wood-circle / wood-rectangle as variants.

import { openSql, mergeGiftGroup } from './_lib-merge-gift-group.mjs';

const sql = await openSql();
try {
  console.log('Merging LED bases…');
  await mergeGiftGroup(sql, {
    parent: {
      slug: 'led-base',
      name: 'LED Base',
      tagline: 'Warm LED lamp base — pick the finish that suits the room.',
      description:
        'One parent for every LED base finish. Customer uploads a photo of the piece once (acrylic engraving or print), then picks which base it sits on: matte black, wood circle, or wood rectangle.',
      mode: 'photo-resize',
    },
    sources: [
      { source_slug: 'led-black-base',         variant_slug: 'black',          variant_name: 'Black Base' },
      { source_slug: 'led-wood-circle-base',   variant_slug: 'wood-circle',    variant_name: 'Wood Circle Base' },
      { source_slug: 'led-wood-rectangle-base', variant_slug: 'wood-rectangle', variant_name: 'Wood Rectangle Base' },
    ],
  });
  console.log('Done.');
} finally {
  await sql.end();
}
