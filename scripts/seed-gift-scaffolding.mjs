// One-off seed: set sensible input_mode defaults on the merged gift
// parents + configure the 3D Bar keychain's 4-surface setup so admin
// opens the variant editor to a working starting point instead of
// zero config. Idempotent — safe to re-run.

import { openSql } from './_lib-merge-gift-group.mjs';
const sql = await openSql();

try {
  console.log('Setting parent input_mode defaults…');
  const parentInputModes = [
    { slug: 'engraved-necklace-bracelet', mode: 'text'  },
    { slug: 'engraved-keychain',          mode: 'text'  },
    { slug: 'line-art-embroidery',        mode: 'photo' },
    { slug: 'full-colour-embroidery',     mode: 'photo' },
    { slug: 'led-base',                   mode: 'photo' },
  ];
  for (const { slug, mode } of parentInputModes) {
    const r = await sql`
      update gift_products set input_mode = ${mode}
      where slug = ${slug}
      returning slug, input_mode
    `;
    if (r.length > 0) console.log(`  ${r[0].slug.padEnd(32)} → input_mode=${r[0].input_mode}`);
    else console.log(`  ${slug.padEnd(32)} → NOT FOUND`);
  }

  console.log('\nConfiguring 3D Bar keychain surfaces (4 sides)…');
  const [parent] = await sql`select id from gift_products where slug = 'engraved-keychain'`;
  const [variant] = parent
    ? await sql`
        select id, mockup_url, mockup_area, surfaces
        from gift_product_variants
        where gift_product_id = ${parent.id} and slug = '3d-bar'
      `
    : [];
  if (!variant) {
    console.log('  engraved-keychain / 3d-bar variant not found — skipping.');
  } else {
    // If admin hasn't uploaded variant mockup yet, all four surfaces
    // start with an empty mockup_url — admin has to fill one per side
    // (front / back / left / right). The area defaults to a centered
    // engraving region; admin can tune it per face.
    const defaultArea = { x: 15, y: 35, width: 70, height: 30 };
    const proto = (label, id) => ({
      id,
      label,
      accepts: 'text',
      mockup_url: variant.mockup_url || '',
      mockup_area: variant.mockup_area || defaultArea,
      max_chars: 15,
      font_family: null,
      font_size_pct: null,
      color: null,
      mode: null, // inherit parent (laser)
    });
    const surfaces = [
      proto('Front', 'front'),
      proto('Back',  'back'),
      proto('Left',  'left'),
      proto('Right', 'right'),
    ];
    // Preserve admin-authored surfaces if they already exist
    const existing = Array.isArray(variant.surfaces) ? variant.surfaces : [];
    if (existing.length > 0) {
      console.log(`  3d-bar already has ${existing.length} surfaces — leaving alone.`);
    } else {
      await sql`
        update gift_product_variants
          set surfaces = ${sql.json(surfaces)}
          where id = ${variant.id}
      `;
      console.log(`  3d-bar → surfaces [front, back, left, right] (text, max 15 chars each)`);
    }
  }

  console.log('\nDone.');
} finally {
  await sql.end();
}
