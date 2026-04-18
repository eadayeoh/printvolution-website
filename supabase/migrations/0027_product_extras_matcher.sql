-- 0027_product_extras_matcher.sql
-- Admin-authored override for the per-product "Tell us the job,
-- we'll tell you the pick." IF/THEN matcher section. Null / empty =
-- component uses the curated default baked into the component.

alter table public.product_extras
  add column if not exists matcher jsonb;
