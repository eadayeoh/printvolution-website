-- Gift product mockups: upload a product shot (mug / shirt / keychain
-- etc.) and define the region where the customer's transformed design
-- gets composited at preview time.

alter table public.gift_products
  add column if not exists mockup_url text,
  add column if not exists mockup_area jsonb not null default '{"x":20,"y":20,"width":60,"height":60}'::jsonb;
