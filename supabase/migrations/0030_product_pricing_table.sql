-- 0030_product_pricing_table.sql
-- Multi-axis pricing lookup for products that don't fit the single-axis
-- product_pricing matrix (e.g. car decals priced by size × view × qty).
--
-- Shape of the jsonb value:
--   {
--     "axes": {
--       "size": [{ "slug": "...", "label": "..." }, ...],
--       "view": [{ "slug": "...", "label": "..." }, ...]
--     },
--     "qty_tiers": [200, 300, ...],
--     "prices": { "<size_slug>:<view_slug>:<qty_tier>": <cents>, ... },
--     "axis_order": ["size", "view"]
--   }
--
-- When pricing_table is non-null, the product page calculator uses it and
-- ignores product_pricing + configurator price formulas.

alter table public.products
  add column if not exists pricing_table jsonb;
