-- Per-template price add-on. When admin attaches a template to a
-- product, picking the template adds this much (in cents) to the line
-- price floor at checkout. Default 0 = no upcharge (matches the
-- behaviour before this column existed).
--
-- Customer-side display reads the same value and shows "(+S$X.XX)" on
-- the template picker tile so the customer sees what the premium
-- costs before they pick.

alter table public.gift_templates
  add column if not exists price_delta_cents integer not null default 0;

comment on column public.gift_templates.price_delta_cents is
  'Per-template upcharge in cents. Added to expected unit price at checkout when this template is selected. 0 = no upcharge.';

-- Sanity check: never negative. Discounts on templates aren't a
-- pattern we support; if admin wants to discount, drop the base price
-- on the variant.
alter table public.gift_templates
  add constraint gift_templates_price_delta_nonnegative
  check (price_delta_cents >= 0);
