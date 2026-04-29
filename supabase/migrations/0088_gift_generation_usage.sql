-- Tracks gift AI preview generations for quota enforcement.
-- Layered keys:
--   user_id           — signed-in user (8/week cap)
--   anon_session_id   — per-browser cookie (3/week cap)
--   ip                — hard ceiling per IP (15/week) regardless of cookie
-- Only AI-generation rows go in here; non-AI photo-resize previews
-- don't burn OpenAI tokens and aren't counted.

create table if not exists public.gift_generation_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anon_session_id text,
  ip text,
  consumed_at timestamptz not null default now(),
  source_asset_id uuid references public.gift_assets(id) on delete set null,
  preview_asset_id uuid references public.gift_assets(id) on delete set null
);

create index if not exists gift_gen_usage_user_consumed_idx
  on public.gift_generation_usage(user_id, consumed_at desc)
  where user_id is not null;
create index if not exists gift_gen_usage_anon_consumed_idx
  on public.gift_generation_usage(anon_session_id, consumed_at desc)
  where anon_session_id is not null;
create index if not exists gift_gen_usage_ip_consumed_idx
  on public.gift_generation_usage(ip, consumed_at desc);

-- Atomic claim: when an anon converts to signed-up, link their last
-- 7d of generations to the user_id so the cap survives the transition
-- (anon hits 3 → signs up → has 5 left, not 8).
create or replace function public.claim_anon_gift_usage(p_user_id uuid, p_anon_session_id text)
returns void
language sql security definer set search_path = public
as $$
  update public.gift_generation_usage
     set user_id = p_user_id
   where user_id is null
     and anon_session_id = p_anon_session_id
     and consumed_at >= now() - interval '7 days';
$$;
grant execute on function public.claim_anon_gift_usage(uuid, text) to authenticated, anon, service_role;
