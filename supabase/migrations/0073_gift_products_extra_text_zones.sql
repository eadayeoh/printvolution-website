-- supabase/migrations/0073_gift_products_extra_text_zones.sql
-- Lets admins put one-or-more simple text-input fields on a gift product
-- (e.g. "Front engraving" + "Back engraving" on a jewellery piece) WITHOUT
-- having to create + attach a zones-based template. Templates exist for
-- products with a visual layout to compose; jewellery just needs to
-- capture a couple of strings cleanly for production.
--
-- Schema:
--   [
--     { "id": "front", "label": "Front engraving", "max_chars": 18 },
--     { "id": "back",  "label": "Back engraving",  "max_chars": 22 }
--   ]
--
-- Customer fills each field on the PDP; cart notes serialise as
--   text_<id>:<value>   (matches the existing surfaces convention so the
-- admin order detail view + production pipeline read the same shape).

alter table public.gift_products
  add column if not exists extra_text_zones jsonb not null default '[]'::jsonb;

comment on column public.gift_products.extra_text_zones is
  'Optional list of simple text-input fields shown on the PDP without needing a template. Each entry: { id, label, max_chars }. Cart serialises as text_<id>:<value>.';
