-- Trust chips were only populated on ~10 of 38 print products and were
-- removed from the hero. Drop the column so nothing dangles.
alter table public.product_extras drop column if exists chips;
