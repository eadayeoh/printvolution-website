// Merge the 7 individual keychain gift_products into one parent
// "Engraved Keychain" with each original as a variant.

import { openSql, mergeGiftGroup } from './_lib-merge-gift-group.mjs';

const sql = await openSql();
try {
  console.log('Merging keychains…');
  await mergeGiftGroup(sql, {
    parent: {
      slug: 'engraved-keychain',
      name: 'Engraved Keychain',
      tagline: 'Pick a keychain design — we laser-engrave your text or photo.',
      description:
        'One parent for every metallic / reflective / Spotify keychain design. Customer uploads their photo or text once and sees it previewed across every keychain style in a grid — no more clicking through seven product pages to compare.',
      mode: 'laser',
    },
    sources: [
      { source_slug: '3d-bar-keychain',              variant_slug: '3d-bar',        variant_name: '3D Bar' },
      { source_slug: 'circular-metallic-keychain',   variant_slug: 'circular',      variant_name: 'Circular' },
      { source_slug: 'heartlink-metallic-keychain',  variant_slug: 'heartlink',     variant_name: 'HeartLink' },
      { source_slug: 'inspirational-keyring',        variant_slug: 'inspirational', variant_name: 'Inspirational Keyring' },
      { source_slug: 'reflective-rectangle-keychain', variant_slug: 'reflective',  variant_name: 'Reflective' },
      { source_slug: 'spotify-keychain',             variant_slug: 'spotify',       variant_name: 'Spotify' },
      { source_slug: 'timeless-keychain',            variant_slug: 'timeless',      variant_name: 'Timeless' },
    ],
  });
  console.log('Done.');
} finally {
  await sql.end();
}
