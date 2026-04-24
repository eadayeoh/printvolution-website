-- 0055_gift_product_occasions_process.sql
-- Per-product "Who's it for?" (occasions) and "How it works" (process steps)
-- overrides. NULL / empty = gift-product-page.tsx falls back to its built-in
-- default content. Lets each gift product tell its own story instead of
-- sharing the generic gift/occasion card set baked into the component.

alter table gift_products
  add column if not exists occasions jsonb,
  add column if not exists process_steps jsonb;

comment on column gift_products.occasions is
  'Array of { icon, title, tip, suggested? } for the "Who''s it for?" band. NULL = component default.';
comment on column gift_products.process_steps is
  'Array of { title, time, desc } for the "How it works" band. NULL = component default.';
