-- 0020_redesign_chunk2_home_content.sql
-- Seed default (home, *) page_content rows for the v4 brutalist homepage.
-- Idempotent — existing admin edits are preserved.

insert into public.page_content (page_key, section_key, data) values

  ('home', 'hero.split', '{"items":[
     {"side":"print","kicker":"Printing Services","headline":"Print that","headline_accent":"shows up on time.","body":"Name cards, flyers, banners, uniforms, signage — all under one roof at Paya Lebar Square. File check on every job. Express 24h available.","cta_label":"Browse Printing","cta_href":"/shop","image_url":"/images/name-card.webp"},
     {"side":"gifts","kicker":"Personalised Gifts","headline":"Gifts they''ll","headline_accent":"actually keep.","body":"LED photo frames, engraved tumblers, custom tote bags, corporate hampers. Walk in with an idea — leave with a gift they''ll keep.","cta_label":"Shop Gifts","cta_href":"/shop?gift=1","image_url":"/images/custom-keychain.webp"}
   ]}'::jsonb),

  ('home', 'ticker', '{"items":[
     {"text":"Name Cards"},{"text":"Flyers"},{"text":"Roll-Up Banners"},
     {"text":"Stickers"},{"text":"Embroidery"},{"text":"Polo Shirts"},
     {"text":"UV DTF"},{"text":"NFC Cards"},{"text":"Booklets"},
     {"text":"Tote Bags"},{"text":"Acrylic Signs"},{"text":"Corporate Gifts"}
   ]}'::jsonb),

  ('home', 'why.cards', '{"items":[
     {"num":"01","title":"Files checked by humans","body":"Every print file is reviewed by a real person within 2 hours. We catch CMYK issues, low-res images, missing bleed — before the press runs."},
     {"num":"02","title":"Live, honest pricing","body":"No quote emails. No ''contact us for pricing.'' Configure your job, see the real number. Volume discounts shown, never hidden."},
     {"num":"03","title":"Fast. Not reckless.","body":"Same-day collection for digital jobs before 4pm. Offset runs 3 working days. Delivery next day. We hit the deadline or tell you early."}
   ]}'::jsonb),

  ('home', 'categories.tabs', '{"items":[
     {"tab_key":"print","tab_label":"Printing","product_slugs":["name-card","flyers","roll-up-banner","stickers","acrylic-signage","polo-shirts","books","paper-bag"],"badges":{"name-card":"Bestseller","flyers":"Same-day","roll-up-banner":"Hot","stickers":"New"}},
     {"tab_key":"gifts","tab_label":"Gifts","product_slugs":["led-photo-frame","nfc-card","bar-necklace","yeti-mug","3d-bar-keychain","line-art-embroidery-shirt","custom-cake-topper","apron"],"badges":{"led-photo-frame":"Bestseller","nfc-card":"New"}}
   ]}'::jsonb),

  ('home', 'proof.main', '{"items":[
     {"kind":"quote","text":"They caught a CMYK conversion issue in my file before it went to press. Nobody else did that.","cite":"Marketing Director, SG fintech"},
     {"kind":"stat","num":"12","suffix":"yrs","label":"Printing since 2014"},
     {"kind":"stat","num":"90","suffix":"+","label":"Products on catalogue"},
     {"kind":"stat","num":"400","suffix":"+","label":"Corporate accounts"},
     {"kind":"stat","num":"24","suffix":"h","label":"Express turnaround"}
   ]}'::jsonb),

  ('home', 'how.header', '{"items":[
     {"headline":"Upload. Check.","headline_accent":"Press.","body":"No back-and-forth emails. No mystery pricing. No ''we''ll get back to you.'' This is how printing in Singapore should''ve always worked.","cta_label":"Start Your First Job","cta_href":"/shop"}
   ]}'::jsonb),

  ('home', 'how.steps', '{"items":[
     {"num":"01","title":"Configure & see live price","body":"Stock, size, finish, quantity — price updates as you go.","time":"~2 min"},
     {"num":"02","title":"Upload your print file","body":"PDF, AI, PSD. Auto-checked for bleed, resolution, CMYK.","time":"~1 min"},
     {"num":"03","title":"Preflight by our team","body":"A real human checks it. We flag issues before press runs.","time":"within 2h"},
     {"num":"04","title":"Print, pack, deliver","body":"Collect at Paya Lebar or islandwide next-day delivery.","time":"1–3 days"}
   ]}'::jsonb),

  ('home', 'faq.items', '{"items":[
     {"question":"How fast is printing at Printvolution?","answer":"Same-day collection is available for digital print jobs submitted before 4pm at our Paya Lebar Square location. Offset printing runs 3 working days. Islandwide delivery is next-day after production."},
     {"question":"What printing services do you offer?","answer":"90+ products across business cards (digital, offset, luxury), posters, stickers, booklets, flyers, letterheads, envelopes, notebooks, canvas, paper bags, uniforms, and personalised gifts. B2B corporate and B2C individual orders."},
     {"question":"Do you check my print file before printing?","answer":"Yes. Every file is reviewed by a real person within 2 hours. We check CMYK conversion, 300dpi resolution, 3mm bleed, font embedding, and overprint settings."},
     {"question":"Where are you located?","answer":"60 Paya Lebar Road, #B1-35, Singapore 409051. Walk-in collection and consultations Mon–Sat 10am–7.30pm. Two minutes from Paya Lebar MRT."},
     {"question":"Do you offer corporate accounts with invoicing?","answer":"Yes. 400+ SG businesses have corporate accounts with us. Consolidated monthly invoicing, PO support, GST-registered billing, dedicated account management, and volume pricing."},
     {"question":"What file formats do you accept?","answer":"Print-ready PDF preferred. Also AI, PSD, INDD (packaged). Use CMYK, 300dpi, 3mm bleed."}
   ]}'::jsonb),

  ('home', 'location.main', '{"items":[
     {"kind":"address","label":"Address","detail":"60 Paya Lebar Road, #B1-35, Singapore 409051"},
     {"kind":"hours","label":"Hours","detail":"Mon–Sat · 10am – 7.30pm"},
     {"kind":"phone","label":"Phone","detail":"+65 8553 3497","href":"https://wa.me/6585533497"},
     {"kind":"email","label":"Email","detail":"hello@printvolution.sg","href":"mailto:hello@printvolution.sg"},
     {"kind":"mrt","label":"MRT","detail":"Paya Lebar (EW8 / CC9) — 2 min walk"}
   ]}'::jsonb),

  ('home', 'final_cta.main', '{"items":[
     {"headline":"Got a file?","headline_accent":"Press start.","body":"Live pricing, human preflight, same-day collection. Your print, done properly.","cta_label":"Start a Job Now","cta_href":"/shop"}
   ]}'::jsonb)

on conflict (page_key, section_key) do nothing;
