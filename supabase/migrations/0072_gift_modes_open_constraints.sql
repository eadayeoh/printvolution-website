-- supabase/migrations/0072_gift_modes_open_constraints.sql
-- Lets admins add new processing modes from /admin/gifts/modes without a
-- code change every time. Drops the hard-coded CHECK enums on the two
-- columns that currently restrict to the original 7 mode slugs.
--
-- Source of truth becomes the gift_modes table (already in place since
-- 0038). The admin UI inserts new rows there; nothing in the DB rejects
-- a mode value that exists as an active gift_modes.slug.
--
-- We deliberately do NOT add a foreign key here. A FK would require us
-- to update every referencing row before deleting a mode, and we want
-- "deactivate" (is_active=false) to be the standard retire path so
-- historical orders keep rendering correctly.

alter table public.gift_order_item_surfaces
  drop constraint if exists gift_order_item_surfaces_mode_check;

alter table public.gift_prompts
  drop constraint if exists gift_prompts_mode_check;

comment on column public.gift_order_item_surfaces.mode is
  'Processing mode slug — must match an active row in gift_modes. Validated at the application layer, not by a DB enum, so admins can add new modes without a migration.';

comment on column public.gift_prompts.mode is
  'Processing mode slug — must match an active row in gift_modes. Validated at the application layer, not by a DB enum, so admins can add new modes without a migration.';
