-- Anon-claim cross-user collision fix.
--
-- 0095 left a silent no-op when two different signed-in users share the
-- same anon_session_id cookie value (e.g. a shared family device).
-- The ON CONFLICT DO UPDATE WHERE clause skipped the update, but the
-- UPDATE gift_generation_usage that followed still ran unconditionally
-- and migrated the existing anon usages onto user_B. Worse, after the
-- claim, consume_gift_generation for user_B (who is signed in) would
-- still be attributed correctly via p_user_id, BUT for an anon caller
-- still using that cookie the redirect would now point at user_A.
--
-- The structurally correct behaviour: if the anon row is already
-- claimed by a DIFFERENT user, do nothing. The prior usages belong to
-- user_A; user_B is signed in already, so consume_gift_generation will
-- count their generations against the user_B cap directly.
create or replace function public.claim_anon_gift_usage(p_anon_session_id text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid;
  v_existing_user uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'must be signed in to claim anon usage';
  end if;
  if p_anon_session_id is null or length(p_anon_session_id) = 0 then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext('quota:anon:' || p_anon_session_id));

  select claimed_by_user_id into v_existing_user
    from public.gift_anon_sessions
   where anon_session_id = p_anon_session_id;

  if v_existing_user is not null and v_existing_user <> v_user then
    return;
  end if;

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
