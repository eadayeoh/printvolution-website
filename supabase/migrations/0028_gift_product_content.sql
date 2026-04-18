-- 0028_gift_product_content.sql
-- Admin-editable content fields for gift product pages. NULL = component
-- falls back to the mode-based default baked into the React component.

alter table gift_products
  add column if not exists seo_body text,
  add column if not exists seo_magazine jsonb,
  add column if not exists faqs jsonb;

comment on column gift_products.seo_body is
  '2-line keyword-dense crawler footer. Plain text, no markdown.';
comment on column gift_products.seo_magazine is
  'Per-gift override for the SEO Magazine section. Matches MagValue shape.';
comment on column gift_products.faqs is
  'Array of { question, answer } strings rendered in the FAQ accordion.';
