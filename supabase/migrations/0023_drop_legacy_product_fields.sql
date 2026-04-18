-- 0023_drop_legacy_product_fields.sql
-- Delete columns we no longer render anywhere on the site:
--   products.highlights        — old pink-bulleted list under the hero
--   products.specs             — old specifications right-side card
--   product_extras.why_us      — old "why buyers come back" numbered list
--   product_extras.why_headline
--   product_extras.use_cases   — never rendered on v6
--   product_extras.hero_color  — never used by the brutalist hero
--
-- All of these stopped rendering in the Chunk-3 product-page rewrite and
-- the subsequent cleanup. Data is not being displayed and editing it has
-- no visible effect — removing to avoid admin confusion and to clean up
-- the ProductDetail surface area.

alter table public.products
  drop column if exists highlights,
  drop column if exists specs;

alter table public.product_extras
  drop column if exists why_us,
  drop column if exists why_headline,
  drop column if exists use_cases,
  drop column if exists hero_color;
