-- Atomic check-and-record for rate-limit attempts. The TS path in
-- lib/rate-limit.ts did SELECT count + INSERT in two round-trips —
-- two concurrent requests both passed the count check before either
-- inserted, sneaking past the cap. This RPC bundles both into one
-- transaction so the count is observed AFTER the insert by the lock
-- holder, giving each caller a true serialised view.
--
-- Returns true when the attempt was recorded (allowed), false when the
-- count for `p_key` in the last `p_window_seconds` already meets or
-- exceeds `p_max` — caller falls back to a retry-after response.

create or replace function public.try_consume_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- pg_advisory_xact_lock serialises this RPC per-key for the duration
  -- of the transaction. Cheaper than table-locking and scoped to just
  -- the same `key` so unrelated rate-limit buckets don't queue up.
  perform pg_advisory_xact_lock(hashtext('rl:' || p_key));

  select count(*) into v_count
    from public.rate_limit_attempts
   where key = p_key
     and created_at >= now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max then
    return false;
  end if;

  insert into public.rate_limit_attempts(key) values (p_key);
  return true;
end;
$$;

revoke execute on function public.try_consume_rate_limit(text, int, int) from public, anon;
grant execute on function public.try_consume_rate_limit(text, int, int) to authenticated, service_role;
