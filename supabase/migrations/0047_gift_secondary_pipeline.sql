-- 0047_gift_secondary_pipeline.sql
-- Parallel override for the secondary production mode. A dual-mode
-- product can now specify a specific pipeline for EACH of its two
-- modes — e.g. a custom Laser-engraved-border pipeline for primary +
-- a custom UV-print pipeline for secondary. Either override is
-- optional; when null, the runner falls back to the default pipeline
-- for that mode.

alter table public.gift_products
  add column if not exists secondary_pipeline_id uuid
    references public.gift_pipelines(id) on delete set null;

comment on column public.gift_products.secondary_pipeline_id is
  'Optional pipeline override for the secondary production mode. Paired with gift_products.secondary_mode; ignored if secondary_mode is null.';
