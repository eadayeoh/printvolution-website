-- 0051_variant_mockup_bounds.sql
-- Bounds rectangle for customer drag/resize on the gift product page.
--
-- `mockup_area` (existing) = starting position + size of the customer's
--                            design on the mockup image.
-- `mockup_bounds` (new)    = the outermost rectangle the customer is
--                            allowed to drag/resize into. Anything
--                            outside this is off the printable surface.
--
-- Null means "no bounds configured" — customer can't drag. The admin
-- editor backfills bounds = mockup_area when the product is first
-- saved after this migration, but existing rows stay null until the
-- admin opens and re-saves them.

alter table public.gift_product_variants
  add column if not exists mockup_bounds jsonb;

-- Backfill: if bounds is null, seed it from mockup_area inflated by 10%
-- of the mockup dimensions so admin has a starting point to edit.
-- Clamp to 0-100 so the seeded box stays on-canvas.
update public.gift_product_variants
   set mockup_bounds = jsonb_build_object(
         'x',      greatest(0, coalesce((mockup_area->>'x')::numeric, 0)      - 5),
         'y',      greatest(0, coalesce((mockup_area->>'y')::numeric, 0)      - 5),
         'width',  least(100, coalesce((mockup_area->>'width')::numeric, 60)  + 10),
         'height', least(100, coalesce((mockup_area->>'height')::numeric, 60) + 10)
       )
 where mockup_bounds is null
   and mockup_area is not null;

comment on column public.gift_product_variants.mockup_bounds is
  'Draggable zone on the mockup image (% of image). Customer can drag/resize their design within this rectangle. Separate from mockup_area (which is the starting position).';
