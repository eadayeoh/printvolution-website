-- Add ownership columns to gift_assets. Existing rows are left NULL
-- (legacy free-pass) — application code skips ownership enforcement
-- when both columns are null and only enforces for newly-inserted rows
-- that captured the caller. After ~1 week of new orders, a follow-up
-- commit can promote the check to strict.

alter table public.gift_assets
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists anon_session_id text;

create index if not exists gift_assets_user_id_idx
  on public.gift_assets(user_id) where user_id is not null;
create index if not exists gift_assets_anon_session_idx
  on public.gift_assets(anon_session_id) where anon_session_id is not null;

comment on column public.gift_assets.user_id is
  'Authenticated owner at insert time. Null for legacy or anon-uploaded rows.';
comment on column public.gift_assets.anon_session_id is
  'pv_anon_session cookie value at insert time, when no user_id was present.';
