-- 0021_redesign_about_contact.sql
-- Seed default page_content rows for the v6 /about and v4 /contact redesigns.
-- Idempotent — existing admin edits preserved.

insert into public.page_content (page_key, section_key, data) values

  -- ABOUT PAGE --------------------------------------------------------------

  ('about', 'hero.v6', '{"items":[
     {"kicker":"About PrintVolution","headline":"The Singapore","headline_em":"print shop that gives","headline_pink":"a damn.","body":"Twelve years at Paya Lebar Square. 90+ print products. 400+ corporate accounts. Every file still checked by a real human before it hits the press.","image_url":""}
   ]}'::jsonb),

  ('about', 'story.header', '{"items":[
     {"label_num":"01","label":"Our Story","title":"We started because printing in SG","title_em":"kind of sucked.","intro":"Short version: most SG print shops in 2014 treated files like transactions. We opened Printvolution because someone had to do it properly.","image_url":""}
   ]}'::jsonb),

  ('about', 'story.paras', '{"items":[
     {"text":"In 2014, getting decent print work done in Singapore meant one of three things: wait three weeks, pay too much, or accept that your cards would come back with colours shifted and bleed missed. Usually all three."},
     {"text":"We opened Printvolution at Paya Lebar with two presses, one designer, and one simple rule: **no job goes on the press until a human has looked at the file**. Twelve years later, the rule hasn''t changed — it just got faster."},
     {"text":"Today we run 90+ print products plus a growing catalogue of personalised gifts — mugs, tees, tote bags, keychains. Still at Paya Lebar. Files still checked by humans. Deadlines still met."}
   ]}'::jsonb),

  ('about', 'stats.header', '{"items":[
     {"label":"By the numbers","title":"Twelve years of","title_yellow":"receipts."}
   ]}'::jsonb),

  ('about', 'stats.items', '{"items":[
     {"num":"12","suffix":"yrs","label":"At Paya Lebar Square since 2014"},
     {"num":"90","suffix":"+","label":"Print products in the catalogue"},
     {"num":"400","suffix":"+","label":"Corporate accounts across Singapore"},
     {"num":"2","suffix":"hr","label":"Preflight turnaround on every file"}
   ]}'::jsonb),

  ('about', 'beliefs.header', '{"items":[
     {"label_num":"02","label":"What we believe","title":"Three","title_pink":"rules","title_suffix":"we print by.","intro":"These are the rules we''ve held for twelve years. They''re why our regulars keep coming back."}
   ]}'::jsonb),

  ('about', 'beliefs.cards', '{"items":[
     {"num":"01","title":"A file is not just a file.","body":"It''s your brand, your launch, your wedding invite, your kid''s first recital. We treat every job **like it has your name on it** — because it does."},
     {"num":"02","title":"Quotes shouldn''t be a game.","body":"No ''contact us for pricing.'' No phantom checkout fees. Configure your job, see the real number. **Volume discounts shown, never hidden.**"},
     {"num":"03","title":"Fast means fast. Not reckless.","body":"Same-day exists because we built our workflow around it — not because we skip checks. If your file has an issue, **you hear from us at 10am, not 6pm.**"}
   ]}'::jsonb),

  ('about', 'shop.header', '{"items":[
     {"label_num":"03","label":"The Shop","title":"Where it all","title_em":"happens.","intro":"Two presses, one paper library, a preflight desk, and a collection counter. Walk in any day — we''d rather meet you than email you."}
   ]}'::jsonb),

  ('about', 'shop.tiles', '{"items":[
     {"caption":"Shopfront","image_url":""},
     {"caption":"Press Floor","image_url":""},
     {"caption":"Paper Library","image_url":""},
     {"caption":"Preflight Desk","image_url":""},
     {"caption":"Finishing Station","image_url":""},
     {"caption":"Collection Counter","image_url":""}
   ]}'::jsonb),

  ('about', 'promises.header', '{"items":[
     {"label_num":"04","label":"What You Get","title":"Four things we always","title_em":"deliver.","intro":"We don''t promise everything. We promise these — and we''ve been delivering them since 2014."}
   ]}'::jsonb),

  ('about', 'promises.items', '{"items":[
     {"num":"01","title":"Every file checked by a human","body":"Within 2 working hours. We catch CMYK, bleed, low-res, and font issues before the press runs — not after.","tag":"Preflight Standard","tone":"magenta"},
     {"num":"02","title":"Live, honest pricing","body":"Configure your job, see the real number including GST. Volume discounts applied automatically. No phantom fees.","tag":"Pricing Promise","tone":"cyan"},
     {"num":"03","title":"On-time, or we tell you early","body":"Same-day collection for digital before 4pm. Offset in 3 working days. If something goes wrong, you hear from us at 10am.","tag":"Deadline Promise","tone":"yellow"},
     {"num":"04","title":"Paper you can actually feel","body":"90+ FSC-certified stocks from Japanese and Korean mills. No budget paper sneaked in to save costs. Samples available on request.","tag":"Material Standard","tone":"green"}
   ]}'::jsonb),

  ('about', 'final_cta.main', '{"items":[
     {"headline":"Got a job?","headline_yellow":"Let''s print it.","body":"Configure a print job, shop personalised gifts, or walk into the shop at Paya Lebar.","cta1_label":"Start a Print Job","cta1_href":"/shop","cta2_label":"Visit the Shop","cta2_href":"/contact"}
   ]}'::jsonb),

  -- CONTACT PAGE -------------------------------------------------------------

  ('contact', 'hero.v4', '{"items":[
     {"kicker":"Contact Us","headline":"Let''s talk","headline_accent":"print.","body":"Walk in, call, WhatsApp, or drop us a message. Whichever''s easiest for you — we reply within 2 working hours."}
   ]}'::jsonb),

  ('contact', 'methods', '{"items":[
     {"icon":"☎","label":"Fastest","title":"Call us","body":"Best for urgent quotes, same-day jobs, or questions about an existing order.","value":"+65 8553 3497","href":"tel:+6585533497","tone":"magenta"},
     {"icon":"✎","label":"Quick chat","title":"WhatsApp","body":"For quick questions, sample photos, or order updates. Usually within 15 min during business hours.","value":"+65 8553 3497","href":"https://wa.me/6585533497","tone":"yellow"},
     {"icon":"@","label":"Reply < 2hr","title":"Email","body":"Send files, ask questions, attach references. We reply within 2 working hours.","value":"hello@printvolution.sg","href":"mailto:hello@printvolution.sg","tone":"ink"},
     {"icon":"★","label":"Walk in","title":"Visit the shop","body":"Paya Lebar Square. Bring samples, meet the team, see the presses running.","value":"2 min from MRT","href":"#location","tone":"green"}
   ]}'::jsonb),

  ('contact', 'form.header', '{"items":[
     {"kicker":"Drop a message","title":"Tell us what you","title_em":"need.","sub":"For urgent same-day jobs, call instead. Otherwise we reply within 2 working hours."}
   ]}'::jsonb),

  ('contact', 'form.tabs', '{"items":[
     {"label":"General"},
     {"label":"Quote Request"},
     {"label":"Corporate Account"},
     {"label":"File Check"},
     {"label":"Existing Order"}
   ]}'::jsonb),

  ('contact', 'location.main', '{"items":[
     {"name":"Paya Lebar Square","subtitle":"The Shop · Since 2014","map_image_url":"","address_line1":"60 Paya Lebar Road","address_line2":"#B1-35 Paya Lebar Square","address_line3":"Singapore 409051","phone_label":"+65 8553 3497","phone_href":"tel:+6585533497","email_label":"hello@printvolution.sg","email_href":"mailto:hello@printvolution.sg","mrt_label":"Paya Lebar (EW8 / CC9)","mrt_detail":"2 min walk via Exit A","parking_label":"Paya Lebar Square B1","parking_detail":"First 30 min free","maps_url":"https://maps.google.com/?q=Paya+Lebar+Square+Singapore","whatsapp_url":"https://wa.me/6585533497"}
   ]}'::jsonb),

  ('contact', 'hours.header', '{"items":[
     {"kicker":"Opening hours","title":"Open","title_yellow":"every day,","title_suffix":"except PH.","body":"Same-day collection on digital jobs submitted before 4pm. Closed on Singapore public holidays."}
   ]}'::jsonb),

  ('contact', 'hours.days', '{"items":[
     {"day_label":"Mon","time":"9 – 7"},
     {"day_label":"Tue","time":"9 – 7"},
     {"day_label":"Wed","time":"9 – 7"},
     {"day_label":"Thu","time":"9 – 7"},
     {"day_label":"Fri","time":"9 – 7"},
     {"day_label":"Sat","time":"10 – 4"},
     {"day_label":"Sun","time":"10 – 4"}
   ]}'::jsonb),

  ('contact', 'faq', '{"items":[
     {"question":"How fast do you reply?","answer":"Within 2 working hours during opening times. For urgent same-day jobs, call the shop — faster than email or form."},
     {"question":"Can I walk in without an appointment?","answer":"Yes. We''re at Paya Lebar Square, 2 min from MRT. Walk in to collect orders, bring physical samples for matching, or just see the space. No appointment needed for standard enquiries."},
     {"question":"How do I get a custom quote?","answer":"Use the form with as much detail as you can — sizes, quantities, finish, deadline. Or call us. Most custom quotes returned within 2 hours. Standard products are live-priced on the site — no quote needed."},
     {"question":"I need help with my print file. Can someone check it?","answer":"Yes. Send your file via the form (up to 500MB), and our preflight team will check it for free and get back with any issues. No obligation to place an order."},
     {"question":"Do you set up corporate accounts?","answer":"Yes. We work with 400+ SG businesses. For corporate account setup — volume pricing, dedicated account manager, monthly invoicing, PO workflow — use the form and select ''Corporate Account'', or call and ask for account setup."}
   ]}'::jsonb)

on conflict (page_key, section_key) do nothing;
