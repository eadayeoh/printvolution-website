-- Revoke anon execute on increment_coupon_uses. Prior grant in 0087 let
-- any unauthenticated request bump uses_count past max_uses, taking a
-- coupon offline (denial-of-service against running promos). The RPC
-- only needs to run from the checkout server action (service_role) and
-- post-login flows (authenticated).

revoke execute on function public.increment_coupon_uses(uuid) from public, anon;
grant execute on function public.increment_coupon_uses(uuid) to authenticated, service_role;
