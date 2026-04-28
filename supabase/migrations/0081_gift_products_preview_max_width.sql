-- supabase/migrations/0081_gift_products_preview_max_width.sql
-- Per-product cap on the customer-facing live-preview width.
--
-- The PDP's live-preview shell sizes itself to the variant mockup's
-- natural aspect, capped by the parent column width. For tall mockups
-- (portrait frames, vertical posters) that produces a preview that
-- dwarfs the rest of the compose flow on desktop. This column lets
-- admins set a per-product ceiling without forking each variant's
-- mockup image.
--
-- NULL = use the existing default (480 px for renderer fallbacks,
-- column width for variant-mocked products).
--
-- Idempotent.

alter table public.gift_products
  add column if not exists preview_max_width_px integer;

comment on column public.gift_products.preview_max_width_px is
  'Optional cap (in px) for the customer-facing live-preview shell on the PDP. NULL = auto (parent column width / 480 px fallback). Tightens the preview for products whose mockup aspect would otherwise produce an oversized shell on desktop.';
