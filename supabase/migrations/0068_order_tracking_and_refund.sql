-- supabase/migrations/0068_order_tracking_and_refund.sql
-- Adds tracking + refund columns and extends the order status check
-- to include 'shipped'. Round 1 of the launch checklist.

alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists tracking_url    text,
  add column if not exists shipped_at      timestamptz,
  add column if not exists refund_cents    int4 default 0,
  add column if not exists refunded_at     timestamptz,
  add column if not exists refund_note     text;

-- Extend the status check constraint to allow 'shipped'.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add  constraint orders_status_check
  check (status in ('pending','processing','ready','shipped','completed','cancelled'));
