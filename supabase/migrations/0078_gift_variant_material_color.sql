-- supabase/migrations/0078_gift_variant_material_color.sql
-- Per-variant material colour for renderer-driven products (city_map /
-- star_map / song_lyrics).
--
-- Why per-variant? Because the variant IS the physical material — a "Black
-- Frame" and a "White Frame" are different SKUs. Foil colour, by contrast,
-- is a customer choice WITHIN a variant (Gold / Rose Gold / Silver), and
-- already lives on `colour_swatches[].hex` so we don't need to add a
-- separate column for it.
--
-- The renderer uses material_color as the bg behind the foil paths so the
-- live preview composites correctly inside the variant's mockup_area on
-- the PDP. NULL falls back to the renderer's hardcoded default per layout
-- (#1a2740 navy for foil, #ffffff white for poster).

alter table public.gift_product_variants
  add column if not exists material_color text;

comment on column public.gift_product_variants.material_color is
  'Material / background colour behind the foil for renderer-driven products. Hex string (e.g. "#000000"). NULL = renderer default.';
