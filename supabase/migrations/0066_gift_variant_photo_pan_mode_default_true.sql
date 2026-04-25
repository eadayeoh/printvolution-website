-- Flip photo_pan_mode to true by default. Most gift products are
-- fixed-slot designs (frames, magnets, mugs) where the customer
-- expects to pan their photo inside the slot — not move the slot
-- itself around the mockup. The customer-facing label already says
-- "DRAG YOUR PHOTO INSIDE", so the historical default-false created
-- a UX mismatch where dragging moved the rectangle instead of the
-- photo. Admins who genuinely want legacy free-placement (e.g.
-- design-anywhere T-shirts) can untick the checkbox per variant.

alter table public.gift_product_variants
  alter column photo_pan_mode set default true;

-- Bump existing rows. Anyone who deliberately ticked the checkbox
-- to "true" stays "true"; everyone left at the historical default
-- "false" becomes "true". If a specific variant needs the legacy
-- behaviour, an admin can flip it off via the editor.
update public.gift_product_variants
  set photo_pan_mode = true
  where photo_pan_mode = false;

comment on column public.gift_product_variants.photo_pan_mode is
  'true (default) = customer pans photo inside the fixed mockup_area; false = legacy free-placement where the customer moves + resizes the rectangle within bounds. Flip off only for products where placement itself is part of the design.';
