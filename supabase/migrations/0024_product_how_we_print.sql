-- 0024_product_how_we_print.sql
-- Add per-product "How we print" cards to product_extras. Each product can
-- define its own 4-card block (icon/emoji/image + title + description);
-- when empty, the product page falls back to the universal
-- site_settings.product_features.

alter table public.product_extras
  add column if not exists how_we_print jsonb;
