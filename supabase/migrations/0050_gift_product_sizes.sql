-- 0050_gift_product_sizes.sql
-- Sizes move from variant rows to a product-level list. One gift product
-- now owns N sizes; each variant (mockup/base/colour tile) is available
-- across every size. Before this, an admin had to create duplicate
-- variants to express "this base in A4 and A5".
--
-- Sizes shape:
--   [
--     { slug, name, width_mm, height_mm, price_delta_cents, display_order },
--     ...
--   ]
--
-- Migration behaviour:
-- - Adds `sizes jsonb default '[]'` to `gift_products`.
-- - Moves every existing `variant_kind = 'size'` variant into its
--   parent product's sizes array, then deletes those variants.
-- - Size variants without width_mm/height_mm are skipped (shouldn't
--   exist but defensively keep them so nothing silently disappears).

alter table public.gift_products
  add column if not exists sizes jsonb not null default '[]'::jsonb;

-- Backfill sizes from existing size variants
with size_variants as (
  select
    gift_product_id,
    jsonb_build_object(
      'slug',               slug,
      'name',               name,
      'width_mm',           width_mm,
      'height_mm',          height_mm,
      'price_delta_cents',  base_price_cents,
      'display_order',      display_order
    ) as size_obj
  from public.gift_product_variants
  where variant_kind = 'size'
    and width_mm is not null
    and height_mm is not null
),
agg as (
  select gift_product_id,
         jsonb_agg(size_obj order by (size_obj->>'display_order')::int nulls last) as new_sizes
  from size_variants
  group by gift_product_id
)
update public.gift_products gp
   set sizes = coalesce(gp.sizes, '[]'::jsonb) || a.new_sizes
  from agg a
 where gp.id = a.gift_product_id;

-- Remove the migrated size variants
delete from public.gift_product_variants
 where variant_kind = 'size'
   and width_mm is not null
   and height_mm is not null;

comment on column public.gift_products.sizes is
  'Product-level size options. Array of { slug, name, width_mm, height_mm, price_delta_cents, display_order }. Applies uniformly across every variant (mockup tile).';
