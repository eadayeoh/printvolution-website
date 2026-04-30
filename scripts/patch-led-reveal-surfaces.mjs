// Set up Side 1 + Side 2 photo surfaces for the LED Light Reveal Frame.
//
// The product had no variants and no mockup. Customers couldn't upload.
// This patch creates one default variant carrying both surfaces — Side 1
// (the front line-art layer, visible when the LED is off) and Side 2
// (the rear photo layer, revealed when the LED is on).
//
// Both accept photo. Both share the variant mockup + mockup_area for now;
// admin can refine each surface's mockup_area in the variants editor.
//
// mockup_url placeholder = the LED Frame's mockup (same wood-frame family).
// Admin should replace this with a real LED Light Reveal Frame photo when
// available — that change is one click in the admin Variants tab.
//
// Idempotent: re-running updates the variant in place rather than
// inserting duplicates.

import { openSql } from './_lib-merge-gift-group.mjs';

const PRODUCT_SLUG = 'led-light-reveal-frame';
const VARIANT_SLUG = 'default';

// Borrowed mockup — same wood-frame USB-lit look as the reveal frame.
// Real reveal-frame photo can replace this in the admin Variants panel.
const PLACEHOLDER_MOCKUP_URL =
  'https://zblzeztisjzjcnvarwcw.supabase.co/storage/v1/object/public/product-images/mockup-led-frame-1777062042386-bfm6iu.jpg';

// Inside-the-frame visible window (rough centred rectangle — admin can
// drag-resize in the variants editor once a real reveal-frame mockup is
// uploaded).
const MOCKUP_AREA = { x: 18, y: 16, width: 64, height: 60 };

const SURFACES = [
  {
    id: 'side-1',
    label: 'Side 1 · Lights Off layer',
    accepts: 'photo',
    mockup_url: '',
    mockup_area: MOCKUP_AREA,
    max_chars: null,
    font_family: null,
    font_size_pct: null,
    color: null,
    mode: null,
    price_delta_cents: 0,
  },
  {
    id: 'side-2',
    label: 'Side 2 · Lights On layer',
    accepts: 'photo',
    mockup_url: '',
    mockup_area: MOCKUP_AREA,
    max_chars: null,
    font_family: null,
    font_size_pct: null,
    color: null,
    mode: null,
    price_delta_cents: 0,
  },
];

const sql = await openSql();
try {
  const [product] = await sql`
    select id, slug, name, mockup_url, thumbnail_url
    from gift_products
    where slug = ${PRODUCT_SLUG}
  `;
  if (!product) throw new Error(`Product not found: ${PRODUCT_SLUG}`);
  console.log('Product:', product.slug, '·', product.id);

  // Backfill product mockup_url + thumbnail_url so the storefront grid +
  // PDP empty state have something to render. Only set when null — admin
  // edits aren't stomped.
  if (!product.mockup_url || !product.thumbnail_url) {
    await sql`
      update gift_products
      set mockup_url = coalesce(mockup_url, ${PLACEHOLDER_MOCKUP_URL}),
          thumbnail_url = coalesce(thumbnail_url, ${PLACEHOLDER_MOCKUP_URL})
      where id = ${product.id}
    `;
    console.log('  ✓ product mockup_url/thumbnail_url backfilled (placeholder)');
  } else {
    console.log('  product mockup/thumbnail already set — skipping');
  }

  const [existing] = await sql`
    select id, slug, surfaces
    from gift_product_variants
    where gift_product_id = ${product.id} and slug = ${VARIANT_SLUG}
  `;

  if (existing) {
    await sql`
      update gift_product_variants
      set name = ${'Default'},
          mockup_url = case when mockup_url = '' then ${PLACEHOLDER_MOCKUP_URL} else mockup_url end,
          mockup_area = ${sql.json(MOCKUP_AREA)},
          surfaces = ${sql.json(SURFACES)},
          is_active = true,
          updated_at = now()
      where id = ${existing.id}
    `;
    console.log('  ✓ variant', VARIANT_SLUG, 'updated · surfaces:', SURFACES.length);
  } else {
    await sql`
      insert into gift_product_variants (
        gift_product_id, slug, name, mockup_url, mockup_area,
        surfaces, base_price_cents, display_order, is_active, photo_pan_mode
      ) values (
        ${product.id}, ${VARIANT_SLUG}, ${'Default'},
        ${PLACEHOLDER_MOCKUP_URL}, ${sql.json(MOCKUP_AREA)},
        ${sql.json(SURFACES)}, 0, 0, true, true
      )
    `;
    console.log('  ✓ variant', VARIANT_SLUG, 'inserted · surfaces:', SURFACES.length);
  }
} finally {
  await sql.end();
}
