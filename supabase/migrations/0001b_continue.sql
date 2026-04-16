-- ============================================================================
-- PrintVolution — Schema Part 2 (continues from 0001_init.sql)
-- ============================================================================
-- Run this ONLY if 0001_init.sql stopped partway. Idempotent — safe to re-run.
-- Wraps each section in a DO block so one failure doesn't block the rest.

-- ============================================================================
-- REMAINING TABLES
-- ============================================================================
do $$ begin
  -- Product FAQs
  create table if not exists public.product_faqs (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    question text not null,
    answer text not null,
    display_order int default 0
  );
  create index if not exists idx_faqs_product on public.product_faqs(product_id);

  -- Related products
  create table if not exists public.product_related (
    product_id uuid not null references public.products(id) on delete cascade,
    related_product_id uuid not null references public.products(id) on delete cascade,
    display_order int default 0,
    primary key (product_id, related_product_id)
  );

  -- Gift personalisation fields
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
exception when others then raise notice 'Products-extras block error: %', sqlerrm;
end $$;

-- Bundles -------------------------------------------------------------------
do $$ begin
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

  create table if not exists public.bundle_products (
    bundle_id uuid not null references public.bundles(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete cascade,
    qty text,
    spec text,
    value text,
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
exception when others then raise notice 'Bundles block error: %', sqlerrm;
end $$;

-- Orders --------------------------------------------------------------------
do $$ begin
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

  create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    bundle_id uuid references public.bundles(id) on delete set null,
    product_name text not null,
    product_slug text not null,
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
exception when others then raise notice 'Orders block error: %', sqlerrm;
end $$;

-- Members & points ----------------------------------------------------------
do $$ begin
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
exception when others then raise notice 'Members block error: %', sqlerrm;
end $$;

-- Promos --------------------------------------------------------------------
do $$ begin
  create table if not exists public.coupons (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    type text not null check (type in ('pct','flat')),
    value_cents int,
    percent int,
    min_spend_cents int default 0,
    max_uses int,
    uses_count int default 0,
    expires_at timestamptz,
    is_active boolean default true,
    created_at timestamptz default now()
  );

  create table if not exists public.discount_rules (
    id uuid primary key default gen_random_uuid(),
    type text not null check (type in ('min_spend','min_qty')),
    trigger_value int not null,
    reward_type text not null check (reward_type in ('pct','flat')),
    reward_value int not null,
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
exception when others then raise notice 'Promos block error: %', sqlerrm;
end $$;

-- CMS content ---------------------------------------------------------------
do $$ begin
  create table if not exists public.page_content (
    id uuid primary key default gen_random_uuid(),
    page_key text not null,
    section_key text not null,
    data jsonb not null default '{}'::jsonb,
    updated_at timestamptz default now(),
    unique (page_key, section_key)
  );

  create table if not exists public.navigation (
    id uuid primary key default gen_random_uuid(),
    label text,
    type text not null check (type in ('link','dropdown','sep')),
    action text,
    mega_key text,
    display_order int default 0,
    is_hidden boolean default false
  );

  create table if not exists public.mega_menus (
    id uuid primary key default gen_random_uuid(),
    menu_key text not null,
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
exception when others then raise notice 'CMS block error: %', sqlerrm;
end $$;

-- Admin/staff ---------------------------------------------------------------
do $$ begin
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
exception when others then raise notice 'Admin tables block error: %', sqlerrm;
end $$;

-- Profiles + trigger --------------------------------------------------------
do $$ begin
  create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role text not null default 'customer' check (role in ('admin','staff','customer')),
    name text,
    phone text,
    pin text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer as $fn$
  begin
    insert into public.profiles (id, name, role)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'customer');
    return new;
  end;
  $fn$;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
exception when others then raise notice 'Profiles block error: %', sqlerrm;
end $$;

-- ============================================================================
-- updated_at triggers (idempotent — drop and recreate)
-- ============================================================================
do $$
declare t text;
begin
  for t in select unnest(array['products','bundles','orders','members','page_content','profiles'])
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%s', t, t);
    execute format('create trigger trg_%s_updated before update on public.%s for each row execute function public.set_updated_at()', t, t);
  end loop;
exception when others then raise notice 'Triggers block error: %', sqlerrm;
end $$;

-- ============================================================================
-- ENABLE RLS (only on tables that exist)
-- ============================================================================
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'categories','products','product_extras','product_pricing','product_configurator',
        'product_faqs','product_related','gift_personalisation',
        'bundles','bundle_products','bundle_whys','bundle_faqs',
        'orders','order_items','members','points_transactions',
        'coupons','discount_rules','coupon_redemptions',
        'page_content','navigation','mega_menus','mega_menu_items','contact_methods',
        'gift_methods','fonts','image_library','profiles'
      )
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================
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

-- ============================================================================
-- POLICIES (drop + recreate, idempotent)
-- ============================================================================
do $$
declare
  policy record;
begin
  -- Drop all existing policies on our tables so we can recreate cleanly
  for policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'categories','products','product_extras','product_pricing','product_configurator',
        'product_faqs','product_related','gift_personalisation',
        'bundles','bundle_products','bundle_whys','bundle_faqs',
        'orders','order_items','members','points_transactions',
        'coupons','discount_rules','coupon_redemptions',
        'page_content','navigation','mega_menus','mega_menu_items','contact_methods',
        'gift_methods','fonts','image_library','profiles'
      )
  loop
    execute format('drop policy if exists %I on public.%I', policy.policyname, policy.tablename);
  end loop;
end $$;

-- Public catalog: anyone reads, admin writes
create policy "public read" on public.categories for select using (true);
create policy "admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.products for select using (is_active or public.is_admin());
create policy "admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.product_extras for select using (true);
create policy "admin write" on public.product_extras for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.product_pricing for select using (true);
create policy "admin write" on public.product_pricing for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.product_configurator for select using (true);
create policy "admin write" on public.product_configurator for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.product_faqs for select using (true);
create policy "admin write" on public.product_faqs for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.product_related for select using (true);
create policy "admin write" on public.product_related for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.gift_personalisation for select using (true);
create policy "admin write" on public.gift_personalisation for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.bundles for select using (status = 'active' or public.is_admin());
create policy "admin write" on public.bundles for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.bundle_products for select using (true);
create policy "admin write" on public.bundle_products for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.bundle_whys for select using (true);
create policy "admin write" on public.bundle_whys for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.bundle_faqs for select using (true);
create policy "admin write" on public.bundle_faqs for all using (public.is_admin()) with check (public.is_admin());

-- Orders: anon inserts, staff reads/updates
create policy "anon insert" on public.orders for insert with check (true);
create policy "staff read" on public.orders for select using (public.is_staff_or_admin());
create policy "staff update" on public.orders for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "admin delete" on public.orders for delete using (public.is_admin());

create policy "anon insert" on public.order_items for insert with check (true);
create policy "staff read" on public.order_items for select using (public.is_staff_or_admin());
create policy "staff update" on public.order_items for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- Members & points
create policy "anon upsert insert" on public.members for insert with check (true);
create policy "anon upsert update" on public.members for update using (true) with check (true);
create policy "staff read" on public.members for select using (public.is_staff_or_admin());

create policy "staff read" on public.points_transactions for select using (public.is_staff_or_admin());
create policy "anon insert" on public.points_transactions for insert with check (true);

-- Promos
create policy "public read active" on public.coupons for select using (is_active or public.is_admin());
create policy "admin write" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active" on public.discount_rules for select using (is_active or public.is_admin());
create policy "admin write" on public.discount_rules for all using (public.is_admin()) with check (public.is_admin());

create policy "anon insert" on public.coupon_redemptions for insert with check (true);
create policy "admin read" on public.coupon_redemptions for select using (public.is_admin());

-- CMS
create policy "public read" on public.page_content for select using (true);
create policy "admin write" on public.page_content for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.navigation for select using (not is_hidden or public.is_admin());
create policy "admin write" on public.navigation for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.mega_menus for select using (true);
create policy "admin write" on public.mega_menus for all using (public.is_admin()) with check (public.is_admin());

create policy "public read" on public.mega_menu_items for select using (true);
create policy "admin write" on public.mega_menu_items for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active" on public.contact_methods for select using (is_active or public.is_admin());
create policy "admin write" on public.contact_methods for all using (public.is_admin()) with check (public.is_admin());

-- Admin/staff tables
create policy "admin all" on public.gift_methods for all using (public.is_admin()) with check (public.is_admin());
create policy "public read active" on public.gift_methods for select using (is_active);

create policy "admin all" on public.fonts for all using (public.is_admin()) with check (public.is_admin());
create policy "public read" on public.fonts for select using (true);

create policy "admin all" on public.image_library for all using (public.is_admin()) with check (public.is_admin());
create policy "public read" on public.image_library for select using (true);

-- Profiles
create policy "users read own" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "users update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin all profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Done — verify with: select count(*) from information_schema.tables where table_schema='public';
-- Expected: 28
