// Merge the 9 individual necklace / bracelet gift_products into one
// parent "Engraved Necklace & Bracelet" with each original as a
// variant. Customer sees one page with a grid of 9 designs.

import { openSql, mergeGiftGroup } from './_lib-merge-gift-group.mjs';

const sql = await openSql();
try {
  console.log('Merging necklaces & bracelets…');
  await mergeGiftGroup(sql, {
    parent: {
      slug: 'engraved-necklace-bracelet',
      name: 'Engraved Necklace & Bracelet',
      tagline: 'Pick a design. We laser-engrave your text or photo.',
      description:
        'One parent for every engraved necklace and bracelet design — bar, book, heart, sleek, envelope, bracelet. Type your text or upload your photo once; preview it on every design at a glance and pick the one you want.',
      mode: 'laser',
    },
    sources: [
      { source_slug: 'bar-necklace',                      variant_slug: 'bar',              variant_name: 'Bar Necklace' },
      { source_slug: '3d-vertical-bar-necklace',          variant_slug: '3d-vertical-bar',  variant_name: '3D Vertical Bar Necklace' },
      { source_slug: 'book-necklace',                     variant_slug: 'book',             variant_name: 'Book Necklace' },
      { source_slug: 'duo-heart-necklace',                variant_slug: 'duo-heart',        variant_name: 'Duo Heart Necklace' },
      { source_slug: 'forever-necklace',                  variant_slug: 'forever',          variant_name: 'Forever Necklace' },
      { source_slug: 'heart-charm-necklace',              variant_slug: 'heart-charm',      variant_name: 'Heart Charm Necklace' },
      { source_slug: 'sleek-necklace',                    variant_slug: 'sleek',            variant_name: 'Sleek Necklace' },
      { source_slug: 'secret-message-envelope-necklace',  variant_slug: 'secret-envelope',  variant_name: 'Secret Message Envelope' },
      { source_slug: 'disc-metallic-bracelet',            variant_slug: 'metallic-bracelet', variant_name: 'Metallic Bracelet' },
    ],
  });
  console.log('Done.');
} finally {
  await sql.end();
}
