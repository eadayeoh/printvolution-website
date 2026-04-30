-- Customer-edit-link feature. Staff configures an order on a
-- customer's behalf (phone-in, walk-in, sales call), then ships them
-- a tokenized link so they can review, tweak qty, swap delivery
-- method, change notes, etc — without needing an account.
--
-- customer_edit_token: opaque base64url string. Owns access to
--   /order/[token]; partial unique index forbids re-use.
-- customer_edit_locked: staff toggles this once the order is
--   committed to production so the customer can't edit underneath
--   us. Server actions reject saves when this is true.
-- customer_edit_last_at: bookkeeping for "customer touched this
--   order on Y" so the staff queue can show recent activity.

alter table public.orders
  add column if not exists customer_edit_token text,
  add column if not exists customer_edit_locked boolean not null default false,
  add column if not exists customer_edit_last_at timestamptz;

create unique index if not exists ux_orders_customer_edit_token
  on public.orders(customer_edit_token)
  where customer_edit_token is not null;
