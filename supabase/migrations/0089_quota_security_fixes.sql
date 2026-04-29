-- Two fixes from the bug audit:
--
-- 1. claim_anon_gift_usage was granted to `anon` AND ran with
--    security definer. An attacker could call it with any target
--    user_id + a guessed anon_session_id and silently transfer quota
--    rows. Now it requires auth.uid() to match the target, which
--    means anon (auth.uid() = null) can never call it successfully.
--
-- 2. consume_gift_generation does the quota check + insert in a
--    single statement so two concurrent generations can't both pass
--    a `count < limit` read and both record. Returns whether the
--    consume succeeded.

-- Drop + recreate the claim function with the auth check.
drop function if exists public.claim_anon_gift_usage(uuid, text);

create or replace function public.claim_anon_gift_usage(p_anon_session_id text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'must be signed in to claim anon usage';
  end if;
  update public.gift_generation_usage
     set user_id = auth.uid()
   where user_id is null
     and anon_session_id = p_anon_session_id
     and consumed_at >= now() - interval '7 days';
end;
$$;
revoke all on function public.claim_anon_gift_usage(text) from public, anon;
grant execute on function public.claim_anon_gift_usage(text) to authenticated, service_role;

-- Atomic check+insert. Returns true if the row was recorded (under
-- limit), false if quota would be exceeded. Anon vs user is decided
-- by which key is non-null.
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
begin
  if p_user_id is not null then
    select count(*) into v_used
      from public.gift_generation_usage
     where user_id = p_user_id
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
  values (p_user_id, case when p_user_id is null then p_anon_session_id else null end, p_ip, p_source_asset_id, p_preview_asset_id);
  return true;
end;
$$;
revoke all on function public.consume_gift_generation(uuid, text, text, uuid, uuid, int, int, int) from public, anon;
grant execute on function public.consume_gift_generation(uuid, text, text, uuid, uuid, int, int, int) to authenticated, service_role;
