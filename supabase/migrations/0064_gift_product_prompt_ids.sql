-- Per-product art-style allowlist.
--
-- Until now the customer's "Pick art style" picker showed every
-- active prompt that matched the product's mode (modulo any
-- pinned pipeline). Some products want a curated subset — e.g.
-- "for the pet parent" should only offer the cartoon styles, not
-- the wedding photo styles, even though both share the UV mode.
--
-- prompt_ids is an array of gift_prompts.id values. When set + non-
-- empty, the customer only sees those prompts. When null or empty,
-- the existing fallback (mode + pipeline filtering) still applies.

alter table public.gift_products
  add column if not exists prompt_ids jsonb;

comment on column public.gift_products.prompt_ids is
  'Optional array of gift_prompts.id values. When non-empty, the customer-facing art-style picker is restricted to these prompts. When null or empty, fall back to mode + pipeline filtering.';
