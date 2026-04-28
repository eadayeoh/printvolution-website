-- supabase/migrations/0074_gift_mode_enum_to_text.sql
-- Finish what 0072 started. That migration dropped the CHECK constraints
-- on the dependent columns, but the columns themselves are typed as the
-- Postgres `gift_mode` ENUM, which still only knows the original 7 slugs.
-- A new admin-created mode like 'metallic-foiling' fails with
--   ERROR:  invalid input value for enum gift_mode: "metallic-foiling"
-- because the enum rejects the value before it ever sees a CHECK.
--
-- Fix: convert every gift_mode-typed column to plain text. The
-- application + the gift_modes row stay the source of truth (enforced
-- in app/admin/gifts/actions.ts via NewModeSchema's slug regex). Then
-- drop the obsolete enum type so it can't be used by mistake later.
--
-- Also drops the leftover CHECK on gift_products.secondary_mode (added
-- in 0046, missed by 0072).

-- 1. Convert columns from gift_mode → text. ::text cast is enum-safe.

alter table public.gift_modes
  alter column slug type text using slug::text;

alter table public.gift_products
  alter column mode type text using mode::text;

alter table public.gift_prompts
  alter column mode type text using mode::text;

alter table public.gift_pipelines
  alter column kind type text using kind::text;

alter table public.gift_order_items
  alter column mode type text using mode::text;

-- 2. Drop the CHECK that 0046 added when secondary_mode was first
--    introduced as text (parallel to the enum). Now redundant.

alter table public.gift_products
  drop constraint if exists gift_products_secondary_mode_check;

-- 3. Drop the enum type itself. No remaining columns reference it.

drop type if exists public.gift_mode;

-- 4. Refresh comments so future readers know it's app-validated, not
--    DB-enum-validated.

comment on column public.gift_modes.slug is
  'Mode slug. Plain text — gift_mode enum was retired in 0074 so admins can add custom modes via /admin/gifts/modes without a migration. App-layer validates via NewModeSchema''s slug regex.';

comment on column public.gift_products.mode is
  'Processing mode slug — must match an active row in gift_modes. App-validated.';

comment on column public.gift_products.secondary_mode is
  'Optional second processing mode slug. Distinct from `mode` (enforced by gift_products_mode_distinct). App-validated against gift_modes.';

comment on column public.gift_prompts.mode is
  'Processing mode slug — must match an active row in gift_modes. App-validated.';

comment on column public.gift_pipelines.kind is
  'Processing mode slug this pipeline targets. App-validated against gift_modes.';
