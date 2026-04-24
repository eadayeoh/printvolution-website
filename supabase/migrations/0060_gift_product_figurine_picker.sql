-- 0060_gift_product_figurine_picker.sql
-- Per-product figurine-overlay picker. Products like the Figurine
-- Photo Frame have a small decorative slot on the mockup (the wooden
-- shelf under the hanging lamp) that the customer fills by picking one
-- of N pre-made figurines. The picked figurine composites at
-- figurine_area on top of the main mockup. Opt-in via NULL defaults —
-- every other gift product keeps its current UX.

alter table gift_products
  add column if not exists figurine_options jsonb,
  add column if not exists figurine_area jsonb;

comment on column gift_products.figurine_options is
  'Array of { slug, name, image_url, price_delta_cents? }. NULL = feature off.';
comment on column gift_products.figurine_area is
  '{ x, y, width, height } as % of the mockup image — where the figurine image composites.';
