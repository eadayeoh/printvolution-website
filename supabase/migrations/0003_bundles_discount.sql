-- Bundle discount: admin picks products + sets either a $ or % off
-- instead of manually entering bundle price.
alter table public.bundles
  add column if not exists discount_type text check (discount_type in ('pct','flat')),
  add column if not exists discount_value int default 0;  -- percent (0-100) or cents

-- Migrate existing bundles: derive discount from original vs current price
update public.bundles
set
  discount_type = case
    when original_price_cents > 0 and price_cents < original_price_cents then 'flat'
    else null
  end,
  discount_value = case
    when original_price_cents > 0 and price_cents < original_price_cents
    then original_price_cents - price_cents
    else 0
  end
where discount_type is null;

-- Bundle product selection now drives the total. Remove the `qty/spec/value`
-- display-only strings and use actual product_id + override_qty (how many units
-- of that product are included in the bundle).
alter table public.bundle_products
  add column if not exists override_qty int default 1,
  add column if not exists override_config jsonb default '{}'::jsonb;

comment on column public.bundles.discount_type is 'pct | flat | null (no discount)';
comment on column public.bundles.discount_value is 'percent (0-100) when type=pct, cents when type=flat';
