-- CRITICAL fix: the legacy "anon update own member" policy was
--   for update using (true) with check (true)
-- which let any anonymous caller update any member's points_balance
-- directly via Supabase REST. The members table has no user_id column
-- to bind ownership, so the safest fix is to remove the public update
-- policy entirely — all member mutations go through server actions that
-- use the service role (checkout, account settings, admin edits) and
-- are rate-limited / auth-checked there.
drop policy if exists "anon update own member" on public.members;

-- Defence in depth: even if some future policy is re-added too loosely,
-- a trigger blocks anon/authenticated callers from ever raising
-- points_balance, total_earned or tier. Only service-role requests
-- (which bypass RLS) can move those fields.
create or replace function public.members_block_points_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_privileged boolean := public.is_staff_or_admin();
begin
  if not is_privileged then
    if tg_op = 'INSERT' then
      new.points_balance := 0;
      new.total_earned := 0;
      new.tier := coalesce(new.tier, 'standard');
    elsif tg_op = 'UPDATE' then
      new.points_balance := old.points_balance;
      new.total_earned := old.total_earned;
      new.tier := old.tier;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_members_block_points_ins on public.members;
create trigger trg_members_block_points_ins
  before insert on public.members
  for each row
  execute function public.members_block_points_mutation();

drop trigger if exists trg_members_block_points_upd on public.members;
create trigger trg_members_block_points_upd
  before update on public.members
  for each row
  execute function public.members_block_points_mutation();
