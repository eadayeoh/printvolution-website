-- 0035_gift_extends.sql
-- Extend existing gift tables for pipelines, style picker, variants,
-- retention, and bundle linkage.

-- gift_products: pipeline_id + retention override
alter table public.gift_products
  add column if not exists pipeline_id uuid references public.gift_pipelines(id) on delete set null,
  add column if not exists source_retention_days integer not null default 30;

-- gift_prompts: style picker + optional pipeline override
alter table public.gift_prompts
  add column if not exists style text not null default 'line-art'
    check (style in ('line-art','realistic')),
  add column if not exists pipeline_id uuid references public.gift_pipelines(id) on delete set null;

create index if not exists gift_prompts_style_mode_idx
  on public.gift_prompts(style, mode, is_active, display_order);

-- gift_order_items: variant + pipeline snapshot, retention timestamps,
-- bundle linkage (bundle_id column added here in Phase 1 so gifts
-- spec is self-contained; bundle_gift_items FK comes later in phase 8)
alter table public.gift_order_items
  add column if not exists variant_id uuid references public.gift_product_variants(id) on delete set null,
  add column if not exists pipeline_id uuid references public.gift_pipelines(id) on delete set null,
  add column if not exists variant_name_snapshot text,
  add column if not exists variant_price_snapshot_cents integer,
  add column if not exists source_purged_at timestamptz,
  add column if not exists production_purged_at timestamptz,
  add column if not exists bundle_id uuid references public.bundles(id) on delete set null;

create index if not exists gift_order_items_bundle_idx
  on public.gift_order_items(bundle_id)
  where bundle_id is not null;
