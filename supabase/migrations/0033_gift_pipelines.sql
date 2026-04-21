-- 0033_gift_pipelines.sql
-- Named production pipelines (processing recipes). Admin picks one per
-- gift product; the engine resolves it at preview + production time.

create table if not exists public.gift_pipelines (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  kind gift_mode not null,
  ai_endpoint_url text,
  ai_model_slug text,
  default_params jsonb not null default '{}'::jsonb,
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gift_pipelines_active_kind_idx
  on public.gift_pipelines(kind, is_active);

create or replace function public.touch_gift_pipelines_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_pipelines_updated_at on public.gift_pipelines;
create trigger trg_gift_pipelines_updated_at before update on public.gift_pipelines
  for each row execute procedure public.touch_gift_pipelines_updated_at();

alter table public.gift_pipelines enable row level security;

drop policy if exists "gift_pipelines public read active" on public.gift_pipelines;
create policy "gift_pipelines public read active" on public.gift_pipelines
  for select using (is_active);

drop policy if exists "gift_pipelines admin all" on public.gift_pipelines;
create policy "gift_pipelines admin all" on public.gift_pipelines
  for all using (public.is_admin_or_staff())
  with check (public.is_admin_or_staff());
