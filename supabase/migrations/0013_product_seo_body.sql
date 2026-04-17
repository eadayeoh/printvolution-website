-- Per-product SEO body paragraph rendered at the bottom of the product
-- page. Previously hardcoded with {product.name} + {fromPrice} tokens —
-- now editable via the admin SEO tab so it can be tuned per product.
alter table public.product_extras
  add column if not exists seo_body text;
