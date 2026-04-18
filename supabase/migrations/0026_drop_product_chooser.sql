-- 0026_drop_product_chooser.sql
-- The interactive "Find your perfect card in 30 seconds" Paper Chooser
-- is being removed in favour of a static "Here's what you're actually
-- buying" before/after comparison section. No product in production
-- uses this field for real content (only placeholder test data).

alter table public.product_extras drop column if exists chooser;
