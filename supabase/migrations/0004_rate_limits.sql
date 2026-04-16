-- Rate-limit attempt log.
-- We keep one row per attempt; check count within a sliding window.
-- Auto-cleanup via a simple function that runs on insert (opportunistic purge).

create table if not exists public.rate_limit_attempts (
  id uuid primary key default gen_random_uuid(),
  key text not null,                       -- e.g. 'login:1.2.3.4' or 'checkout:1.2.3.4'
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_key_time
  on public.rate_limit_attempts(key, created_at desc);

-- RLS: only service role writes/reads (we never call this from the browser)
alter table public.rate_limit_attempts enable row level security;
-- No policies = no anon/authed access. Only service_role bypasses RLS.

comment on table public.rate_limit_attempts is 'Per-action attempt log used by lib/rate-limit.ts';

-- Opportunistic cleanup: purge entries older than 1 hour on every 100th insert.
-- Cheap, self-maintaining, no cron required.
create or replace function public.rate_limit_cleanup() returns trigger
language plpgsql as $$
begin
  if (random() < 0.01) then
    delete from public.rate_limit_attempts where created_at < now() - interval '1 hour';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_rate_limit_cleanup on public.rate_limit_attempts;
create trigger trg_rate_limit_cleanup
  after insert on public.rate_limit_attempts
  for each row execute function public.rate_limit_cleanup();
