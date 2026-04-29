-- Anon-claim race fix.
--
-- Previously: claim_anon_gift_usage migrated all anon rows onto the
-- new user_id, but a concurrent consume_gift_generation from the same
-- anon cookie (e.g. a second tab still running on the old session)
-- could insert a fresh row with user_id=null AFTER the claim ran,
-- leaving the new generation attributed to the abandoned anon row
-- instead of the user. The user then has 8 fresh credits even though
-- they just burned one.
--
-- Fix: persist a tiny "claimed" flag per anon_session_id, written
-- INSIDE the same transaction-scoped advisory lock that
-- consume_gift_generation uses (key = 'quota:anon:<id>'). After the
-- claim, any concurrent consume_gift_generation for the same anon
-- session sees the claim flag, redirects the new row onto the
-- claimed-by user, and counts against the user cap instead.
--
-- The anon advisory lock + flag pair gives us linearizability for the
-- claim/consume sequence without changing the public RPC signatures.

create table if not exists public.gift_anon_sessions (
  anon_session_id text primary key,
  claimed_by_user_id uuid references auth.users(id) on delete cascade,
  claimed_at timestamptz
);

create index if not exists gift_anon_sessions_claimed_by_idx
  on public.gift_anon_sessions(claimed_by_user_id)
  where claimed_by_user_id is not null;

alter table public.gift_anon_sessions enable row level security;
-- No client policies — only security-definer RPCs touch this table.

-- claim_anon_gift_usage: take the same advisory lock consume uses, set
-- the claim flag, then migrate the existing usage rows. By the time
-- this commits, any consume_gift_generation that was queued behind the
-- lock will now observe claimed_by_user_id when it acquires the lock.
create or replace function public.claim_anon_gift_usage(p_anon_session_id text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'must be signed in to claim anon usage';
  end if;
  if p_anon_session_id is null or length(p_anon_session_id) = 0 then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext('quota:anon:' || p_anon_session_id));

  insert into public.gift_anon_sessions(anon_session_id, claimed_by_user_id, claimed_at)
  values (p_anon_session_id, v_user, now())
  on conflict (anon_session_id) do update
    set claimed_by_user_id = excluded.claimed_by_user_id,
        claimed_at = excluded.claimed_at
    where public.gift_anon_sessions.claimed_by_user_id is null
       or public.gift_anon_sessions.claimed_by_user_id = excluded.claimed_by_user_id;

  update public.gift_generation_usage
     set user_id = v_user
   where user_id is null
     and anon_session_id = p_anon_session_id
     and consumed_at >= now() - interval '7 days';
end;
$$;
revoke all on function public.claim_anon_gift_usage(text) from public, anon;
grant execute on function public.claim_anon_gift_usage(text) to authenticated, service_role;

-- consume_gift_generation: same advisory lock as before, plus a check
-- for a prior claim. If the anon session was already claimed by a user,
-- we attribute the new row to that user (and re-check the user cap, not
-- the anon cap). Service-role callers passing an explicit p_user_id
-- bypass the redirect — they already know which subject they're hitting.
create or replace function public.consume_gift_generation(
  p_user_id uuid,
  p_anon_session_id text,
  p_ip text,
  p_source_asset_id uuid,
  p_preview_asset_id uuid,
  p_user_limit int,
  p_anon_limit int,
  p_ip_ceiling int
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_used int;
  v_subject_key text;
  v_effective_user uuid;
begin
  v_subject_key := coalesce(p_user_id::text, 'anon:' || coalesce(p_anon_session_id, ''));
  perform pg_advisory_xact_lock(hashtext('quota:' || v_subject_key));

  v_effective_user := p_user_id;

  if v_effective_user is null and p_anon_session_id is not null then
    select claimed_by_user_id into v_effective_user
      from public.gift_anon_sessions
     where anon_session_id = p_anon_session_id;
  end if;

  if v_effective_user is not null then
    select count(*) into v_used
      from public.gift_generation_usage
     where user_id = v_effective_user
       and consumed_at >= now() - interval '7 days';
    if v_used >= p_user_limit then return false; end if;
  else
    select count(*) into v_used
      from public.gift_generation_usage
     where ip = p_ip
       and user_id is null
       and consumed_at >= now() - interval '7 days';
    if v_used >= p_ip_ceiling then return false; end if;
    select count(*) into v_used
      from public.gift_generation_usage
     where anon_session_id = p_anon_session_id
       and user_id is null
       and consumed_at >= now() - interval '7 days';
    if v_used >= p_anon_limit then return false; end if;
  end if;

  insert into public.gift_generation_usage(user_id, anon_session_id, ip, source_asset_id, preview_asset_id)
  values (
    v_effective_user,
    case when v_effective_user is null then p_anon_session_id else null end,
    p_ip,
    p_source_asset_id,
    p_preview_asset_id
  );
  return true;
end;
$$;

revoke all on function public.consume_gift_generation(uuid, text, text, uuid, uuid, int, int, int) from public, anon;
grant execute on function public.consume_gift_generation(uuid, text, text, uuid, uuid, int, int, int) to authenticated, service_role;
