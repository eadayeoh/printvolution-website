-- Order idempotency.
--
-- Without this column, a double-click on Place Order, a network
-- retry on a slow mobile connection, or two checkout tabs racing
-- could each insert their own order row for the same intended
-- transaction. The server-side guard hashing on email + cart was
-- approximate at best; a stable client-supplied key is the
-- canonical fix.
--
-- Clients now mint a UUID per checkout session and pass it as
-- `idempotency_key`. The unique index makes the second insert
-- error out, and the server action then re-fetches the original
-- row and returns its order_number — same response the customer
-- would have seen on the first call.

alter table public.orders
  add column if not exists idempotency_key text;

-- Partial unique index: NULLs are allowed (legacy rows + the
-- handful of admin-created orders that bypass this flow).
create unique index if not exists orders_idempotency_key_unique
  on public.orders(idempotency_key)
  where idempotency_key is not null;
