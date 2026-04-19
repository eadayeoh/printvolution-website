-- 0031_product_lead_time_print_mode.sql
-- Per-product production metadata shown on the product page:
--   lead_time_days — integer working days from file-accepted to ready
--                    for collection/dispatch.
--   print_mode     — one of 'Offset', 'Digital', 'UV', 'Embroidery',
--                    'DTF', etc. Free-text so admin can add new methods
--                    without a schema change.

alter table public.products
  add column if not exists lead_time_days int,
  add column if not exists print_mode text;
