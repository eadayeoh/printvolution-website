-- 0022_product_extras_chooser_magazine.sql
-- Add two jsonb columns to product_extras for admin-authored Paper Chooser
-- and SEO Magazine overrides on individual product pages. Null / empty =
-- component uses the generated default tailored to the product.

alter table public.product_extras
  add column if not exists chooser jsonb,
  add column if not exists seo_magazine jsonb;
