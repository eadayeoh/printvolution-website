-- 0053_gift_lead_time.sql
-- Per-product turnaround (business days) so the gift product page
-- can show the same "Ready by" calendar card that print products have.

alter table public.gift_products
  add column if not exists lead_time_days int not null default 5;

comment on column public.gift_products.lead_time_days is
  'Business-day turnaround from order placed to ready-for-collection. Drives the Ready-by calendar card on the customer-facing page. Weekends are skipped; SG public holidays are not — set a slightly longer number if you need to absorb them.';
