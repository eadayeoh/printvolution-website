-- 0058_gift_variant_mockup_by_shape.sql
-- Per-shape mockup + preview area on each gift variant. When the parent
-- product has `shape_options` active (migration 0056), a single mockup
-- per variant stops being enough — a cutout on a Black Base needs to
-- render the subject against a bare base, not against a rectangular
-- acrylic panel. NULL / missing key = fall back to the variant's base
-- `mockup_url` + `mockup_area`.

alter table gift_product_variants
  add column if not exists mockup_by_shape jsonb;

comment on column gift_product_variants.mockup_by_shape is
  'Record<ShapeKind, { url, area }>. NULL or missing key = fall back to variant.mockup_url / mockup_area.';
