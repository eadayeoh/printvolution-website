// Create three new Packaging products:
//   1. Gift Box — 5 sizes (GB01-GB05), 310gsm Art Card, 2-sided Matt
//      Lamination ± 1-side Spot UV, qty 100-3000.
//   2. Box Waist Seal Band — 420×50mm paper waist band, qty 1800-30000.
//   3. Drink Carriers (Coffee Cup Sleeve) — 310gsm Art Card, 262×50mm,
//      4C + 0C, qty 600-15000.
//
// Each gets inserted into:
//   products (+ pricing_table)
//   product_extras (seo + magazine + matcher)
//   product_configurator (steps)
//   product_faqs
//   mega_menu_items (under Packaging)

import fs from 'node:fs';
import crypto from 'node:crypto';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };

const PACKAGING_CAT = '1f58aef6-1016-4d84-8f25-50a5583c5228';
const PACKAGING_MM  = 'a86ad712-160b-49c3-a427-867954b90dc2';

async function upsertProduct(slug, row) {
  const existing = await (await fetch(`${BASE}/rest/v1/products?slug=eq.${slug}&select=id`, { headers: H })).json();
  if (existing.length > 0) return existing[0].id;
  const id = crypto.randomUUID();
  const r = await fetch(`${BASE}/rest/v1/products`, {
    method: 'POST', headers: H,
    body: JSON.stringify([{ id, slug, ...row }]),
  });
  if (!r.ok) throw new Error(`create ${slug}: ${r.status} ${await r.text()}`);
  return id;
}

async function wipeRelated(PID) {
  await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, { method: 'DELETE', headers: H });
  await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}`, { method: 'DELETE', headers: H });
  await fetch(`${BASE}/rest/v1/product_pricing?product_id=eq.${PID}`, { method: 'DELETE', headers: H });
  await fetch(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}`, { method: 'DELETE', headers: H });
}

async function setExtras(PID, extras) {
  const r = await fetch(`${BASE}/rest/v1/product_extras`, {
    method: 'POST', headers: H, body: JSON.stringify({ product_id: PID, ...extras }),
  });
  if (!r.ok) throw new Error(`extras: ${r.status} ${await r.text()}`);
}
async function setSteps(PID, steps) {
  const r = await fetch(`${BASE}/rest/v1/product_configurator`, {
    method: 'POST', headers: H,
    body: JSON.stringify(steps.map((s, i) => ({ product_id: PID, step_order: i, ...s }))),
  });
  if (!r.ok) throw new Error(`steps: ${r.status} ${await r.text()}`);
}
async function setFaqs(PID, faqs) {
  if (!faqs.length) return;
  const r = await fetch(`${BASE}/rest/v1/product_faqs`, {
    method: 'POST', headers: H,
    body: JSON.stringify(faqs.map((f, i) => ({ product_id: PID, question: f.question, answer: f.answer, display_order: i }))),
  });
  if (!r.ok) throw new Error(`faqs: ${r.status} ${await r.text()}`);
}
async function addMenuItem(slug, label, display_order) {
  await fetch(`${BASE}/rest/v1/mega_menu_items?mega_menu_id=eq.${PACKAGING_MM}&product_slug=eq.${slug}`, { method: 'DELETE', headers: H });
  await fetch(`${BASE}/rest/v1/mega_menu_items`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ mega_menu_id: PACKAGING_MM, product_slug: slug, label, display_order }),
  });
}

// ────────────────────────────────────────────────────────────────
// 1. GIFT BOX
// ────────────────────────────────────────────────────────────────

async function giftBox() {
  const SLUG = 'gift-box';
  const PID = await upsertProduct(SLUG, {
    name: 'Gift Box',
    icon: '🎁',
    tagline: 'Rigid gift boxes with a premium unboxing moment — corporate + retail',
    description: "Custom-printed gift boxes on 310gsm Art Card with 2-sided Matt Lamination and optional 1-side Spot UV. Five standard sizes (GB01-GB05), from 100 to 3,000 units. Rigid construction, soft-touch face, premium feel at a volume price.",
    category_id: PACKAGING_CAT,
    is_active: true,
    is_gift: false,
    sort_order: 60,
  });
  await wipeRelated(PID);

  const QTYS_NONE = [100, 200, 300, 500, 1000, 2000, 3000];
  const QTYS_UV   = [100, 300, 500, 1000, 2000, 3000]; // no 200
  const TIERS_UNION = [100, 200, 300, 500, 1000, 2000, 3000];

  // Price groups: GB01/02/03 share; GB04/05 share.
  const P_SM_NONE = { 100:163.80, 200:197.80, 300:237.80, 500:296.70, 1000:416.70, 2000:708.00, 3000:1071.70 };
  const P_LG_NONE = { 100:308.70, 200:357.80, 300:437.80, 500:536.70, 1000:776.70, 2000:1283.80, 3000:1935.90 };
  const P_SM_UV   = { 100:235.50, 300:269.50, 500:344.20, 1000:472.50, 2000:908.00, 3000:1351.00 };
  const P_LG_UV   = { 100:452.10, 300:501.20, 500:631.70, 1000:888.40, 2000:1683.80, 3000:2494.40 };
  const BY_SIZE = {
    gb01: { none: P_SM_NONE, yes: P_SM_UV }, gb02: { none: P_SM_NONE, yes: P_SM_UV }, gb03: { none: P_SM_NONE, yes: P_SM_UV },
    gb04: { none: P_LG_NONE, yes: P_LG_UV }, gb05: { none: P_LG_NONE, yes: P_LG_UV },
  };
  const axes = {
    size: [
      { slug:'gb01', label:'GB01' }, { slug:'gb02', label:'GB02' }, { slug:'gb03', label:'GB03' },
      { slug:'gb04', label:'GB04' }, { slug:'gb05', label:'GB05' },
    ],
    spot_uv: [
      { slug:'none', label:'2 Sided Matt Lamination' },
      { slug:'yes',  label:'2 Sided Matt Lam + 1 Side Spot UV', note:'Gloss highlight on front' },
    ],
  };
  const prices = {};
  for (const s of Object.keys(BY_SIZE)) {
    for (const uv of ['none','yes']) {
      for (const [q, d] of Object.entries(BY_SIZE[s][uv])) prices[`${s}:${uv}:${q}`] = Math.round(d * 100);
    }
  }
  const pricing_table = { axes, axis_order: ['size','spot_uv'], qty_tiers: TIERS_UNION, prices };
  await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ pricing_table, pricing_compute: null, lead_time_days: 14, print_mode: 'Offset' }),
  });
  await setSteps(PID, [
    { step_id:'size',    label:'Gift box size', type:'swatch', required:true, options: axes.size, show_if:null, step_config:{} },
    { step_id:'spot_uv', label:'Finishing',     type:'swatch', required:true, options: axes.spot_uv, show_if:null, step_config:{} },
    { step_id:'qty',     label:'Quantity',      type:'qty',    required:false, options:[], show_if:null,
      step_config: { min: 100, step: 100, presets: [100, 300, 500, 1000, 2000, 3000], note: null } },
  ]);
  await setExtras(PID, {
    seo_title: 'Custom Gift Box Printing Singapore | Rigid 310gsm Art Card',
    seo_desc:  "Custom gift box printing in Singapore — 310gsm Art Card, 2-sided Matt Lamination ± 1-side Spot UV. 5 standard sizes (GB01-GB05), from S$163.80/100pc. Corporate gifting, retail packaging, luxury brand drops.",
    seo_body:  `Gift box printing Singapore — custom rigid gift boxes on 310gsm Art Card, 2-sided Matt Lamination as standard with optional 1-side Spot UV highlight. Five standard sizes (GB01, GB02, GB03 share a price; GB04 and GB05 are the larger tier, also same price). 4C + 0C offset print. Runs from 100 to 3,000 units; from S$163.80 / 100 boxes on the smaller sizes, S$308.70 / 100 on the larger. Corporate gifting, luxury brand drops, retail packaging, wedding return gifts, festive Christmas / Chinese New Year hampers.`,
    intro:     `A gift box does more than protect what's inside — it sets the unboxing tone. We offset-print custom boxes on **310gsm Art Card** with **2-sided Matt Lamination** as the standard (adds a velvet face + protects the print against handling), and an optional **1-side Spot UV** highlight for a glossy logo or accent on the lid. Five standard sizes: **GB01-GB03** (smaller footprint, same price tier) and **GB04-GB05** (larger, also same price). Runs **100 to 3,000 boxes**. 14 working days offset production.`,
    matcher: {
      rows: [
        { need: "*Corporate CNY* / end-of-year gift boxes — small-medium", pick_title: "GB01-GB03 · Matt Lam · 500 boxes", pick_detail: "S$296.70 · ~S$0.59/box · solid branded rigid box" },
        { need: "*Luxury brand* premium drop — Spot UV logo", pick_title: "GB01-GB03 · Matt Lam + Spot UV · 300 boxes", pick_detail: "S$269.50 · glossy raised logo on the lid" },
        { need: "*Large corporate* hamper box — bigger footprint", pick_title: "GB04-GB05 · Matt Lam · 1,000 boxes", pick_detail: "S$776.70 · larger format for bottles / gift sets" },
        { need: "*Retail* premium packaging run — bulk", pick_title: "GB01-GB03 · Matt Lam + Spot UV · 2,000 boxes", pick_detail: "S$908 · mass-producible premium look" },
        { need: "*Max volume* unit-cost-first", pick_title: "GB04-GB05 · Matt Lam · 3,000 boxes", pick_detail: "S$1,935.90 · ~S$0.65/box at largest size" },
      ],
      title: "Tell us the run,\nwe'll tell you", kicker: "Quick guide", title_em: "the pick.",
      right_note_body: "310gsm Art Card · 2-sided Matt Lamination standard · 4C + 0C single-sided print · rigid construction.",
      right_note_title: "Premium feel, at a volume price.",
    },
    seo_magazine: {
      lede: "Gift boxes do the heavy lifting an unboxing video never forgets — the feel of the card, the finish on the lid, the weight when it lands in someone's hand. Three things drive whether the box is remembered or recycled: the card stock, the lamination, and the highlight finish on the logo.",
      title: "Everything worth knowing,", title_em: "before you print the box.",
      articles: [
        {
          num: "01", title: "Size — pick by what goes inside.",
          body: [
            "Five standard sizes. **GB01-GB03** is the smaller footprint tier — good for smaller corporate gifts (pens, cards, small accessories), wedding return favours, premium sachets. Priced identically at every qty — pick by dimensions rather than cost.",
            "**GB04-GB05** is the larger tier — bottle gift sets, hamper boxes, multi-item corporate gifts. Also priced identically to each other, roughly 2× the smaller tier's price. If the item inside is bigger than a phone, GB04 / GB05 is usually the right bracket. Request a custom size if none of the five fit — we quote separately.",
          ],
          side: { kind: 'list', label: 'Size tier', rows: [
            { text: 'GB01-GB03', time: 'Small footprint · same price' },
            { text: 'GB04-GB05', time: 'Larger footprint · same price' },
          ]},
        },
        {
          num: "02", title: "Card, lamination, and why both matter.",
          body: [
            "**310gsm Art Card** is the substrate — heavy enough to hold its shape as a rigid box (won't flex when the gift is heavy), thick enough for the lamination to lay flat without bubbling. Anything lighter feels flimsy; anything heavier doesn't fold cleanly at the corners.",
            "**2-sided Matt Lamination** is the standard finish — velvet hand-feel on both faces, protects the print against fingerprints and scuffs through the full unboxing journey. Laminated boxes age well; unlaminated boxes start to mark within a day of handling. Matt is chosen over gloss by default because the soft-touch feel reads premium without looking plastic.",
          ],
          side: { kind: 'stat', label: 'Card weight', num: '310gsm', caption: 'rigid, crease-clean Art Card' },
        },
        {
          num: "03", title: "Spot UV — the logo detail people remember.",
          body: [
            "**Spot UV** adds a glossy raised varnish over a selected area of your design — usually the logo or a decorative accent. Against the matt lamination base, the gloss catches the light as the box moves. It reads 'premium' from across a room without having to say so.",
            "Upcharge is moderate (e.g. S$235.50 vs S$163.80 at 100pc GB01-GB03; S$452.10 vs S$308.70 at 100pc GB04-GB05) and the finish adds 1-2 days to production. For luxury drops, brand partnerships, and gifts that need to land, Spot UV is the cheap premium signal.",
          ],
          side: { kind: 'list', label: 'Finish · 100pc / 3,000pc (GB01-03)', rows: [
            { text: 'Matt Lam only',       time: '$163.80 · $1,071.70' },
            { text: 'Matt Lam + Spot UV',  time: '$235.50 · $1,351.00' },
          ]},
        },
        {
          num: "04", title: "Qty — 100 minimum, 3,000 sweet spot for bulk.",
          body: [
            "Offset setup means the **minimum run is 100 boxes**. At 100pc, S$163.80 on GB01-GB03 — roughly S$1.64 per box. Scale up fast: 500pc drops to S$0.59/box, 2,000pc to S$0.35/box, 3,000pc to about S$0.36/box (the curve flattens by 2k).",
            "Above 3,000 boxes we quote separately — the supplier can run larger in a single plate setup if needed. For 5,000+ corporate hampers, tell us the exact target and we'll route the job to the right production line.",
          ],
          side: { kind: 'list', label: 'Qty at a glance', rows: [
            { text: '100pc',   time: 'Minimum · small drop' },
            { text: '500pc',   time: 'SME corporate' },
            { text: '1,000pc', time: 'Mid corporate / retail' },
            { text: '2,000pc', time: 'Brand partnership' },
            { text: '3,000pc', time: 'Max in standard ladder' },
          ]},
        },
      ],
    },
    how_we_print: null, hero_big: 'Gift Box', h1: null, h1em: null, image_url: null, chooser: null,
  });
  await setFaqs(PID, [
    { question: "What sizes do you offer?", answer: "Five standard sizes: GB01, GB02, GB03 (smaller footprint — priced identically), GB04, GB05 (larger footprint — also priced identically). Pick by dimensions for your gift content. Custom sizes available by separate quote." },
    { question: "What paper and finish is used?", answer: "310gsm Art Card substrate (rigid enough to hold its shape as a gift box), with 2-sided Matt Lamination as standard (velvet face, protects the print against handling). Optional 1-side Spot UV for a glossy raised highlight on the logo or accent area." },
    { question: "How much does a custom gift box cost?", answer: "From S$163.80 for 100 small-size (GB01-03) boxes with Matt Lamination only. With Spot UV: S$235.50 at 100pc. Larger sizes (GB04-05) start at S$308.70 for 100 plain. Runs scale to 3,000 boxes. Full price grid in the configurator." },
    { question: "What's the minimum and maximum?", answer: "Minimum 100 boxes (offset setup cost means smaller runs don't make sense). Maximum 3,000 in the standard ladder. For 3,000+ contact us for a custom quote." },
    { question: "How long does production take?", answer: "14 working days from approved digital proof. Offset plate setup, 4C + 0C print, Matt Lamination, die-cut to box shape, optional Spot UV (adds 1-2 days), scoring + flat pack for shipping. Boxes ship flat and assemble in a few seconds." },
    { question: "What file format do you need?", answer: "Print-ready PDF at the unfolded dieline shape, 3mm bleed outside the cut line, CMYK body colour. For Spot UV: a separate vector layer named \"SpotUV\", 100% black, marking the glossy areas. Ask us for the dieline template for your chosen size before designing." },
  ]);
  await addMenuItem(SLUG, 'Gift Box', 2);
  console.log('✓ Gift Box created:', PID);
}

// ────────────────────────────────────────────────────────────────
// 2. BOX WAIST SEAL BAND
// ────────────────────────────────────────────────────────────────

async function waistSeal() {
  const SLUG = 'box-waist-seal-band';
  const PID = await upsertProduct(SLUG, {
    name: 'Box Waist Seal Band',
    icon: '📦',
    tagline: 'Printed belly-bands that lock gift boxes shut — brand the seal',
    description: "Custom-printed paper waist-seal bands at 420mm × 50mm, used to wrap the belly of a gift box and brand the seal. Qty 1,800 to 30,000, from S$136.70. Corporate gifting, retail packaging, event drops.",
    category_id: PACKAGING_CAT,
    is_active: true, is_gift: false, sort_order: 61,
  });
  await wipeRelated(PID);

  const QTYS = [1800, 3000, 6000, 12000, 18000, 24000, 30000];
  const PRICE = { 1800:136.70, 3000:144.30, 6000:188.80, 12000:276.70, 18000:469.80, 24000:567.40, 30000:720.50 };
  const axes = { size: [{ slug:'420x50', label:'420mm × 50mm', note:'Standard waist-seal size' }] };
  const prices = {};
  for (const [q, d] of Object.entries(PRICE)) prices[`420x50:${q}`] = Math.round(d * 100);
  const pricing_table = { axes, axis_order: ['size'], qty_tiers: QTYS, prices };

  await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ pricing_table, pricing_compute: null, lead_time_days: 10, print_mode: 'Offset' }),
  });
  await setSteps(PID, [
    { step_id:'size', label:'Size', type:'swatch', required:true, options:axes.size, show_if:null, step_config:{} },
    { step_id:'qty',  label:'Quantity', type:'qty', required:false, options:[], show_if:null,
      step_config:{ min:1800, step:100, presets:[1800,3000,6000,12000,18000,30000], note:null } },
  ]);
  await setExtras(PID, {
    seo_title: 'Custom Waist Seal Band Printing Singapore | Box Belly Bands',
    seo_desc:  "Custom waist-seal paper band printing in Singapore — 420mm × 50mm belly bands for gift boxes, corporate hampers, retail packaging. From S$136.70 / 1,800pc. Offset printed, bulk volume ready.",
    seo_body:  `Box waist seal band printing Singapore — custom belly bands at 420mm × 50mm, wrap around the waist of a gift box to seal and brand the product. Offset printed, bulk-volume ready. From 1,800 pieces at S$136.70 up to 30,000 at S$720.50. Corporate gifting, retail packaging, Chinese New Year hampers, wedding gift boxes, brand promotional drops.`,
    intro: `A waist-seal paper band is the thin printed strip that wraps the belly of a gift box — it holds the lid shut during transit and carries the product story, the brand logo, the greeting. **420mm × 50mm standard size**, offset-printed, runs from **1,800 pieces** (S$136.70) to **30,000** (S$720.50). 10 working days offset production.`,
    matcher: {
      rows: [
        { need: "*Small corporate* CNY hamper run", pick_title: "1,800 bands · 420×50mm", pick_detail: "S$136.70 · minimum run · S$0.08/band" },
        { need: "*Mid retail* packaging sealer", pick_title: "6,000 bands", pick_detail: "S$188.80 · S$0.031/band" },
        { need: "*Large corporate* gifting programme", pick_title: "12,000 bands", pick_detail: "S$276.70 · S$0.023/band" },
        { need: "*Bulk volume* drop", pick_title: "30,000 bands", pick_detail: "S$720.50 · S$0.024/band · max standard tier" },
      ],
      title: "Tell us the run,\nwe'll tell you", kicker: "Quick guide", title_em: "the pick.",
      right_note_body: "420mm × 50mm standard size · offset printed · paper band for belly-wrap seal.",
      right_note_title: "One size, one job: seal and brand.",
    },
    seo_magazine: {
      lede: "A waist-seal band is the smallest piece of packaging most brands print — and one of the highest-impact per dollar. It holds the box shut, it carries the story, and the customer's first touch is its paper texture.",
      title: "Everything worth knowing,", title_em: "before you wrap the box.",
      articles: [
        { num: "01", title: "What a waist-seal band is for.",
          body: [
            "A **waist-seal band** wraps around the belly of a gift box, holds the lid closed during transit, and gives the product a surface to carry brand copy, a logo, or a greeting. At the unboxing moment, the customer's first action is often breaking or sliding this band off — it's the gateway to the gift inside.",
            "The 420mm × 50mm standard size wraps neatly around most corporate hamper boxes and medium-to-large gift boxes. For smaller gift boxes you'd size down; for very large hampers you'd size up — both via custom quote. The standard size covers 80%+ of real orders.",
          ],
          side: { kind: 'stat', label: 'Standard size', num: '420 × 50', caption: 'millimetres · single SKU' },
        },
        { num: "02", title: "Qty — the per-band cost curve.",
          body: [
            "**Minimum 1,800 bands** — offset plate setup means smaller runs don't make economic sense. At the minimum, S$0.08 per band. Scale up sharply: 6,000 → S$0.031/band, 12,000 → S$0.023, 30,000 → S$0.024 (the curve flattens past 18k).",
            "Most corporate gifting programmes order 6,000-12,000 bands per campaign, which lands in the cheapest per-unit bracket. For one-off events (weddings, brand launches) the 1,800 minimum works fine — cost-per-band is higher but absolute total is low.",
          ],
          side: { kind: 'list', label: 'Qty · total · per-band', rows: [
            { text: '1,800',  time: '$136.70 · $0.08' },
            { text: '6,000',  time: '$188.80 · $0.031' },
            { text: '12,000', time: '$276.70 · $0.023' },
            { text: '30,000', time: '$720.50 · $0.024' },
          ]},
        },
      ],
    },
    how_we_print:null, hero_big:'Waist Seal', h1:null, h1em:null, image_url:null, chooser:null,
  });
  await setFaqs(PID, [
    { question: "What size is the waist-seal band?", answer: "420mm × 50mm standard — fits most corporate hamper boxes and medium-to-large gift boxes. For smaller / larger custom sizes contact us for a separate quote." },
    { question: "How much does it cost?", answer: "From S$136.70 for 1,800 bands (minimum order). Scales to S$720.50 at 30,000. Per-band cost drops from S$0.08 at minimum to ~S$0.024 at 30k+." },
    { question: "What's the minimum order?", answer: "1,800 bands. Offset setup cost means smaller runs aren't economical — we can't run a few hundred in a one-off." },
    { question: "How long does production take?", answer: "10 working days from approved digital proof. Offset plate setup, 4C print, cut to 420mm × 50mm, pack flat for shipping." },
    { question: "What file format do you need?", answer: "Print-ready PDF at 420mm × 50mm with 3mm bleed on all four sides, CMYK for body colour, fonts embedded. Single-sided print only (the inside face of the band is hidden against the box)." },
  ]);
  await addMenuItem(SLUG, 'Waist Seal Band', 3);
  console.log('✓ Box Waist Seal Band created:', PID);
}

// ────────────────────────────────────────────────────────────────
// 3. DRINK CARRIERS (Coffee Cup Sleeve)
// ────────────────────────────────────────────────────────────────

async function drinkCarrier() {
  const SLUG = 'drink-carrier';
  const PID = await upsertProduct(SLUG, {
    name: 'Drink Carriers',
    icon: '☕',
    tagline: 'Heat-isolation coffee cup sleeves — your brand on every takeaway',
    description: "Custom-printed coffee cup sleeves on 310gsm Art Card with Water Base Foam Finishing (heat isolation). 262mm × 50mm, 4C + 0C. Qty 600 to 15,000, from S$182.80. Cafés, F&B brands, event catering, takeaway drops.",
    category_id: PACKAGING_CAT,
    is_active: true, is_gift: false, sort_order: 62,
  });
  await wipeRelated(PID);

  const QTYS = [600, 900, 1200, 1500, 3000, 6000, 9000, 12000, 15000];
  const PRICE = { 600:182.80, 900:255.50, 1200:326.90, 1500:375.10, 3000:596.40, 6000:1122.70, 9000:1652.10, 12000:2198.80, 15000:2742.50 };
  const axes = { size: [{ slug:'262x50', label:'262mm × 50mm', note:'Standard cup sleeve size' }] };
  const prices = {};
  for (const [q, d] of Object.entries(PRICE)) prices[`262x50:${q}`] = Math.round(d * 100);
  const pricing_table = { axes, axis_order:['size'], qty_tiers: QTYS, prices };

  await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ pricing_table, pricing_compute: null, lead_time_days: 10, print_mode: 'Offset' }),
  });
  await setSteps(PID, [
    { step_id:'size', label:'Size', type:'swatch', required:true, options:axes.size, show_if:null, step_config:{} },
    { step_id:'qty',  label:'Quantity', type:'qty', required:false, options:[], show_if:null,
      step_config:{ min:600, step:100, presets:[600,1200,3000,6000,12000,15000], note:null } },
  ]);
  await setExtras(PID, {
    seo_title: 'Custom Coffee Cup Sleeve Printing Singapore | Heat Isolation',
    seo_desc:  "Custom coffee cup sleeve printing in Singapore — 310gsm Art Card with water-base foam heat-isolation finish, 262mm × 50mm. From S$182.80 / 600pc to S$2,742.50 / 15,000pc. Cafés, F&B, event catering.",
    seo_body:  `Drink carrier printing Singapore — custom coffee cup sleeves on 310gsm Art Card with Water Base Foam Finishing (heat isolation for hot takeaway cups). 262mm × 50mm standard size, 4C + 0C single-sided offset print. Runs from 600 pieces at S$182.80 up to 15,000 at S$2,742.50. Café branding, F&B takeaway drops, corporate event catering, brand pop-ups, festival concession stands. 10 working days offset production.`,
    intro: `A coffee cup sleeve is the single most handled piece of packaging in a café's daily operation — every hot takeaway drink gets one. Custom-printed sleeves carry the brand into the customer's commute, the office desk, the hand being photographed on Instagram. We print on **310gsm Art Card with Water Base Foam Finishing** — the foam layer is what gives the sleeve its heat-isolation property, keeping fingers cool against a 90°C takeaway cup. **262mm × 50mm** standard size wraps most standard 12oz / 16oz takeaway cups. **4C + 0C** offset print on the outside face. Runs **600 to 15,000** pieces. **10 working days offset production.**`,
    matcher: {
      rows: [
        { need: "*Single café* starter run — month's supply", pick_title: "600 sleeves · 262×50mm", pick_detail: "S$182.80 · ~S$0.30/sleeve · minimum run" },
        { need: "*Busy café* monthly order", pick_title: "1,500 sleeves", pick_detail: "S$375.10 · S$0.25/sleeve · weeks of stock" },
        { need: "*Multi-outlet* F&B monthly", pick_title: "6,000 sleeves", pick_detail: "S$1,122.70 · S$0.19/sleeve · spread across locations" },
        { need: "*Event / festival* concession drop", pick_title: "9,000 sleeves", pick_detail: "S$1,652.10 · full-weekend concession run" },
        { need: "*Bulk* quarterly reorder", pick_title: "15,000 sleeves", pick_detail: "S$2,742.50 · S$0.18/sleeve · max standard tier" },
      ],
      title: "Tell us the run,\nwe'll tell you", kicker: "Quick guide", title_em: "the pick.",
      right_note_body: "310gsm Art Card · Water Base Foam Finishing for heat isolation · 262 × 50mm standard size.",
      right_note_title: "Cool on the hand, hot in the cup.",
    },
    seo_magazine: {
      lede: "A coffee cup sleeve is the detail most cafés underthink and over-buy. The good ones keep the drink warm, the hand cool, and the brand present — the bad ones burn fingers or tear as the cup lifts. Three decisions shape which kind ships.",
      title: "Everything worth knowing,", title_em: "before you print the sleeve.",
      articles: [
        { num: "01", title: "Why 310gsm Art Card with foam finish.",
          body: [
            "**310gsm Art Card** is the rigid base — thick enough to grip a full cup without flexing, thin enough to slide on and off with one hand. Any lighter and the sleeve collapses under the cup's weight when handed over the counter.",
            "**Water Base Foam Finishing** adds a textured foam layer to the inside face of the sleeve — this is the heat-isolation barrier. A plain printed sleeve against a 90°C takeaway cup transfers heat to the customer's fingers in under a minute; the foam layer cuts the heat transfer sharply so the cup is comfortable to hold the entire walk home.",
          ],
          side: { kind: 'stat', label: 'Heat barrier', num: '90→~40°C', caption: 'foam drops perceived heat' },
        },
        { num: "02", title: "Size and fit — one size, most cups.",
          body: [
            "**262mm × 50mm** is the industry-standard coffee cup sleeve size. It wraps cleanly around most 12oz and 16oz takeaway cups (Dart, Solo, most local suppliers). For boba cups (wider, taller) the size doesn't fit — we can custom-quote a larger sleeve separately.",
            "The sleeve is sized so the customer grips the middle band without covering the brand print. Logo placement matters: keep critical artwork within the middle 180mm of the 262mm width to avoid overlap at the seam when the sleeve is rolled and glued.",
          ],
          side: { kind: 'list', label: 'Fits standard', rows: [
            { text: '12oz takeaway', time: 'Yes · primary fit' },
            { text: '16oz takeaway', time: 'Yes · secondary fit' },
            { text: 'Boba / tall', time: 'No · custom quote' },
            { text: 'Reusable mug', time: 'No · not applicable' },
          ]},
        },
        { num: "03", title: "Qty — 600 minimum, 15,000 sweet spot.",
          body: [
            "**Minimum 600 sleeves** — a week or two of daily use for a single-outlet café. At 600pc, S$182.80 — about S$0.30 per sleeve. Scale sharply: 3,000pc drops to S$0.20, 9,000pc to S$0.18, 15,000pc to S$0.18 (the curve flattens past 6k).",
            "Most café reorders land at 3,000-6,000 per cycle — monthly for a busy single outlet, weekly for a multi-outlet chain. For festival or event catering (one-off peak weekends) the 9,000-15,000 tier covers the weekend's volume in one run.",
          ],
          side: { kind: 'list', label: 'Qty · total · per-sleeve', rows: [
            { text: '600',    time: '$182.80 · $0.30' },
            { text: '1,500',  time: '$375.10 · $0.25' },
            { text: '3,000',  time: '$596.40 · $0.20' },
            { text: '6,000',  time: '$1,122.70 · $0.19' },
            { text: '9,000',  time: '$1,652.10 · $0.18' },
            { text: '15,000', time: '$2,742.50 · $0.18' },
          ]},
        },
      ],
    },
    how_we_print:null, hero_big:'Cup Sleeve', h1:null, h1em:null, image_url:null, chooser:null,
  });
  await setFaqs(PID, [
    { question: "What size is the cup sleeve?", answer: "262mm × 50mm standard — industry size that fits most 12oz and 16oz takeaway cups. For boba cups or custom-sized drinkware contact us for a separate quote." },
    { question: "Why the foam finishing?", answer: "Water Base Foam Finishing creates a textured barrier layer between the sleeve and the hot cup — without it, a 90°C takeaway drink transfers heat to the customer's fingers within a minute. The foam keeps the grip comfortable the entire walk." },
    { question: "How much does it cost?", answer: "From S$182.80 for 600 sleeves (minimum order). 1,500pc is S$375.10, 3,000pc is S$596.40, 6,000pc is S$1,122.70, 15,000pc is S$2,742.50. Per-sleeve cost drops from S$0.30 at minimum to ~S$0.18 at 15k+." },
    { question: "What's the minimum order?", answer: "600 sleeves. Below that the offset plate setup cost dominates and the job isn't economical." },
    { question: "How long does production take?", answer: "10 working days from approved digital proof. Offset plate setup, 4C + 0C print on 310gsm Art Card, foam finish application on the inside face, cut to 262mm × 50mm, score + perforate for clean rolling, pack flat for shipping." },
    { question: "What file format do you need?", answer: "Print-ready PDF at 262mm × 50mm with 3mm bleed on all four sides, CMYK for body colour. Logo / key artwork should sit within the middle 180mm to avoid being cut off at the seam when the sleeve is rolled. Ask for our dieline template before designing — it marks the overlap zone." },
  ]);
  await addMenuItem(SLUG, 'Drink Carrier', 4);
  console.log('✓ Drink Carrier created:', PID);
}

await giftBox();
await waistSeal();
await drinkCarrier();
console.log('\nAll three Packaging products created.');
