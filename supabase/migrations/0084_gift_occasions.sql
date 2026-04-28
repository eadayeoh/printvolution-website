-- 0084_gift_occasions.sql
-- Date-windowed "occasions" for gift templates (Mother's Day, Christmas, etc.).
-- Admin creates an occasion row with a target date + days_before/days_after
-- offsets, then tags individual gift_templates with it. The customer-facing
-- PDP hides templates whose occasion is out of window; admin sees all
-- templates regardless. Templates with occasion_id = NULL are "always-on"
-- and behave exactly as before.

create table if not exists public.gift_occasions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  badge_label text,
  target_date date not null,
  days_before integer not null default 14 check (days_before >= 0),
  days_after  integer not null default 2  check (days_after  >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_gift_occasions_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_gift_occasions_updated_at on public.gift_occasions;
create trigger trg_gift_occasions_updated_at before update on public.gift_occasions
  for each row execute procedure public.touch_gift_occasions_updated_at();

alter table public.gift_templates
  add column if not exists occasion_id uuid
  references public.gift_occasions(id) on delete set null;

create index if not exists gift_templates_occasion_id_idx
  on public.gift_templates(occasion_id);

alter table public.gift_occasions enable row level security;

drop policy if exists "gift_occasions public read active" on public.gift_occasions;
create policy "gift_occasions public read active" on public.gift_occasions
  for select using (is_active = true);

drop policy if exists "gift_occasions admin all" on public.gift_occasions;
create policy "gift_occasions admin all" on public.gift_occasions
  for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
