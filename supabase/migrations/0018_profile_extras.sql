-- Richer profile: address, alternative contact methods, marketing
-- preferences, admin notes. Lives on public.profiles (one row per
-- signed-in user). Guest checkouts still just get an orders row +
-- optional members row — no sign-up required.
--
-- The admin_notes column is staff-only: no user-facing policy covers
-- it, only admin-write policies from 0001_init are in force, and
-- the customer profile form never reads or writes it.
alter table public.profiles
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists postal_code text,
  add column if not exists country text default 'SG',
  add column if not exists telegram text,         -- @handle
  add column if not exists line_id text,          -- LINE ID
  add column if not exists wechat text,           -- WeChat ID
  add column if not exists date_of_birth date,
  add column if not exists company text,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists referral_source text,  -- how did you hear about us
  add column if not exists admin_notes text;      -- staff-only; not editable by the user

-- Index for admin search on common lookup fields
create index if not exists idx_profiles_company on public.profiles(lower(company));
create index if not exists idx_profiles_postal on public.profiles(postal_code);

-- Tighten the user-update policy from 0001_init: the existing
-- "users update own profile" policy was permissive over the whole row.
-- Now we explicitly block non-admins from writing role or admin_notes
-- via a BEFORE UPDATE trigger, matching the pattern we already use on
-- the members table for points/tier.
create or replace function public.profiles_block_privileged_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff_or_admin() then
    -- Customer self-edit path: protect role + admin_notes.
    new.role := old.role;
    new.admin_notes := old.admin_notes;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_block_privileged_update on public.profiles;
create trigger trg_profiles_block_privileged_update
  before update on public.profiles
  for each row
  execute function public.profiles_block_privileged_update();
