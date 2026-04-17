-- ============================================================================
-- GIFTS SUBSYSTEM
-- Fully isolated from the Print product catalog. See docs/gifts-spec.md.
-- ============================================================================

-- Product mode: determines the processing pipeline
do $$ begin
  create type gift_mode as enum ('laser','uv','embroidery','photo-resize');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gift_template_mode as enum ('none','optional','required');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gift_asset_role as enum ('source','preview','production','production-pdf');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gift_production_status as enum ('pending','processing','ready','failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- gift_products
-- ---------------------------------------------------------------------------
create table if not exists public.gift_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  tagline text,
  gallery_images text[] not null default '{}',
  thumbnail_url text,

  -- physical dimensions (millimetres)
  width_mm numeric(6,2) not null default 100,
  height_mm numeric(6,2) not null default 100,
  bleed_mm numeric(4,2) not null default 2.0,
  safe_zone_mm numeric(4,2) not null default 3.0,
  min_source_px integer not null default 1200,

  mode gift_mode not null,
  template_mode gift_template_mode not null default 'none',

  -- AI / pipeline settings (applies to laser/uv/embroidery)
  ai_prompt text,
  ai_negative_prompt text,
  ai_params jsonb not null default '{}'::jsonb,
  color_profile text,

  -- pricing (simple — NO formulas)
  base_price_cents integer not null default 0,
  price_tiers jsonb not null default '[]'::jsonb,

  -- SEO
  seo_title text,
  seo_desc text,

  is_active boolean not null default true,
  first_ordered_at timestamptz,           -- locks mode after first order
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gift_products_active_idx on public.gift_products(is_active);
create index if not exists gift_products_mode_idx on public.gift_products(mode);

-- updated_at trigger
create or replace function public.touch_gift_products_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_products_updated_at on public.gift_products;
create trigger trg_gift_products_updated_at before update on public.gift_products
  for each row execute procedure public.touch_gift_products_updated_at();

-- ---------------------------------------------------------------------------
-- gift_templates
-- ---------------------------------------------------------------------------
create table if not exists public.gift_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  thumbnail_url text,
  background_url text,
  foreground_url text,
  zones_json jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_gift_templates_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_templates_updated_at on public.gift_templates;
create trigger trg_gift_templates_updated_at before update on public.gift_templates
  for each row execute procedure public.touch_gift_templates_updated_at();

-- many-to-many product <-> template
create table if not exists public.gift_product_templates (
  gift_product_id uuid not null references public.gift_products(id) on delete cascade,
  template_id uuid not null references public.gift_templates(id) on delete cascade,
  display_order integer not null default 0,
  primary key (gift_product_id, template_id)
);

-- ---------------------------------------------------------------------------
-- gift_assets — one row per file, role + bucket tells us where + who sees it
-- ---------------------------------------------------------------------------
create table if not exists public.gift_assets (
  id uuid primary key default gen_random_uuid(),
  role gift_asset_role not null,
  bucket text not null,
  path text not null,
  mime_type text,
  width_px integer,
  height_px integer,
  size_bytes integer,
  dpi integer,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);
create index if not exists gift_assets_role_idx on public.gift_assets(role);

-- ---------------------------------------------------------------------------
-- gift_order_items — each gift line in an order
-- ---------------------------------------------------------------------------
create table if not exists public.gift_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  gift_product_id uuid references public.gift_products(id),
  template_id uuid references public.gift_templates(id),
  qty integer not null default 1,
  unit_price_cents integer not null,
  line_total_cents integer not null,

  source_asset_id uuid references public.gift_assets(id) on delete set null,
  preview_asset_id uuid references public.gift_assets(id) on delete set null,
  production_asset_id uuid references public.gift_assets(id) on delete set null,
  production_pdf_id uuid references public.gift_assets(id) on delete set null,

  mode gift_mode not null,

  -- snapshot at order time
  product_name_snapshot text,
  ai_prompt_snapshot text,
  ai_params_snapshot jsonb,
  crop_rect jsonb,

  production_status gift_production_status not null default 'pending',
  production_error text,
  admin_notes text,

  created_at timestamptz not null default now()
);
create index if not exists gift_order_items_order_idx on public.gift_order_items(order_id);
create index if not exists gift_order_items_pending_idx on public.gift_order_items(production_status)
  where production_status <> 'ready';

-- ---------------------------------------------------------------------------
-- Lock the mode after the first order touches a product
-- ---------------------------------------------------------------------------
create or replace function public.gift_products_lock_mode()
returns trigger language plpgsql as $$
begin
  if old.first_ordered_at is not null and new.mode <> old.mode then
    raise exception 'Cannot change mode after first order (product %)', old.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_gift_products_lock_mode on public.gift_products;
create trigger trg_gift_products_lock_mode before update on public.gift_products
  for each row execute procedure public.gift_products_lock_mode();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.gift_products enable row level security;
alter table public.gift_templates enable row level security;
alter table public.gift_product_templates enable row level security;
alter table public.gift_assets enable row level security;
alter table public.gift_order_items enable row level security;

-- helper: is current user admin/staff
create or replace function public.is_admin_or_staff()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','staff')
  );
$$;

-- Public read: active products + active templates (customers need to browse)
drop policy if exists "gift_products public read active" on public.gift_products;
create policy "gift_products public read active" on public.gift_products
  for select using (is_active);

drop policy if exists "gift_products admin all" on public.gift_products;
create policy "gift_products admin all" on public.gift_products
  for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

drop policy if exists "gift_templates public read active" on public.gift_templates;
create policy "gift_templates public read active" on public.gift_templates
  for select using (is_active);

drop policy if exists "gift_templates admin all" on public.gift_templates;
create policy "gift_templates admin all" on public.gift_templates
  for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

drop policy if exists "gift_product_templates public read" on public.gift_product_templates;
create policy "gift_product_templates public read" on public.gift_product_templates
  for select using (true);

drop policy if exists "gift_product_templates admin all" on public.gift_product_templates;
create policy "gift_product_templates admin all" on public.gift_product_templates
  for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

-- Assets: previews are public-read (via bucket), production is admin-only.
-- The row itself is only visible to admin to keep production paths private.
drop policy if exists "gift_assets admin all" on public.gift_assets;
create policy "gift_assets admin all" on public.gift_assets
  for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

-- Preview rows readable by anyone (customer needs to know the preview URL)
drop policy if exists "gift_assets public read previews" on public.gift_assets;
create policy "gift_assets public read previews" on public.gift_assets
  for select using (role = 'preview');

-- Order items: admin sees all; customers see their own via email match on order
drop policy if exists "gift_order_items admin all" on public.gift_order_items;
create policy "gift_order_items admin all" on public.gift_order_items
  for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

-- ---------------------------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------------------------
-- Sources: private (customer uploads, admin-only visible)
insert into storage.buckets (id, name, public)
  values ('gift-sources', 'gift-sources', false)
  on conflict (id) do nothing;

-- Previews: public (watermarked, safe to expose)
insert into storage.buckets (id, name, public)
  values ('gift-previews', 'gift-previews', true)
  on conflict (id) do nothing;

-- Production: private (admin-only, 300 DPI + PDF)
insert into storage.buckets (id, name, public)
  values ('gift-production', 'gift-production', false)
  on conflict (id) do nothing;

-- Templates: public (thumbnails + background + foreground served to customers)
insert into storage.buckets (id, name, public)
  values ('gift-templates', 'gift-templates', true)
  on conflict (id) do nothing;

-- Preview bucket: public read; admin/staff write
drop policy if exists "gift-previews public read" on storage.objects;
create policy "gift-previews public read" on storage.objects for select
  using (bucket_id = 'gift-previews');

drop policy if exists "gift-previews admin write" on storage.objects;
create policy "gift-previews admin write" on storage.objects for all
  using (bucket_id = 'gift-previews' and public.is_admin_or_staff())
  with check (bucket_id = 'gift-previews' and public.is_admin_or_staff());

-- Templates bucket: public read; admin/staff write
drop policy if exists "gift-templates public read" on storage.objects;
create policy "gift-templates public read" on storage.objects for select
  using (bucket_id = 'gift-templates');

drop policy if exists "gift-templates admin write" on storage.objects;
create policy "gift-templates admin write" on storage.objects for all
  using (bucket_id = 'gift-templates' and public.is_admin_or_staff())
  with check (bucket_id = 'gift-templates' and public.is_admin_or_staff());

-- Sources bucket: admin-only read/write (customer uploads go through a
-- server-side signed action so anon users aren't listing the bucket).
drop policy if exists "gift-sources admin all" on storage.objects;
create policy "gift-sources admin all" on storage.objects for all
  using (bucket_id = 'gift-sources' and public.is_admin_or_staff())
  with check (bucket_id = 'gift-sources' and public.is_admin_or_staff());

-- Production bucket: admin-only
drop policy if exists "gift-production admin all" on storage.objects;
create policy "gift-production admin all" on storage.objects for all
  using (bucket_id = 'gift-production' and public.is_admin_or_staff())
  with check (bucket_id = 'gift-production' and public.is_admin_or_staff());
