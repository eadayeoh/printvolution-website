-- supabase/migrations/0080_gift_templates_mode_override.sql
-- Template-owned production mode override.
--
-- Today the production mode (foiling / digital / uv / laser / …) lives on
-- `gift_products.mode` and applies to every order line for that product.
-- That breaks when one product offers multiple physical SKUs through
-- different templates — e.g. a Star Map product where the customer can
-- pick "Foil on acrylic" (mode='foiling') or "Poster on paper"
-- (mode='digital'). Without an override the cart line inherits the
-- product's mode and routes the wrong way at fulfilment.
--
-- This migration adds an optional per-template mode override:
--
--   mode_override  text  — null      → inherit gift_products.mode
--                          else      → override (must match a gift_modes.slug)
--
-- The cart→order insert in app/(site)/checkout/actions.ts looks up the
-- selected template's mode_override and prefers it over the product's
-- mode when writing gift_order_items.mode. No FK to gift_modes — that
-- table is open-ended (admins can add custom slugs at runtime per
-- migration 0072), so we keep the column free-form.
--
-- Idempotent.

alter table public.gift_templates
  add column if not exists mode_override text;

comment on column public.gift_templates.mode_override is
  'Optional production mode this template forces on the order line, overriding gift_products.mode. NULL = inherit. Used when one product hosts multiple physical SKUs (e.g. foil vs poster) selectable via the customer template picker.';

-- Backfill: the Star Map — Poster template needs to route to digital
-- print, not the foiling press it would otherwise inherit from
-- star-map-poster (mode='foiling').
update public.gift_templates
   set mode_override = 'digital'
 where name = 'Star Map — Poster'
   and mode_override is null;
