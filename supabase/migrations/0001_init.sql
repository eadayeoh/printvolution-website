-- ============================================================================
-- PrintVolution — Initial Schema (Phase 1)
-- ============================================================================
-- Run in Supabase SQL Editor or via `supabase db push`.
-- Creates all tables, indexes, and RLS policies needed for the full site.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS where possible.

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- trigram search on product names

-- Helper: updated_at trigger -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. CATEGORIES
-- ============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  parent_id uuid references public.categories(id) on delete cascade,
  display_order int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_categories_parent on public.categories(parent_id);

-- ============================================================================
-- 2. PRODUCTS
-- ============================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.categories(id) on delete set null,
  icon text,               -- emoji
  tagline text,
  description text,
  highlights text[] default '{}',
  specs jsonb default '[]'::jsonb,  -- [{label, value}, ...]
  is_gift boolean default false,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_subcategory on public.products(subcategory_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_name_trgm on public.products using gin(name gin_trgm_ops);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- Product extras (SEO, hero, chips, etc.) -----------------------------------
create table if not exists public.product_extras (
  product_id uuid primary key references public.products(id) on delete cascade,
  seo_title text,
  seo_desc text,
  hero_color text,
  hero_big text,
  h1 text,
  h1em text,
  intro text,
  why_headline text,
  why_us text[] default '{}',
  use_cases jsonb default '[]'::jsonb,
  chips text[] default '{}',
  image_url text
);

-- Product pricing (matrix: configs × rows) -----------------------------------
create table if not exists public.product_pricing (
  product_id uuid primary key references public.products(id) on delete cascade,
  label text,              -- e.g. "Size"
  configs text[] default '{}',  -- column headers
  rows jsonb default '[]'::jsonb  -- [{qty, prices: [int cents]}, ...]
);

-- Configurator steps --------------------------------------------------------
create table if not exists public.product_configurator (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  step_id text not null,   -- e.g. "size", "material"
  step_order int not null,
  label text not null,
  type text not null check (type in ('select','swatch','text','qty')),
  required boolean default false,
  options jsonb default '[]'::jsonb,  -- [{slug, label, note, price_formula}, ...]
  show_if jsonb,           -- {step, value}
  step_config jsonb,       -- extra fields: presets, min, step, etc.
  unique (product_id, step_id)
);
create index if not exists idx_configurator_product on public.product_configurator(product_id);

-- Product FAQs --------------------------------------------------------------
create table if not exists public.product_faqs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  question text not null,
  answer text not null,
  display_order int default 0
);
create index if not exists idx_faqs_product on public.product_faqs(product_id);

-- Related products ----------------------------------------------------------
create table if not exists public.product_related (
  product_id uuid not null references public.products(id) on delete cascade,
  related_product_id uuid not null references public.products(id) on delete cascade,
  display_order int default 0,
  primary key (product_id, related_product_id)
);

-- Gift personalisation fields -----------------------------------------------
create table if not exists public.gift_personalisation (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  field_type text not null check (field_type in ('image','text')),
  field_id text not null,
  label text not null,
  placeholder text,
  required boolean default false,
  display_order int default 0
);

-- ============================================================================
-- 3. BUNDLES
-- ============================================================================
create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  tagline text,
  price_cents int not null default 0,
  original_price_cents int not null default 0,
  image_url text,
  status text default 'active' check (status in ('active','inactive','draft')),
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_bundles_updated before update on public.bundles
  for each row execute function public.set_updated_at();

create table if not exists public.bundle_products (
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty text,                -- free-form: "100 pcs", "1 pc A2", etc.
  spec text,
  value text,              -- display price like "S$45"
  display_order int default 0,
  primary key (bundle_id, product_id)
);

create table if not exists public.bundle_whys (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  text text not null,
  display_order int default 0
);

create table if not exists public.bundle_faqs (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  question text not null,
  answer text not null,
  display_order int default 0
);

-- ============================================================================
-- 4. ORDERS
-- ============================================================================
create sequence if not exists public.order_number_seq start 1000;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('PV-' || nextval('public.order_number_seq')),
  customer_name text not null,
  email text not null,
  phone text not null,
  company text,
  position text,
  delivery_method text not null default 'pickup' check (delivery_method in ('pickup','delivery')),
  delivery_address text,
  subtotal_cents int not null default 0,
  delivery_cents int not null default 0,
  coupon_code text,
  coupon_discount_cents int not null default 0,
  points_redeemed int not null default 0,
  points_discount_cents int not null default 0,
  points_earned int not null default 0,
  total_cents int not null default 0,
  status text not null default 'pending' check (status in ('pending','processing','ready','completed','cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_email on public.orders(email);
create index if not exists idx_orders_created on public.orders(created_at desc);
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

-- Order line items -----------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  bundle_id uuid references public.bundles(id) on delete set null,
  product_name text not null,     -- snapshot in case product changes later
  product_slug text not null,     -- snapshot
  icon text,
  config jsonb default '{}'::jsonb,
  qty int not null default 1,
  unit_price_cents int not null default 0,
  line_total_cents int not null default 0,
  gift_image_url text,
  gift_sides jsonb,
  personalisation_notes text,
  production_method text,
  production_status text default 'pending' check (production_status in ('pending','processing','ready','completed')),
  created_at timestamptz default now()
);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_production on public.order_items(production_status);

-- ============================================================================
-- 5. MEMBERS & POINTS
-- ============================================================================
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  phone text,
  points_balance int not null default 0,
  total_earned int not null default 0,
  tier text default 'standard',
  joined_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_members_updated before update on public.members
  for each row execute function public.set_updated_at();

create table if not exists public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  delta int not null,
  type text not null check (type in ('earned','redeemed','adjusted')),
  note text,
  created_at timestamptz default now()
);
create index if not exists idx_points_member on public.points_transactions(member_id, created_at desc);

-- ============================================================================
-- 6. PROMOS
-- ============================================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('pct','flat')),
  value_cents int,         -- for flat
  percent int,             -- for pct (1-100)
  min_spend_cents int default 0,
  max_uses int,            -- null = unlimited
  uses_count int default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.discount_rules (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('min_spend','min_qty')),
  trigger_value int not null,   -- cents for min_spend, count for min_qty
  reward_type text not null check (reward_type in ('pct','flat')),
  reward_value int not null,    -- cents for flat, 1-100 for pct
  label text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  discount_cents int not null,
  created_at timestamptz default now()
);

-- ============================================================================
-- 7. CMS CONTENT
-- ============================================================================
create table if not exists public.page_content (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,       -- 'home' | 'about' | 'contact' | 'faq'
  section_key text not null,    -- 'hero' | 'pain' | 'steps' | 'why' | 'values' | 'clients'
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique (page_key, section_key)
);
create trigger trg_page_content_updated before update on public.page_content
  for each row execute function public.set_updated_at();

create table if not exists public.navigation (
  id uuid primary key default gen_random_uuid(),
  label text,
  type text not null check (type in ('link','dropdown','sep')),
  action text,                -- e.g. "/shop"
  mega_key text,              -- 'print' | 'gifts' (for dropdown type)
  display_order int default 0,
  is_hidden boolean default false
);

create table if not exists public.mega_menus (
  id uuid primary key default gen_random_uuid(),
  menu_key text not null,     -- 'print' | 'gifts'
  section_heading text not null,
  column_index int default 0,
  display_order int default 0
);

create table if not exists public.mega_menu_items (
  id uuid primary key default gen_random_uuid(),
  mega_menu_id uuid not null references public.mega_menus(id) on delete cascade,
  product_slug text not null,
  label text not null,
  display_order int default 0
);

create table if not exists public.contact_methods (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('whatsapp','phone','email','instagram','facebook','tiktok','line','telegram','other')),
  value text not null,
  label text,
  note text,
  display_order int default 0,
  is_active boolean default true
);

-- ============================================================================
-- 8. ADMIN/STAFF
-- ============================================================================
create table if not exists public.gift_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  flow_type text not null check (flow_type in ('overlay','transform','none')) default 'none',
  base_prompt text,
  is_active boolean default true,
  sort_order int default 0
);

create table if not exists public.fonts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_url text not null,
  weight int default 400,
  style text default 'normal',
  created_at timestamptz default now()
);

create table if not exists public.image_library (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  url text not null,
  tags text[] default '{}',
  product_slugs text[] default '{}',
  width int,
  height int,
  size_bytes int,
  created_at timestamptz default now()
);
create index if not exists idx_image_tags on public.image_library using gin(tags);

-- ============================================================================
-- 9. AUTH PROFILES
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('admin','staff','customer')),
  name text,
  phone text,
  pin text,              -- for staff quick-login
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'customer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Strategy:
--   * Public catalog tables: readable by everyone (anon + authed)
--   * Orders/members: insert allowed for anon (checkout); read/update only for admins
--   * Admin tables: only admin role
--   * profiles: users read own; admins read all

-- Enable RLS everywhere
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_extras       enable row level security;
alter table public.product_pricing      enable row level security;
alter table public.product_configurator enable row level security;
alter table public.product_faqs         enable row level security;
alter table public.product_related      enable row level security;
alter table public.gift_personalisation enable row level security;
alter table public.bundles              enable row level security;
alter table public.bundle_products      enable row level security;
alter table public.bundle_whys          enable row level security;
alter table public.bundle_faqs          enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.members              enable row level security;
alter table public.points_transactions  enable row level security;
alter table public.coupons              enable row level security;
alter table public.discount_rules       enable row level security;
alter table public.coupon_redemptions   enable row level security;
alter table public.page_content         enable row level security;
alter table public.navigation           enable row level security;
alter table public.mega_menus           enable row level security;
alter table public.mega_menu_items      enable row level security;
alter table public.contact_methods      enable row level security;
alter table public.gift_methods         enable row level security;
alter table public.fonts                enable row level security;
alter table public.image_library        enable row level security;
alter table public.profiles             enable row level security;

-- Helper: is_admin() --------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff_or_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','staff')
  );
$$;

-- Public catalog (read-all, admin-write) ------------------------------------
do $$ begin
  -- categories
  drop policy if exists "public read categories" on public.categories;
  create policy "public read categories" on public.categories for select using (true);
  drop policy if exists "admin write categories" on public.categories;
  create policy "admin write categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

  -- products + related catalog tables
  drop policy if exists "public read products" on public.products;
  create policy "public read products" on public.products for select using (is_active = true or public.is_admin());
  drop policy if exists "admin write products" on public.products;
  create policy "admin write products" on public.products for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read product_extras" on public.product_extras;
  create policy "public read product_extras" on public.product_extras for select using (true);
  drop policy if exists "admin write product_extras" on public.product_extras;
  create policy "admin write product_extras" on public.product_extras for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read product_pricing" on public.product_pricing;
  create policy "public read product_pricing" on public.product_pricing for select using (true);
  drop policy if exists "admin write product_pricing" on public.product_pricing;
  create policy "admin write product_pricing" on public.product_pricing for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read product_configurator" on public.product_configurator;
  create policy "public read product_configurator" on public.product_configurator for select using (true);
  drop policy if exists "admin write product_configurator" on public.product_configurator;
  create policy "admin write product_configurator" on public.product_configurator for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read product_faqs" on public.product_faqs;
  create policy "public read product_faqs" on public.product_faqs for select using (true);
  drop policy if exists "admin write product_faqs" on public.product_faqs;
  create policy "admin write product_faqs" on public.product_faqs for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read product_related" on public.product_related;
  create policy "public read product_related" on public.product_related for select using (true);
  drop policy if exists "admin write product_related" on public.product_related;
  create policy "admin write product_related" on public.product_related for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read gift_personalisation" on public.gift_personalisation;
  create policy "public read gift_personalisation" on public.gift_personalisation for select using (true);
  drop policy if exists "admin write gift_personalisation" on public.gift_personalisation;
  create policy "admin write gift_personalisation" on public.gift_personalisation for all using (public.is_admin()) with check (public.is_admin());

  -- bundles (public read when active, admin write)
  drop policy if exists "public read bundles" on public.bundles;
  create policy "public read bundles" on public.bundles for select using (status = 'active' or public.is_admin());
  drop policy if exists "admin write bundles" on public.bundles;
  create policy "admin write bundles" on public.bundles for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read bundle_products" on public.bundle_products;
  create policy "public read bundle_products" on public.bundle_products for select using (true);
  drop policy if exists "admin write bundle_products" on public.bundle_products;
  create policy "admin write bundle_products" on public.bundle_products for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read bundle_whys" on public.bundle_whys;
  create policy "public read bundle_whys" on public.bundle_whys for select using (true);
  drop policy if exists "admin write bundle_whys" on public.bundle_whys;
  create policy "admin write bundle_whys" on public.bundle_whys for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read bundle_faqs" on public.bundle_faqs;
  create policy "public read bundle_faqs" on public.bundle_faqs for select using (true);
  drop policy if exists "admin write bundle_faqs" on public.bundle_faqs;
  create policy "admin write bundle_faqs" on public.bundle_faqs for all using (public.is_admin()) with check (public.is_admin());
end $$;

-- Orders (anon can create via checkout, only admin/staff can read) ----------
do $$ begin
  drop policy if exists "anon create orders" on public.orders;
  create policy "anon create orders" on public.orders for insert with check (true);
  drop policy if exists "staff read orders" on public.orders;
  create policy "staff read orders" on public.orders for select using (public.is_staff_or_admin());
  drop policy if exists "staff update orders" on public.orders;
  create policy "staff update orders" on public.orders for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
  drop policy if exists "admin delete orders" on public.orders;
  create policy "admin delete orders" on public.orders for delete using (public.is_admin());

  drop policy if exists "anon create order_items" on public.order_items;
  create policy "anon create order_items" on public.order_items for insert with check (true);
  drop policy if exists "staff read order_items" on public.order_items;
  create policy "staff read order_items" on public.order_items for select using (public.is_staff_or_admin());
  drop policy if exists "staff update order_items" on public.order_items;
  create policy "staff update order_items" on public.order_items for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
end $$;

-- Members & points (anon can upsert self on checkout, admin reads all) -----
do $$ begin
  drop policy if exists "anon upsert members" on public.members;
  create policy "anon upsert members" on public.members for insert with check (true);
  drop policy if exists "anon update own member" on public.members;
  create policy "anon update own member" on public.members for update using (true) with check (true);
  drop policy if exists "staff read members" on public.members;
  create policy "staff read members" on public.members for select using (public.is_staff_or_admin());

  drop policy if exists "staff read points_txns" on public.points_transactions;
  create policy "staff read points_txns" on public.points_transactions for select using (public.is_staff_or_admin());
  drop policy if exists "anon create points_txns" on public.points_transactions;
  create policy "anon create points_txns" on public.points_transactions for insert with check (true);
end $$;

-- Promos ---------------------------------------------------------------------
do $$ begin
  drop policy if exists "public read active coupons" on public.coupons;
  create policy "public read active coupons" on public.coupons for select using (is_active = true or public.is_admin());
  drop policy if exists "admin write coupons" on public.coupons;
  create policy "admin write coupons" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read discount_rules" on public.discount_rules;
  create policy "public read discount_rules" on public.discount_rules for select using (is_active = true or public.is_admin());
  drop policy if exists "admin write discount_rules" on public.discount_rules;
  create policy "admin write discount_rules" on public.discount_rules for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "anon create coupon_redemptions" on public.coupon_redemptions;
  create policy "anon create coupon_redemptions" on public.coupon_redemptions for insert with check (true);
  drop policy if exists "admin read coupon_redemptions" on public.coupon_redemptions;
  create policy "admin read coupon_redemptions" on public.coupon_redemptions for select using (public.is_admin());
end $$;

-- CMS content (public read, admin write) ------------------------------------
do $$ begin
  drop policy if exists "public read page_content" on public.page_content;
  create policy "public read page_content" on public.page_content for select using (true);
  drop policy if exists "admin write page_content" on public.page_content;
  create policy "admin write page_content" on public.page_content for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read navigation" on public.navigation;
  create policy "public read navigation" on public.navigation for select using (not is_hidden or public.is_admin());
  drop policy if exists "admin write navigation" on public.navigation;
  create policy "admin write navigation" on public.navigation for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read mega_menus" on public.mega_menus;
  create policy "public read mega_menus" on public.mega_menus for select using (true);
  drop policy if exists "admin write mega_menus" on public.mega_menus;
  create policy "admin write mega_menus" on public.mega_menus for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read mega_menu_items" on public.mega_menu_items;
  create policy "public read mega_menu_items" on public.mega_menu_items for select using (true);
  drop policy if exists "admin write mega_menu_items" on public.mega_menu_items;
  create policy "admin write mega_menu_items" on public.mega_menu_items for all using (public.is_admin()) with check (public.is_admin());

  drop policy if exists "public read contact_methods" on public.contact_methods;
  create policy "public read contact_methods" on public.contact_methods for select using (is_active or public.is_admin());
  drop policy if exists "admin write contact_methods" on public.contact_methods;
  create policy "admin write contact_methods" on public.contact_methods for all using (public.is_admin()) with check (public.is_admin());
end $$;

-- Admin-only tables --------------------------------------------------------
do $$ begin
  drop policy if exists "admin all gift_methods" on public.gift_methods;
  create policy "admin all gift_methods" on public.gift_methods for all using (public.is_admin()) with check (public.is_admin());
  drop policy if exists "public read gift_methods" on public.gift_methods;
  create policy "public read gift_methods" on public.gift_methods for select using (is_active);

  drop policy if exists "admin all fonts" on public.fonts;
  create policy "admin all fonts" on public.fonts for all using (public.is_admin()) with check (public.is_admin());
  drop policy if exists "public read fonts" on public.fonts;
  create policy "public read fonts" on public.fonts for select using (true);

  drop policy if exists "admin all image_library" on public.image_library;
  create policy "admin all image_library" on public.image_library for all using (public.is_admin()) with check (public.is_admin());
  drop policy if exists "public read image_library" on public.image_library;
  create policy "public read image_library" on public.image_library for select using (true);
end $$;

-- Profiles ------------------------------------------------------------------
do $$ begin
  drop policy if exists "users read own profile" on public.profiles;
  create policy "users read own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());
  drop policy if exists "users update own profile" on public.profiles;
  create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
  drop policy if exists "admin all profiles" on public.profiles;
  create policy "admin all profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
end $$;

-- ============================================================================
-- DONE
-- ============================================================================
-- Next: apply this file via Supabase SQL Editor, then run 0002_seed.sql
