-- 0061_gift_variant_mockup_by_prompt.sql
-- Per-variant mockup override keyed by prompt_id. When the customer
-- picks an art-style prompt, the live preview swaps to that prompt's
-- mockup (if configured). Used by Figurine Photo Frame where Line Art
-- (laser) and Image Upload (UV) render on different-looking frames
-- that need their own product shot.
--
-- Shape: Record<prompt_id, { url, area }>. Missing key = fall back to
-- the variant's own mockup_url + mockup_area (or shape-specific
-- override, or product mockup, in that resolution order).

alter table gift_product_variants
  add column if not exists mockup_by_prompt_id jsonb;

comment on column gift_product_variants.mockup_by_prompt_id is
  'Record<prompt_id, { url, area }>. NULL or missing key = fall back to mockup_by_shape / variant.mockup_url.';
