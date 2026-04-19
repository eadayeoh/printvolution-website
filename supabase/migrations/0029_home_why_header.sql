-- 0029_home_why_header.sql
-- Seed all home page section headers so the previously hardcoded copy
-- ("Three reasons we don't suck.", "Everything we make.", "03 Trusted
-- since 2014", "Things people ask us.", "Paya Lebar Square, SG.") is
-- editable from admin. Defaults match the copy that was compiled into
-- the component files before this migration.
-- Idempotent: existing admin edits are preserved.

insert into public.page_content (page_key, section_key, data) values

  ('home', 'why.header', '{"items":[
     {
       "label":"01 Why Printvolution",
       "title":"Three reasons",
       "title_accent":"we *don''t suck.*",
       "intro":"Most printing companies in Singapore treat your file like a transaction — upload, pay, hope for the best. We treat it like a job with your name on it."
     }
   ]}'::jsonb),

  ('home', 'categories.header', '{"items":[
     {
       "label":"02 Product Catalogue",
       "title":"Everything we",
       "title_accent":"make.",
       "intro":"From silk-laminated business cards to custom photo mugs — pick a side, pick a product, configure live, order in under 5 minutes."
     }
   ]}'::jsonb),

  ('home', 'proof.header', '{"items":[
     { "label":"03 Trusted since 2014" }
   ]}'::jsonb),

  ('home', 'faq.header', '{"items":[
     {
       "label":"05 Questions",
       "title":"Things people",
       "title_accent":"ask us."
     }
   ]}'::jsonb),

  ('home', 'location.header', '{"items":[
     {
       "label":"06 Visit Us",
       "title":"Paya Lebar Square,",
       "title_accent":"SG."
     }
   ]}'::jsonb)

on conflict (page_key, section_key) do nothing;
