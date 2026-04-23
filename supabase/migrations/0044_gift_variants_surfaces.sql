-- 0044_gift_variants_surfaces.sql
-- Per-variant configurable surfaces. A "surface" is one engravable /
-- printable face of the product: the front of a necklace pendant, the
-- four sides of a 3D bar keychain, the acrylic front of an LED base.
--
-- Each surface has its own:
--   - label     (shown to the customer: "Front", "Back", "Left", "Right")
--   - accepts   ('text' | 'photo' | 'both'): what kind of input it takes
--   - mockup_url + mockup_area: the photo of *this* face, and the area
--                 on that photo where the customer's text/image renders
--   - max_chars (text) or min_source_px (photo) hints for validation
--   - optional font + styling defaults for text surfaces
--
-- EMPTY ARRAY → fall back to current behaviour (variant is one-surface
-- using the variant's own mockup_url + mockup_area, input kind comes
-- from the parent product's input_mode). Nothing changes for the 99%
-- of variants that don't need multi-surface config.
--
-- Example — 3D Bar Keychain:
--   [
--     { "id": "front",  "label": "Front",  "accepts": "text",
--       "mockup_url": "...", "mockup_area": {x,y,w,h}, "max_chars": 15 },
--     { "id": "back",   "label": "Back",   "accepts": "text|photo", ... },
--     { "id": "left",   "label": "Left",   "accepts": "text", ... },
--     { "id": "right",  "label": "Right",  "accepts": "text", ... }
--   ]

alter table public.gift_product_variants
  add column if not exists surfaces jsonb not null default '[]'::jsonb;

comment on column public.gift_product_variants.surfaces is
  'Per-variant list of engravable/printable surfaces. Each element: {id, label, accepts, mockup_url, mockup_area, max_chars?, font?}. Empty array = single-surface fallback using the variant row''s own mockup_url + mockup_area + parent input_mode.';
