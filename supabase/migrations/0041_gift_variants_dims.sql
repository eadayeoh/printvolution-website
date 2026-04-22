-- 0041_gift_variants_dims.sql
-- Per-variant dimensions + a variant-kind axis so admins can model
-- size variants (A3/A4/A5/A6), colour swatches, material choices,
-- or the existing "physical base" variants (LED stand A/B/C) all
-- with the same row shape.
--
-- variant_kind drives the customer-facing picker label + which fields
-- the admin panel surfaces:
--   'base'     → pick a physical base (current behaviour — shows mockup)
--   'size'     → pick a size (shows W/H + A-series presets)
--   'colour'   → pick a colour
--   'material' → pick a material
--
-- width_mm / height_mm are only meaningful for size variants but live
-- on every row (nullable). When set, the render pipeline uses them as
-- the target print dimensions in place of the product's fixed dims.

alter table public.gift_product_variants
  add column if not exists variant_kind text not null default 'base'
    check (variant_kind in ('base','size','colour','material')),
  add column if not exists width_mm  numeric,
  add column if not exists height_mm numeric;

comment on column public.gift_product_variants.variant_kind is
  'What axis this variant sits on: base | size | colour | material. Drives customer picker label + which admin fields show.';
comment on column public.gift_product_variants.width_mm  is
  'Override print width (mm) for this variant. Only meaningful when variant_kind = size. Falls back to gift_products.width_mm when null.';
comment on column public.gift_product_variants.height_mm is
  'Override print height (mm) for this variant. Only meaningful when variant_kind = size. Falls back to gift_products.height_mm when null.';

-- Existing rows stay as base variants — preserves current behaviour.
