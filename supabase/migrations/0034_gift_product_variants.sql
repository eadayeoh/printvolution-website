-- 0034_gift_product_variants.sql
-- Per-product physical bases (e.g. LED base types). One gift product
-- may have 0..N variants. Each variant has its own mockup, features,
-- and price. Design is shared across variants (compositor swaps mockup
-- only; AI never re-runs per variant).

create table if not exists public.gift_product_variants (
  id uuid primary key default gen_random_uuid(),
  gift_product_id uuid not null references public.gift_products(id) on delete cascade,
  slug text not null,
  name text not null,
  features jsonb not null default '[]'::jsonb,
  mockup_url text not null,
  mockup_area jsonb not null default '{"x":20,"y":20,"width":60,"height":60}'::jsonb,
  variant_thumbnail_url text,
  base_price_cents integer not null default 0,
  price_tiers jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gift_product_id, slug)
);

create index if not exists gift_product_variants_product_active_idx
  on public.gift_product_variants(gift_product_id, is_active, display_order);

create or replace function public.touch_gift_product_variants_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_product_variants_updated_at on public.gift_product_variants;
create trigger trg_gift_product_variants_updated_at before update on public.gift_product_variants
  for each row execute procedure public.touch_gift_product_variants_updated_at();

alter table public.gift_product_variants enable row level security;

drop policy if exists "gift_product_variants public read active" on public.gift_product_variants;
create policy "gift_product_variants public read active" on public.gift_product_variants
  for select using (
    is_active and exists (
      select 1 from public.gift_products gp
      where gp.id = gift_product_id and gp.is_active
    )
  );

drop policy if exists "gift_product_variants admin all" on public.gift_product_variants;
create policy "gift_product_variants admin all" on public.gift_product_variants
  for all using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());
