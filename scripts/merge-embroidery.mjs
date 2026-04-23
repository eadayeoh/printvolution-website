// Merge the 6 embroidery gift_products into TWO parents:
//   - "Line Art Embroidery"   (shirt / long sleeve / jacket)
//   - "Full Colour Embroidery" (shirt / long sleeve / jacket)
// User uploads a photo once and sees the embroidered design on every
// apparel style in a grid.

import { openSql, mergeGiftGroup } from './_lib-merge-gift-group.mjs';

const sql = await openSql();
try {
  console.log('Merging embroidery — Line Art…');
  await mergeGiftGroup(sql, {
    parent: {
      slug: 'line-art-embroidery',
      name: 'Line Art Embroidery',
      tagline: 'A minimal line-outline from your photo, stitched onto the apparel of your choice.',
      description:
        'One parent for line-art embroidery across every apparel form. Upload a photo once; we turn it into a single-thread outline and show you how it stitches onto a t-shirt, long sleeve, or jacket side by side.',
      mode: 'embroidery',
    },
    sources: [
      { source_slug: 'line-art-embroidery-shirt',       variant_slug: 't-shirt',    variant_name: 'T-shirt' },
      { source_slug: 'line-art-embroidery-long-sleeve', variant_slug: 'long-sleeve', variant_name: 'Long sleeve' },
      { source_slug: 'line-art-embroidery-jacket',      variant_slug: 'jacket',     variant_name: 'Jacket' },
    ],
  });

  console.log('Merging embroidery — Full Colour…');
  await mergeGiftGroup(sql, {
    parent: {
      slug: 'full-colour-embroidery',
      name: 'Full Colour Embroidery',
      tagline: 'Photo-realistic multi-thread embroidery, on the apparel of your choice.',
      description:
        'One parent for full-colour (photo-realistic) embroidery across every apparel form. Upload a photo once; we posterise into an embroidery-friendly palette and show you how it stitches onto a t-shirt, long sleeve, or jacket side by side.',
      mode: 'embroidery',
    },
    sources: [
      { source_slug: 'full-color-embroidery-shirt',       variant_slug: 't-shirt',    variant_name: 'T-shirt' },
      { source_slug: 'full-color-embroidery-long-sleeve', variant_slug: 'long-sleeve', variant_name: 'Long sleeve' },
      { source_slug: 'full-color-embroidery-jacket',      variant_slug: 'jacket',     variant_name: 'Jacket' },
    ],
  });
  console.log('Done.');
} finally {
  await sql.end();
}
