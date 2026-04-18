-- 0019_redesign_chunk1_global_content.sql
-- Seed default (global, *) page_content rows that back the v4 redesign chrome.
-- Idempotent — safe to re-run; existing admin edits are preserved.

insert into public.page_content (page_key, section_key, data) values
  ('global', 'announce', '{"items":[
     {"text":"Same-day collection until 4pm","bold_part":"4pm"},
     {"text":"Paya Lebar Square, SG"},
     {"text":"Free delivery over S$80","bold_part":"S$80"}
   ]}'::jsonb),
  ('global', 'footer.brand', '{"items":[
     {"tagline":"Singapore''s friendliest print house. Printing services and personalised gifts, under one roof. Est. 2014."}
   ]}'::jsonb),
  ('global', 'footer.company', '{"items":[
     {"label":"About us","href":"/about"},
     {"label":"Corporate accounts","href":"/contact"},
     {"label":"Blog","href":"/blog"},
     {"label":"Membership","href":"/membership"}
   ]}'::jsonb),
  ('global', 'footer.support', '{"items":[
     {"label":"Contact us","href":"/contact"},
     {"label":"FAQs","href":"/faq"},
     {"label":"Bundles","href":"/bundles"},
     {"label":"My account","href":"/account"}
   ]}'::jsonb),
  ('global', 'footer.visit', '{"items":[
     {"kind":"address","label":"60 Paya Lebar Road","detail":"#B1-35, Singapore 409051"},
     {"kind":"hours","label":"Mon–Sat","detail":"10am – 7.30pm"},
     {"kind":"email","label":"hello@printvolution.sg","href":"mailto:hello@printvolution.sg"},
     {"kind":"phone","label":"+65 8553 3497","href":"https://wa.me/6585533497"}
   ]}'::jsonb),
  ('global', 'footer.social', '{"items":[
     {"label":"IG","href":"https://www.instagram.com/printvolution/","aria":"Instagram"},
     {"label":"WA","href":"https://wa.me/6585533497","aria":"WhatsApp"}
   ]}'::jsonb)
on conflict (page_key, section_key) do nothing;
