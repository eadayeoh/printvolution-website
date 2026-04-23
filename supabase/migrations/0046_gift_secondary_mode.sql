-- 0046_gift_secondary_mode.sql
-- A gift product can combine up to TWO production methods. Most
-- products use one (e.g. UV printing on an acrylic wall art). Some
-- mix processes on different surfaces of the same piece (e.g.
-- UV-printed photo panel + laser-engraved border text on the same
-- acrylic). `mode` stays the primary / default; `secondary_mode`
-- is an optional second method that the per-surface / per-zone
-- `mode` dropdown picks from.
--
-- Constraints:
--   - secondary_mode is nullable (most products stay one-mode).
--   - secondary_mode must differ from mode when set (no duplicates).

alter table public.gift_products
  add column if not exists secondary_mode text
    check (
      secondary_mode is null
      or secondary_mode in ('laser','uv','embroidery','photo-resize','eco-solvent','digital','uv-dtf')
    );

-- Guard against primary==secondary via a CHECK constraint; the
-- explicit name makes diagnosing Zod errors easier when the admin
-- picks the same mode twice.
alter table public.gift_products
  drop constraint if exists gift_products_distinct_modes_chk;
alter table public.gift_products
  add constraint gift_products_distinct_modes_chk
  check (secondary_mode is null or secondary_mode <> mode::text);

comment on column public.gift_products.secondary_mode is
  'Optional second production method. When set, per-surface / per-zone `mode` dropdowns pick from {mode, secondary_mode}. Must differ from the primary mode.';
