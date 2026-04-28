-- supabase/migrations/0077_gift_variant_size_overrides.sql
-- Per-variant size availability + price-delta override.
--
-- Default model: every variant is available in every product-level size,
-- and the product-level size.price_delta_cents applies to all variants.
--
-- This adds an optional `size_overrides` JSONB column to flag the
-- exceptions. Shape:
--
--   {
--     "<size_slug>": {
--       "available":         false,        -- hide this size for THIS variant
--       "price_delta_cents": 1000          -- override product-level delta
--     },
--     ...
--   }
--
-- Both fields are optional. Missing key = inherit product defaults
-- (available=true, price_delta=size.price_delta_cents). Empty object
-- {} also means "all defaults" — that's the column default for new
-- rows so the existing model is preserved without per-row backfill.

alter table public.gift_product_variants
  add column if not exists size_overrides jsonb not null default '{}'::jsonb;

comment on column public.gift_product_variants.size_overrides is
  'Per-variant overrides keyed by gift_products.sizes[].slug. Each value: { available?: bool; price_delta_cents?: int }. Missing key = inherit product defaults.';
