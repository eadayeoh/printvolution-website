-- consume_gift_generation in 0089 ran SELECT count(*) → INSERT at READ
-- COMMITTED, so two concurrent calls could both see `v_used < limit`
-- and both insert, blowing past the weekly cap. Wrap the function body
-- in a per-subject advisory lock so concurrent calls for the same
-- user_id / anon_session_id serialise.

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
begin
  -- Advisory lock keyed on the subject (user_id when signed in, anon
  -- session id otherwise). Held for the duration of the transaction;
  -- concurrent calls for the SAME subject queue, while different
  -- subjects don't contend.
  v_subject_key := coalesce(p_user_id::text, 'anon:' || coalesce(p_anon_session_id, ''));
  perform pg_advisory_xact_lock(hashtext('quota:' || v_subject_key));

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
