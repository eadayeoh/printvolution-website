-- Atomic upsert + points increment for the post-checkout flow.
--
-- Before this function, the checkout server action was reading
-- members.points_balance, computing balance + delta in JavaScript,
-- and writing the result back. Two concurrent orders from the same
-- email could both read 100, both write 110, and silently lose one
-- order's earnings.
--
-- The function does the upsert + ON CONFLICT increment + the
-- points_transactions audit row in one statement so concurrent
-- callers serialise on the unique (email) row lock.

create or replace function public.add_member_points(
  p_email text,
  p_name text,
  p_phone text,
  p_delta int,
  p_order_id uuid,
  p_note text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
begin
  -- p_delta is normally a positive earn but we accept 0 (the upsert
  -- still creates the row so phone / name updates land). Negative
  -- deltas should go through a different RPC that knows about the
  -- redemption flow — reject them here as defence-in-depth.
  if p_delta is null or p_delta < 0 then
    raise exception 'add_member_points: p_delta must be >= 0 (got %)', p_delta;
  end if;

  insert into public.members (email, name, phone, points_balance, total_earned)
  values (lower(p_email), p_name, p_phone, p_delta, p_delta)
  on conflict (email) do update set
    name           = coalesce(excluded.name,  public.members.name),
    phone          = coalesce(excluded.phone, public.members.phone),
    points_balance = public.members.points_balance + p_delta,
    total_earned   = public.members.total_earned + p_delta
  returning id into v_member_id;

  insert into public.points_transactions (member_id, order_id, delta, type, note)
  values (v_member_id, p_order_id, p_delta, 'earned', p_note);

  return v_member_id;
end;
$$;

-- Service role only; never callable from anon / authenticated.
revoke all on function public.add_member_points(text, text, text, int, uuid, text) from public;
revoke all on function public.add_member_points(text, text, text, int, uuid, text) from anon;
revoke all on function public.add_member_points(text, text, text, int, uuid, text) from authenticated;
grant execute on function public.add_member_points(text, text, text, int, uuid, text) to service_role;
