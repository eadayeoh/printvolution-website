-- Order-level gift wrap + handwritten message.
--
-- Customers tick a "Gift wrap (+S$3)" box at checkout and optionally
-- type a short note we copy onto the wrap. Stored on the order so
-- fulfilment sees it on the print packet without extra joins.
--
-- gift_wrap_cents is the cents added to the order total (flat for now;
-- variable pricing per item is a later iteration). gift_message is
-- capped to 280 chars at the application level — the column itself is
-- left unconstrained.

alter table public.orders
  add column if not exists gift_wrap boolean not null default false;

alter table public.orders
  add column if not exists gift_wrap_cents int not null default 0;

alter table public.orders
  add column if not exists gift_message text;
