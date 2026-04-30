-- Repeat-business + post-delivery columns. Five features fan out
-- from one migration so we don't rev the orders table five separate
-- times in production.
--
-- 1. Reorder reminder ("subscription"). Customer opts in at checkout
--    to get an email N days from now reminding them to reorder.
--    next_reorder_remind_at is set to now()+N at checkout; the
--    /api/cron/reorder-reminders route sends + clears it.
-- 2. Pickup-ready reminder. /api/cron/pickup-reminders pings
--    customers whose orders have been status='ready' for >48h and
--    haven't been pinged yet.
-- 3. Proof-for-approval (gift items). Each gift_order_item gets a
--    proof_token + proof_status so the customer-facing /proof/[token]
--    page can approve/reject without auth.
-- 4. Post-delivery NPS. nps_responses(token, score, comment) is what
--    /survey/[token] writes; /api/cron/nps-survey seeds the row +
--    emails the link.

alter table public.orders
  add column if not exists reorder_remind_days int,
  add column if not exists next_reorder_remind_at timestamptz,
  add column if not exists reorder_reminded_count int not null default 0,
  add column if not exists ready_reminded_at timestamptz;

create index if not exists idx_orders_reorder_remind
  on public.orders(next_reorder_remind_at)
  where next_reorder_remind_at is not null;

create index if not exists idx_orders_ready_unreminded
  on public.orders(updated_at)
  where status = 'ready' and ready_reminded_at is null;

alter table public.gift_order_items
  add column if not exists proof_status text not null default 'n/a'
    check (proof_status in ('n/a', 'pending', 'approved', 'rejected')),
  add column if not exists proof_token text,
  add column if not exists proof_sent_at timestamptz,
  add column if not exists proof_responded_at timestamptz,
  add column if not exists proof_response_note text;

-- Partial unique to allow multiple rows with NULL token while still
-- forbidding two rows sharing the same non-NULL token.
create unique index if not exists ux_gift_order_items_proof_token
  on public.gift_order_items(proof_token)
  where proof_token is not null;

create table if not exists public.nps_responses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  token text not null unique,
  score int check (score is null or (score between 0 and 10)),
  comment text,
  email_sent_at timestamptz default now(),
  responded_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_nps_order on public.nps_responses(order_id);

-- RLS: rows are addressed by their opaque token, so we let the
-- anon role read + update any row. The token itself is the auth.
alter table public.nps_responses enable row level security;
drop policy if exists nps_anon_read on public.nps_responses;
create policy nps_anon_read on public.nps_responses for select to anon using (true);
drop policy if exists nps_anon_update on public.nps_responses;
create policy nps_anon_update on public.nps_responses for update to anon using (true) with check (true);
-- Inserts are service-role only (cron job seeds them).
