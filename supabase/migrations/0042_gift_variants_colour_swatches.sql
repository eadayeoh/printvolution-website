-- 0042_gift_variants_colour_swatches.sql
-- Nested colour choices inside a single variant tile.
--
-- Use case: one "T-shirt" tile that the customer clicks to select, with
-- a row of coloured dots under it — red / navy / black. Picking a dot
-- swaps the tile's mockup in place so the customer sees their design
-- on the chosen colour, without the variant grid growing into a 4×N
-- explosion of "Red Tee / Blue Tee / Red Hoodie / Blue Hoodie" tiles.
--
-- Swatch shape per element:
--   {
--     "name":       "Red",          -- label shown on hover / in cart
--     "hex":        "#C62828",      -- dot colour in the swatch row
--     "mockup_url": "https://..."   -- mockup photo of this colour
--   }
--
-- Admin owns the array per variant; an empty array (the default)
-- means "no nested colours" and the tile renders its own mockup_url
-- alone — identical to the old behaviour.
--
-- No schema-level constraint on the JSON shape; enforcement lives in
-- the Zod schema on the admin action so malformed swatches fail at
-- the edit boundary, not at query time.

alter table public.gift_product_variants
  add column if not exists colour_swatches jsonb not null default '[]'::jsonb;

comment on column public.gift_product_variants.colour_swatches is
  'Optional nested colour choices for this variant. Array of {name, hex, mockup_url}. Customer-facing grid shows a swatch row under the tile; picking a swatch swaps the displayed mockup and records the colour on the cart line. Empty array means no colour choices.';
