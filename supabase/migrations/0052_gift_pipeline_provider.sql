-- 0052_gift_pipeline_provider.sql
-- Each gift pipeline now declares its provider so the dispatcher knows
-- whether to run a local transform, a pass-through (crop + 300 DPI),
-- or call an external AI endpoint.
--
-- Backfill: existing pipelines with an ai_model_slug are flagged as
-- `replicate`, the rest as `passthrough`. Non-null value is required
-- going forward so the dispatcher can always make a choice.

do $$ begin
  create type gift_pipeline_provider as enum ('passthrough', 'replicate');
exception when duplicate_object then null; end $$;

alter table public.gift_pipelines
  add column if not exists provider gift_pipeline_provider;

update public.gift_pipelines
   set provider = case when ai_model_slug is not null and ai_model_slug <> '' then 'replicate'::gift_pipeline_provider else 'passthrough'::gift_pipeline_provider end
 where provider is null;

alter table public.gift_pipelines
  alter column provider set not null,
  alter column provider set default 'passthrough';

comment on column public.gift_pipelines.provider is
  'How the pipeline produces its output: passthrough (sharp crop + 300 DPI resize, no model call) or replicate (POST to replicate.com with ai_model_slug + default_params).';
