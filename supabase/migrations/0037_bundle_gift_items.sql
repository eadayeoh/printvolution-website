-- 0037_bundle_gift_items.sql
-- A bundle can now contain gift SKUs alongside bundle_products (services).
-- Admin pre-fixes variant / prompt / pipeline / template / qty at bundle
-- creation time; customer only uploads a photo per row on the bundle page.

create table if not exists public.bundle_gift_items (
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  gift_product_id uuid not null references public.gift_products(id) on delete restrict,
  variant_id uuid references public.gift_product_variants(id) on delete restrict,
  prompt_id uuid references public.gift_prompts(id) on delete restrict,
  template_id uuid references public.gift_templates(id) on delete restrict,
  pipeline_id uuid references public.gift_pipelines(id) on delete restrict,
  override_qty integer not null default 1,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (bundle_id, gift_product_id)
);

create index if not exists bundle_gift_items_bundle_idx
  on public.bundle_gift_items(bundle_id);

alter table public.bundle_gift_items enable row level security;

drop policy if exists "bundle_gift_items public read active" on public.bundle_gift_items;
create policy "bundle_gift_items public read active" on public.bundle_gift_items
  for select using (
    exists (select 1 from public.bundles b where b.id = bundle_id and b.status = 'active')
  );

drop policy if exists "bundle_gift_items admin all" on public.bundle_gift_items;
create policy "bundle_gift_items admin all" on public.bundle_gift_items
  for all using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());
