-- 0036_gift_retention_runs.sql
-- Audit log for the daily gift purge cron.

create table if not exists public.gift_retention_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  sources_deleted integer not null default 0,
  production_deleted integer not null default 0,
  errors jsonb not null default '[]'::jsonb
);

create index if not exists gift_retention_runs_ran_at_idx
  on public.gift_retention_runs(ran_at desc);

alter table public.gift_retention_runs enable row level security;

drop policy if exists "gift_retention_runs admin read" on public.gift_retention_runs;
create policy "gift_retention_runs admin read" on public.gift_retention_runs
  for select using (public.is_admin_or_staff());
-- No insert policy needed; the cron uses the service-role key which bypasses RLS.
