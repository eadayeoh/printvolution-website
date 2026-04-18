-- Payments scaffolding — OFF by default.
--
-- When the operator is ready to go live with HitPay (or any other
-- gateway), they flip HITPAY_ENABLED=true in the env and fill the
-- credentials. Until then every column below defaults to a "manual"
-- payment flow: the order is recorded, staff reconcile via bank
-- transfer / PayNow, and the status progresses without a gateway
-- webhook touching anything.
--
-- No card data, bank detail or PAN ever lives in our DB. HitPay is a
-- hosted-redirect gateway: the customer's browser goes to hitpay.com,
-- pays there, and HitPay POSTs a signed webhook back to
-- /api/webhooks/hitpay. We only store the opaque payment_request_id
-- and status transitions — this keeps us out of PCI scope.

-- 1. Order-level payment fields
alter table public.orders
  add column if not exists payment_method text not null default 'manual' check (
    payment_method in ('manual', 'hitpay')
  ),
  add column if not exists payment_status text not null default 'unpaid' check (
    payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')
  ),
  add column if not exists payment_reference text,       -- gateway reference / receipt
  add column if not exists payment_amount_cents int,     -- what we asked the gateway for
  add column if not exists payment_currency text default 'SGD',
  add column if not exists payment_paid_at timestamptz,
  add column if not exists payment_failed_reason text;

create index if not exists idx_orders_payment_status on public.orders(payment_status);

-- 2. Gateway-event audit log. Every webhook we receive goes here,
-- verified or not, so we have a paper trail when reconciling. Only
-- admins read it; the webhook handler inserts via service role.
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  gateway text not null,                  -- 'hitpay' | future gateways
  event_type text not null,               -- 'charge.completed', 'charge.failed' etc.
  payload_json jsonb not null,            -- raw JSON body from the gateway
  signature_valid boolean not null,       -- did we verify the HMAC?
  processed_at timestamptz not null default now()
);

create index if not exists idx_payment_events_order on public.payment_events(order_id);
create index if not exists idx_payment_events_processed on public.payment_events(processed_at desc);

alter table public.payment_events enable row level security;

drop policy if exists "payment_events staff read" on public.payment_events;
create policy "payment_events staff read" on public.payment_events
  for select using (public.is_staff_or_admin());

-- No anon/authenticated write policy. All inserts come from the
-- webhook handler using the service-role client (bypasses RLS).
