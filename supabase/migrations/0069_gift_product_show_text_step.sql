-- supabase/migrations/0069_gift_product_show_text_step.sql
-- Admin override for the legacy single-line "Add text" step on the customer
-- PDP. Null (default) means: use the legacy mode-based heuristic
-- (laser/uv = on). Explicit true/false overrides per product.

alter table public.gift_products
  add column if not exists show_text_step boolean;

comment on column public.gift_products.show_text_step is
  'Admin override for the legacy "Add text" step on the customer PDP. NULL = use the mode-based default (laser/uv → on, others → off). TRUE/FALSE wins over the default.';
