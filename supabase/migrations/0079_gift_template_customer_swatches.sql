-- supabase/migrations/0079_gift_template_customer_swatches.sql
-- Template-owned customer colour picker.
--
-- Today colour swatches live on `gift_product_variants.colour_swatches`
-- and apply to every template the variant is shown with. That breaks
-- when a single product has multiple templates that need DIFFERENT
-- swatch sets — e.g. one template needs Red/Blue/Green for mockup-swap,
-- another needs Gold/Rose Gold/Silver for foil overlay.
--
-- This migration adds a per-template picker:
--
--   customer_picker_role  text   — null | 'none' | 'mockup_swap' | 'foil_overlay'
--                                  Drives BOTH whether the swatch row
--                                  shows AND how a pick is applied:
--                                    mockup_swap  → swap displayed photo
--                                    foil_overlay → retint renderer foil
--                                    none / null  → no picker
--
--   customer_swatches     jsonb  — array of { name, hex, mockup_url? }
--                                  Same shape as the existing variant
--                                  swatches; mockup_url is optional
--                                  (only used when role=mockup_swap).
--
-- PDP fallback chain: active template's customer_swatches if non-empty
-- → otherwise variant.colour_swatches (legacy / non-renderer products).
--
-- Idempotent.

alter table public.gift_templates
  add column if not exists customer_picker_role text;

alter table public.gift_templates
  add column if not exists customer_swatches jsonb not null default '[]'::jsonb;

-- App-side validation accepts the values above; this CHECK guards the
-- DB column from typos.
alter table public.gift_templates
  drop constraint if exists gift_templates_customer_picker_role_check;

alter table public.gift_templates
  add constraint gift_templates_customer_picker_role_check
  check (
    customer_picker_role is null
    or customer_picker_role in ('none', 'mockup_swap', 'foil_overlay')
  );

comment on column public.gift_templates.customer_picker_role is
  'Customer colour-picker role for THIS template: ''mockup_swap'' (pick swaps the displayed photo), ''foil_overlay'' (pick retints renderer foil), ''none'' / NULL (no picker). Overrides variant.colour_swatches when customer_swatches is non-empty.';

comment on column public.gift_templates.customer_swatches is
  'Array of { name, hex, mockup_url? } the customer picks between when this template is active. mockup_url required only when customer_picker_role = ''mockup_swap''. Empty array = fall back to variant.colour_swatches.';
