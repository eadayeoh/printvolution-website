-- 0056_gift_shape_options.sql
-- Per-product customer-facing shape picker (cutout / rectangle / template).
-- NULL = product has no picker (default, matches existing behaviour).
-- Array = picker is active; order drives tab order on the customer page.

alter table gift_products
  add column if not exists shape_options jsonb;

comment on column gift_products.shape_options is
  'Array of { kind, label, price_delta_cents?, template_ids? }. NULL = shape picker disabled.';
