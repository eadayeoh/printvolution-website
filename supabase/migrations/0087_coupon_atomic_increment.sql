-- Atomic coupon-uses increment so two concurrent checkouts can't both
-- read uses_count=N and both write uses_count=N+1 (skipping a use).

create or replace function public.increment_coupon_uses(p_coupon_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.coupons
     set uses_count = coalesce(uses_count, 0) + 1
   where id = p_coupon_id;
$$;

grant execute on function public.increment_coupon_uses(uuid) to anon, authenticated, service_role;
