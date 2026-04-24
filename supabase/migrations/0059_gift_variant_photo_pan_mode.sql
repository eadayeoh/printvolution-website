-- 0059_gift_variant_photo_pan_mode.sql
-- Per-variant toggle: when ON, the customer's uploaded photo fills the
-- admin-configured mockup area (cover) and the customer pans WITHIN
-- that fixed frame instead of dragging the whole frame around. Used by
-- products like the Figurine Photo Frame where the panel slot is at a
-- fixed position on the mockup — moving the frame doesn't make sense,
-- but choosing which part of the photo shows does.

alter table gift_product_variants
  add column if not exists photo_pan_mode boolean not null default false;

comment on column gift_product_variants.photo_pan_mode is
  'true = customer pans photo inside the fixed mockup_area; false (default) = legacy drag-the-rectangle UX.';
