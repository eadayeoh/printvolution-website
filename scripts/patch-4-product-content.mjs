// Content rewrite for four products at once — NCR Form, Rubber Stamp,
// Stickers, UV DTF Sticker. Each gets intro / seo_title / seo_desc /
// seo_body (2-line keyword-intense) / matcher / seo_magazine rewritten
// around the current configurator, plus a fresh FAQ set.
//
// H1 + H1em left untouched per the skip-H1 rewrite rule. Tagline and
// description are tightened only where they referenced options that no
// longer exist.

import fs from 'node:fs';

const env = fs.readFileSync(
  '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
  'utf8',
);
const kv = Object.fromEntries(
  env
    .trim()
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);
const URL = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

async function patchProduct(id, productUpdate, extras, faqs) {
  const pRes = await fetch(`${URL}/rest/v1/products?id=eq.${id}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(productUpdate),
  });
  if (!pRes.ok) throw new Error(`PATCH product ${id}: ${pRes.status} ${await pRes.text()}`);

  const exRes = await fetch(`${URL}/rest/v1/product_extras?product_id=eq.${id}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(extras),
  });
  if (!exRes.ok) throw new Error(`PATCH extras ${id}: ${exRes.status} ${await exRes.text()}`);

  await fetch(`${URL}/rest/v1/product_faqs?product_id=eq.${id}`, { method: 'DELETE', headers: H });
  const insRes = await fetch(`${URL}/rest/v1/product_faqs`, {
    method: 'POST', headers: H,
    body: JSON.stringify(faqs.map((f, i) => ({ product_id: id, question: f.question, answer: f.answer, display_order: i }))),
  });
  if (!insRes.ok) throw new Error(`INSERT faqs ${id}: ${insRes.status} ${await insRes.text()}`);
}

// ────────────────────────────────────────────────────────────────
// 1. NCR FORM
// ────────────────────────────────────────────────────────────────

const ncr = {
  id: 'cf2b00c8-6cfc-4749-9988-68d36c0f4332',
  productUpdate: {
    tagline: 'Instant on-site duplicate paperwork — no power needed',
    description: "Invoices, delivery orders, job sheets, receipts — NCR books create instant carbonless duplicates on-site, no printer, no battery. The operational essential for logistics, field service, F&B, and any business where a paper trail needs to happen the moment the transaction does.",
  },
  extras: {
    seo_title: 'NCR Form Printing Singapore | Carbonless Duplicate Books',
    seo_desc: "Custom NCR book printing in Singapore — 4×8 / 8×9 / A5 / A4 sizes, 2 to 5 ply, 1 or 2 standard colour print (PT1–PT7), numbering included. 10 to 500 books per run.",
    seo_body: `NCR form printing Singapore — carbonless duplicate books for invoices, delivery orders, job sheets, receipts. 4×8 (107×196mm) / 8×9 (196×222mm) / A5 (146×222mm) / A4 (222×298mm). 2 / 3 / 4 / 5 ply. 1 or 2 standard PT colour inks (Royal Blue, Cyan, Bronze Red, Magenta, Orange, Green, Black) with numbering included. 10 to 500 books per run, 7 working days min offset. Logistics, field service, F&B, workshops, tradespeople.`,
    intro: `An NCR book solves the one thing digital still can't: a signed duplicate you hand to the customer on the spot, no power, no printer, no app crashes. We print in four sizes (4×8, 8×9, A5, A4), 2 to 5 ply sets, with 1 or 2 standard ink colours from the PT range (Royal Blue, Cyan, Bronze Red, Magenta, Orange 021, Green, Black). Every book ships with sequential numbering included. Single-sided print, carbonless paper (no messy carbon sheets), 7 working days min offset. Minimum 10 books per run.`,
    matcher: {
      rows: [
        {
          need: "Courier company — *delivery orders* every driver carries",
          pick_title: "A5 · 3-ply · 1 colour Black · 50 books",
          pick_detail: "S$310.40 · white/yellow/pink ply · one book per driver per week",
        },
        {
          need: "F&B — *order chits*, 2 copies (kitchen + customer)",
          pick_title: "4×8 · 2-ply · 1 colour · 20 books",
          pick_detail: "S$115 · compact 107×196mm · fits a shirt pocket",
        },
        {
          need: "Workshop / tradespeople — *job sheets* with 3 copies",
          pick_title: "A4 · 3-ply · 2 colour · 30 books",
          pick_detail: "S$512.10 · larger format for detailed job scopes · two ink colours for emphasis",
        },
        {
          need: "Small business — *cash-sale invoices*, annual top-up",
          pick_title: "A5 · 2-ply · 1 colour · 100 books",
          pick_detail: "S$383.10 · 100 books × 50 sets = 5,000 invoices · 1 year+ supply",
        },
        {
          need: "Property / logistics — *premium DO books* with 2-colour branding",
          pick_title: "A4 · 4-ply · 2 colour · 200 books",
          pick_detail: "S$2,657 · 4 copies per set (office / warehouse / driver / customer) · high-volume",
        },
      ],
      title: "Tell us the job,\nwe'll tell you",
      kicker: "Quick guide",
      title_em: "the pick.",
      right_note_body: "Carbonless paper · no messy carbon sheet to lose · clean duplicates every set.",
      right_note_title: "Numbering on every book.",
    },
    seo_magazine: {
      lede: "An NCR book does one thing screens can't — hand over a signed duplicate on the spot, no battery, no signal. Four decisions shape the book that actually lives in a driver's bag or a counter drawer: size, ply count, print colour, and run size.",
      title: "Everything worth knowing,",
      title_em: "before you print the book.",
      issue_label: "Issue №01 · NCR Books",
      articles: [
        {
          num: "01",
          title: "Size — 4×8, 8×9, A5, or A4, pick by where it lives.",
          body: [
            "**4 × 8 inch (107 × 196mm)** is the chit size — F&B order pads, receipt books, anything that goes in a shirt pocket or an apron. Too small for detailed line items, perfect for short transactional records.",
            "**A5 (146 × 222mm)** is the workhorse. Fits a clipboard, fits in a glove box, holds a full invoice layout with company details + line items + terms. The default for delivery orders, cash-sale invoices, service records. **A4 (222 × 298mm)** is for job sheets, inspection reports, and anything with detailed specs — landscape-friendly for diagrams. **8 × 9 (196 × 222mm)** sits between, roughly letter-sized.",
          ],
          side: {
            kind: "list",
            label: "Size by use",
            rows: [
              { text: "4 × 8 inch", time: "F&B chits, receipts" },
              { text: "A5", time: "Delivery orders, invoices" },
              { text: "8 × 9 inch", time: "Letter-format DO" },
              { text: "A4", time: "Job sheets, inspections" },
            ],
          },
        },
        {
          num: "02",
          title: "Ply count — how many copies per set.",
          body: [
            "**2 ply** (white + yellow) is the most common — one for the customer, one for your records. Cheapest per book, fastest production. **3 ply** (white + yellow + pink) covers customer + office + driver / warehouse — standard for courier DOs, workshop job sheets.",
            "**4 ply** adds a fourth colour for a finance / accounts copy, useful on higher-value invoices where finance reconciles separately. **5 ply** is rare — typically for regulated trades (installation permits, specific contracting work) that need an additional filing copy. Per-book cost roughly doubles from 2-ply to 5-ply, so pick the minimum that actually gets filed.",
          ],
          side: {
            kind: "list",
            label: "Ply by workflow",
            rows: [
              { text: "2 ply", time: "Customer, records" },
              { text: "3 ply", time: "Adds driver / warehouse" },
              { text: "4 ply", time: "Adds finance / accounts" },
              { text: "5 ply", time: "Adds regulatory filing" },
            ],
          },
        },
        {
          num: "03",
          title: "1 colour or 2 colour — the branding decision.",
          body: [
            "**1 standard colour** is the baseline — one ink for company name, logo, and the form template. Black (PT7) is the most common; Royal Blue (PT1) and Bronze Red (PT3) are popular for brand-aligned books. Clean, legible, budget-friendly.",
            "**2 standard colour** adds a second ink — typically for a highlighted logo in brand red/blue against black body text, or to separate headers from line fields. Adds roughly 50-80% to the unit cost depending on size and ply, but looks properly branded next to a contractor's one-colour generic book.",
          ],
          side: {
            kind: "pills",
            label: "PT standard colours",
            items: [
              { text: "PT1 · Royal Blue" },
              { text: "PT3 · Bronze Red", pop: true },
              { text: "PT4 · Magenta" },
              { text: "PT5 · Orange 021" },
              { text: "PT6 · Green" },
              { text: "PT7 · Black", pop: true },
            ],
          },
        },
        {
          num: "04",
          title: "Run size — 10 books is the minimum, 500 the sweet spot.",
          body: [
            "Offset setup for carbonless books has a fixed cost that dominates at low quantities — which is why 10 books (minimum) doesn't cost 10× the unit price of 100 books. **10 books × 50 sets = 500 numbered sets**, usually enough for a few weeks of light use or a small trial.",
            "By **100 books** (5,000 numbered sets), the per-book cost has dropped roughly 2–3× vs a 10-book run. **500 books** locks in the best per-book rate and typically covers a year of operation for a small business, multiple years for a low-volume shop. Order in one run rather than repeatedly — each re-order pays the setup cost again. Numbering starts from 0001 by default; tell us if you need to continue a sequence from a previous book.",
          ],
          side: {
            kind: "list",
            label: "Books by use",
            rows: [
              { text: "10 books", time: "500 sets · trial run" },
              { text: "50 books", time: "2,500 sets · 3 months light" },
              { text: "100 books", time: "5,000 sets · year typical" },
              { text: "500 books", time: "25,000 sets · multi-year supply" },
            ],
          },
        },
      ],
    },
  },
  faqs: [
    { question: "What sizes do you offer?", answer: "Four sizes: 4×8 inch (107×196mm), 8×9 inch (196×222mm), A5 (146×222mm), and A4 (222×298mm). Pick by what fits your use — 4×8 for chit pads, A5 for delivery orders and invoices, A4 for detailed job sheets." },
    { question: "How many copies per set (ply)?", answer: "2 ply through 5 ply. 2 ply = white + yellow (customer + records). 3 ply adds pink (+ driver / warehouse). 4 ply adds a fourth colour for finance. 5 ply for regulated trades needing an extra filing copy." },
    { question: "Can I pick my own ink colours?", answer: "Only the 7 standard PT colours listed: PT1 Royal Blue, PT2 Cyan, PT3 Bronze Red, PT4 Magenta, PT5 Orange 021, PT6 Green, PT7 Black. For 1-colour books pick one; for 2-colour pick two. Custom colours (Pantone / brand-specific spot inks) are not available in the configurator — they require a separate custom quote. Contact us before placing the order if you need one." },
    { question: "Is the numbering included?", answer: "Yes — every book ships with sequential numbering included in the price. Numbering starts from 0001 by default. If you need us to continue from a specific number (e.g. to follow an existing book sequence), tell us at order time." },
    { question: "How many sets per book?", answer: "Each book contains 50 numbered sets. A \"set\" is one complete multi-ply unit (e.g. one 3-ply set = one white + one yellow + one pink). So 100 books × 50 sets = 5,000 total usable sets." },
    { question: "How much does an NCR book cost in Singapore?", answer: "Starts from S$80.40 for 10 books of 4×8 2-ply 1-colour. Typical A5 3-ply 1-colour at 50 books runs S$310.40. Large A4 4-ply 2-colour at 200 books reaches S$2,657. Use the configurator for an exact quote on your combo." },
    { question: "What file format do you need?", answer: "Print-ready PDF at the exact book size (not paper size — include any margin you want in the PDF itself). Set spot colours to the PT numbers in your design. Leave space at the bottom-right corner for the sequential numbering (we'll position it clear of your content). Fonts embedded, CMYK or spot, 3mm bleed." },
    { question: "How long does production take?", answer: "Minimum 7 working days from approved digital proof. Carbonless stock cutting, 1 or 2 colour offset print, numbering, binding into books — all in-house, no middleman delays." },
  ],
};

// ────────────────────────────────────────────────────────────────
// 2. RUBBER STAMP
// ────────────────────────────────────────────────────────────────

const stamp = {
  id: '0b27c40f-79de-410d-afe5-06c74c92200d',
  productUpdate: {
    tagline: 'The detail that says your business is built properly',
    description: "A stamped logo on kraft packaging, a stamped address block on envelopes, a stamped PAID on invoices. Self-inking stamps in 20 catalogue sizes — small rectangles, round, and large — with Black, Navy, or Red ink, 1–2 working days turnaround.",
  },
  extras: {
    seo_title: 'Rubber Stamp Making Singapore | Self-Inking, Round & Rectangular',
    seo_desc: "Custom rubber stamps in Singapore — 20 catalogue sizes from 9×66mm to 85×125mm, self-inking with Black, Navy, or Red ink. $24–$80 per stamp. Next working day standard, +1 day for large sizes.",
    seo_body: `Rubber stamp Singapore — self-inking custom stamps in 20 catalogue sizes. Small rectangles (9×66mm to 28×51mm, $24–$32), medium rectangles (39×98mm to 49×98mm, $36–$48), round stamps (Ø22mm / Ø35mm, $24 / $28), large rectangles (62×80mm to 85×125mm, $45–$80). Three ink colours: Black, Navy, Red. Next working day for standard sizes, +1 day for large. Logo stamps, signature blocks, PAID / APPROVED / URGENT marks, return address blocks, QC stamps.`,
    intro: `A custom rubber stamp is a small thing that reads as a considered detail — the logo on a kraft mailer, the consistent return address on every envelope, the PAID mark that closes out an invoice in one motion. We self-ink every stamp in Black, Navy, or Red from a 20-SKU catalogue that covers small rectangles, round stamps, and large board-ready marks. Next working day on standard sizes; the largest ones add an extra day for mould curing. Pick by shape first, then by exact dimensions. $24 to $80 per stamp.`,
    matcher: {
      rows: [
        { need: "*Return address* block on envelopes", pick_title: "DF 1370 — 9 × 66mm · Black", pick_detail: "$24 · skinny rectangle · one-line address fits perfectly" },
        { need: "*Logo stamp* for kraft packaging", pick_title: "DF 35 — Ø35mm round · Black or Navy", pick_detail: "$28 · circular works for circular logos · sized for a shipping label" },
        { need: "*Signature + date* block for documents", pick_title: "DF 5367 — 49 × 63mm · Navy", pick_detail: "$38 · enough room for signature line, date line, printed name" },
        { need: "*PAID / APPROVED* workflow stamp", pick_title: "DF 2855 — 24 × 51mm · Red", pick_detail: "$28 · red ink signals status at a glance · compact for invoices" },
        { need: "*Large branded* stamp for retail packaging", pick_title: "DF 67103 — 62 × 98mm · Black", pick_detail: "$56 · +1 working day · enough surface for logo + tagline + URL" },
      ],
      title: "Tell us the job,\nwe'll tell you",
      kicker: "Quick guide",
      title_em: "the pick.",
      right_note_body: "Self-inking mechanism · 8,000+ impressions before refill · replacement ink pads available.",
      right_note_title: "One stamp, one thousand uses.",
    },
    seo_magazine: {
      lede: "A rubber stamp is the cheapest branded object you'll buy and one of the most frequently used. Pick the right shape, the right size for the surface, and the right ink for the surface it stamps, and the object earns its keep thousands of times over.",
      title: "Everything worth knowing,",
      title_em: "before you pick the SKU.",
      issue_label: "Issue №01 · Rubber Stamps",
      articles: [
        {
          num: "01",
          title: "Shape first — small, medium, round, or large.",
          body: [
            "**Small rectangles (9–28mm height)** are the workhorses — return addresses, single-line marks (PAID, APPROVED, URGENT), contact details on cards. Cheapest tier ($24–$32) and all ship next working day.",
            "**Medium rectangles (39–49mm height)** give you room for a logo + two or three lines of text — signature blocks, full address + contact plus logo, QC sign-offs. **Round stamps** (Ø22mm, Ø35mm) work for circular logos, monograms, seals. **Large rectangles (62mm+ height)** are retail-signage territory — full branded stamps with logo, tagline, URL on kraft packaging. All large sizes add one working day for the bigger mould.",
          ],
          side: {
            kind: "list",
            label: "Shape by use",
            rows: [
              { text: "Small rect", time: "Address, PAID marks" },
              { text: "Medium rect", time: "Signature + logo" },
              { text: "Round", time: "Circular logos, seals" },
              { text: "Large rect", time: "Full retail branding" },
            ],
          },
        },
        {
          num: "02",
          title: "Ink colour — Black, Navy, or Red, each does a different job.",
          body: [
            "**Black** is the default and it's right for almost everything — logos on kraft, address blocks on envelopes, signature stamps on contracts. Neutral, always legible, doesn't compete with anything else on the page.",
            "**Navy** is black's more formal cousin — the ink used on corporate signature blocks, legal signoffs, and anywhere the stamp needs to feel measured. Visibly different from black on white paper; reads as *professional* rather than *workaday*. **Red** signals attention — PAID, URGENT, REJECTED, DEADLINE markers that need to jump off a page of black text. Don't use red for logos or general branding; save it for status stamps where the colour itself carries meaning.",
          ],
          side: {
            kind: "pills",
            label: "When to use which",
            items: [
              { text: "Black · default", pop: true },
              { text: "Navy · corporate" },
              { text: "Red · status / urgency", pop: true },
            ],
          },
        },
        {
          num: "03",
          title: "Self-inking — the mechanism is the product.",
          body: [
            "Every stamp in the catalogue is **self-inking** — there's an ink reservoir built into the housing that auto-feeds the rubber plate with every press. Press once, stamp ready for the next impression, no separate pad to chase.",
            "A fresh stamp delivers roughly **8,000 clean impressions** before the ink starts thinning. Replacement ink pads are available for every model — typical refill extends the life indefinitely. The rubber plate itself lasts through multiple refills; the housing typically outlives the ink by years.",
          ],
          side: {
            kind: "stat",
            num: "~8,000",
            label: "Impressions per refill",
            caption: "on a fresh self-inking stamp",
          },
        },
        {
          num: "04",
          title: "Artwork — keep it thick, keep it legible.",
          body: [
            "Rubber stamps lose about **0.2–0.5mm of line weight** on transfer to paper — the rubber compresses, the ink spreads slightly, and anything drawn at hairline thickness on screen disappears at 11mm height in real use. Design with minimum **0.5pt stroke weight**, bigger on the large SKUs.",
            "Skip fine detail at small sizes — a complex illustration works at 62mm but turns to a blob at 18mm. For small stamps, simplify: bold wordmarks, chunky icons, one-colour logos. Send artwork as vector PDF (Illustrator or exported from Figma / Affinity). We'll review the file at stamp size and flag anything that won't print crisp before cutting the plate.",
          ],
          side: {
            kind: "list",
            label: "Artwork prep",
            rows: [
              { text: "Format", time: "Vector PDF" },
              { text: "Min stroke", time: "0.5pt (larger on bigger stamps)" },
              { text: "Colour", time: "1 colour · your ink choice" },
              { text: "Bleed", time: "Not needed · stamp trims to plate" },
            ],
          },
        },
      ],
    },
  },
  faqs: [
    { question: "What sizes do you offer?", answer: "20 catalogue sizes across four shape categories: small rectangles (9×66mm up to 28×51mm, $24–$32), medium rectangles (39×98mm up to 49×98mm, $36–$48), round stamps (Ø22mm $24 and Ø35mm $28), and large rectangles (62×80mm up to 85×125mm, $45–$80). Pick the shape first in the configurator — the SKU list filters automatically." },
    { question: "What ink colours do you offer?", answer: "Three standard inks: Black (the default — neutral, legible), Navy (slightly more formal, good for corporate signoffs), and Red (for PAID / APPROVED / URGENT status stamps). Ink colour doesn't change the price. Custom Pantone inks available as a bespoke quote." },
    { question: "How long does production take?", answer: "1 working day for standard sizes (small rectangles, medium rectangles, round, and 39×98/49×98). The six largest rectangular sizes (62×80mm, 62×98mm, 73×98mm, 85×125mm, plus the 39×98 and 49×98 variants) need 2 working days because the rubber mould takes an extra day to cure properly." },
    { question: "Can I refill the ink?", answer: "Yes — every self-inking stamp uses a replaceable ink pad. A fresh stamp delivers roughly 8,000 clean impressions before needing a refill. Replacement pads are available for every model in the catalogue." },
    { question: "What file format should I send?", answer: "Vector PDF — Illustrator, Affinity, or Figma-exported works. Design at actual stamp size. Minimum stroke weight 0.5pt (more on larger stamps). One colour — your chosen ink. We'll review at stamp size before cutting the plate and flag anything that won't print crisp." },
    { question: "Can I get a stamp with my logo?", answer: "Yes — a logo stamp is the most common use. Send us the vector logo and tell us which size suits your intended use (kraft packaging → medium or large; envelopes → small rectangle; circular logos → round). We'll scale-check before plate-cutting." },
    { question: "Are the stamps waterproof?", answer: "The stamped ink is water-resistant on paper once dry (a few seconds). Not designed for permanent marking on non-porous surfaces — use a dedicated industrial ink stamp for that. Perfect for paper, card, kraft bags, and most packaging." },
    { question: "How is a rubber stamp priced?", answer: "Flat per-stamp price by SKU: $24–$32 for small rectangles, $36–$48 for medium, $24/$28 for the two round sizes, $45–$80 for large. Multi-stamp orders multiply the per-stamp price by quantity. Ink colour and single-customer artwork are included — no extra charges." },
  ],
};

// ────────────────────────────────────────────────────────────────
// 3. STICKERS
// ────────────────────────────────────────────────────────────────

const stickers = {
  id: 'adb6bb6d-63d0-41c2-8908-64e64541ef04',
  productUpdate: {
    tagline: 'Stick your brand anywhere — it survives everything',
    description: "Die-cut stickers on a 320 × 450mm sheet, one design per sheet, cut to any shape. Nine material finishes — Waterproof Gloss or Matt, Transparent, five Metallic options, or Blockout. $15 down to $10 per sheet by volume.",
  },
  extras: {
    seo_title: 'Sticker Printing Singapore | Die-Cut, Waterproof, Metallic',
    seo_desc: "Custom die-cut sticker printing in Singapore. 320 × 450mm sheet, 9 materials (Waterproof Gloss / Matt, Transparent, Metallic Rainbow / Sands / Stripes / Gold, Blockout). $15–$10 per sheet by volume. One design per sheet.",
    seo_body: `Sticker printing Singapore — 320 × 450mm die-cut sheets, one design per sheet, cut to any shape. Nine materials (Waterproof Gloss / Waterproof Matt / Transparent / Metallic Rainbow Sands / Metallic Rainbow / Metallic Sands / Metallic Stripes / Blockout / Metallic Gold), all priced the same. $15 per sheet at qty 1, dropping to $10 per sheet at 50 sheets. Product packaging, laptop decals, shop window graphics, helmet stickers, water bottle labels, event lanyards.`,
    intro: `Stickers travel. They end up on surfaces you never planned — laptops, water bottles, helmets, shop windows, packaging, lanyards — and they stay there, in circulation, far beyond the campaign that launched them. We die-cut any shape from a 320 × 450mm sheet in nine material finishes: Waterproof Gloss, Waterproof Matt, Transparent, five Metallic effects, and Blockout. One design per sheet (enter your sticker size and the live calculator tells you how many you'll get per sheet). All materials price the same — $15 per sheet down to $10 per sheet at 50 sheets. 3 working days production.`,
    matcher: {
      rows: [
        { need: "*Brand stickers* for product packaging — 100 pieces", pick_title: "Waterproof Gloss · 50×50mm · 10 sheets", pick_detail: "S$140 total · 20 stickers per sheet · 200 total stickers at $0.70/piece" },
        { need: "*Event lanyard logos* — 400 pieces in one run", pick_title: "Waterproof Matt · 80×40mm · 20 sheets", pick_detail: "S$260 total · ~20 stickers per sheet · 400+ total at $0.65/piece" },
        { need: "*Premium label* — small qty, looks expensive", pick_title: "Metallic Gold · 40×40mm · 1 sheet", pick_detail: "S$15 · roughly 40 stickers per sheet · shiny gold finish" },
        { need: "*Water bottle* decals — durable, outdoor-facing", pick_title: "Waterproof Gloss · 70×70mm · 20 sheets", pick_detail: "S$260 total · ~12 per sheet · 240 total · UV + water-rated" },
        { need: "*Large quantity* merch stickers — budget-first", pick_title: "Waterproof Matt · 50×80mm · 50 sheets", pick_detail: "S$500 total · ~16 per sheet · 800 total at $0.625/piece" },
      ],
      title: "Tell us the job,\nwe'll tell you",
      kicker: "Quick guide",
      title_em: "the pick.",
      right_note_body: "320 × 450mm sheets · 10mm gutter between stickers for die-cut bleed · one design per sheet.",
      right_note_title: "One design, one sheet, any shape.",
    },
    seo_magazine: {
      lede: "A sticker is the cheapest piece of advertising you'll ever put into the world — and one of the longest-lived. Pick the right material for the surface it sticks to and the weather it'll face, size it to fit the real-world object, and order enough that the per-sticker cost makes it easy to give away.",
      title: "Everything worth knowing,",
      title_em: "before you order a sheet.",
      issue_label: "Issue №01 · Stickers",
      articles: [
        {
          num: "01",
          title: "Material — pick by where it lives.",
          body: [
            "**Waterproof Gloss** is the default for outdoor stickers — UV-resistant vinyl with a glossy finish that pops colour. Laptops, water bottles, helmets, bike frames, anything that sees weather. **Waterproof Matt** is the same durability with a softer finish — looks more considered, less mass-market, the pick for premium product branding.",
            "**Transparent** lets the surface show through — the trick for shop window graphics and packaging where the label needs to feel integrated. The five **Metallic** finishes (Rainbow, Rainbow Sands, Sands, Stripes, Gold) add reflective/iridescent effects — use for premium product labels, awards, brand moments. **Blockout** is opaque white-backed — the pick when you're sticking over another label or a dark surface and need full colour accuracy without the substrate bleeding through.",
          ],
          side: {
            kind: "list",
            label: "Material by use",
            rows: [
              { text: "Waterproof Gloss", time: "Outdoor, laptops, water bottles" },
              { text: "Waterproof Matt", time: "Premium product branding" },
              { text: "Transparent", time: "Window graphics, integrated labels" },
              { text: "Metallic (any)", time: "Premium, awards, limited editions" },
              { text: "Blockout", time: "Over dark surfaces / other labels" },
            ],
          },
        },
        {
          num: "02",
          title: "Sheet economics — how many stickers you actually get.",
          body: [
            "One sheet is **320 × 450mm**, one design per sheet. The live calculator on the configurator computes how many stickers fit at your chosen size — a **100 × 100mm sticker** gives you 8 per sheet (10mm gutter for die-cut bleed), a **50 × 50mm** gives you 40, a **25 × 25mm** gives you 130+.",
            "The economics work backwards from the per-piece cost you want. If you want 1,000 stickers at around $0.50 each, that's $500 total — 50 sheets at $10/sheet. At 50×80mm that's roughly 16 per sheet = 800 stickers at $500 = $0.625 each. Size and qty choices are linked through the sheet calc; play with the configurator until the per-piece lands where you need it.",
          ],
          side: {
            kind: "stat",
            num: "320 × 450",
            label: "Sheet size (mm)",
            caption: "one design per sheet, 10mm die-cut gutter",
          },
        },
        {
          num: "03",
          title: "Volume pricing — $15 to $10 per sheet.",
          body: [
            "Sheet cost drops as you order more — **$15/sheet** at qty 1, **$14** at 10, **$13** at 20, **$12** at 30, **$11** at 40, **$10** at 50+ sheets. Below 10 sheets you're paying the highest per-piece rate; the sweet spot for most small campaigns is 20 sheets ($260 for roughly 200–400 stickers depending on size).",
            "For runs over 50 sheets the price becomes a custom quote — higher volumes move into roll-sticker production or gang-run economics which price differently. If you're planning a large merch run, tell us the target qty and we'll route the job to the right process.",
          ],
          side: {
            kind: "list",
            label: "Per-sheet tier",
            rows: [
              { text: "1 sheet", time: "$15/sheet" },
              { text: "10 sheets", time: "$14/sheet" },
              { text: "20 sheets", time: "$13/sheet" },
              { text: "30 sheets", time: "$12/sheet" },
              { text: "40 sheets", time: "$11/sheet" },
              { text: "50 sheets", time: "$10/sheet" },
            ],
          },
        },
        {
          num: "04",
          title: "Artwork — cut-path and colour build.",
          body: [
            "Send a vector file (PDF, AI, SVG) with your sticker artwork + a separate **cut path** as a spot-colour stroke (we use the name \"CutContour\" by convention). The cut path is what drives the die-cutter — it can be any shape, not just a rectangle. Round, rounded rectangle, bespoke outline of your logo, even cut-outs inside the shape.",
            "For **Metallic** materials, remember the substrate is already reflective — avoid large solid-white fills since white ink sits on top of the metallic effect and looks cloudy at scale. Design with the metallic as a highlight colour in the artwork (logo, accent elements) rather than an overall background. **CMYK for body colour, 3mm bleed** on the outside of the cut path so the material extends beyond the cut line.",
          ],
          side: {
            kind: "list",
            label: "File prep",
            rows: [
              { text: "Format", time: "Vector · PDF / AI / SVG" },
              { text: "Cut path", time: "Spot colour stroke · \"CutContour\"" },
              { text: "Colour", time: "CMYK for body · 3mm bleed" },
              { text: "Metallic prep", time: "Let substrate show through; avoid solid white fills" },
            ],
          },
        },
      ],
    },
  },
  faqs: [
    { question: "What materials do you offer?", answer: "Nine finishes, all priced the same: Waterproof Gloss, Waterproof Matt, Transparent, Metallic Rainbow Sands, Metallic Rainbow, Metallic Sands, Metallic Stripes, Blockout, and Metallic Gold. Pick by where the sticker lives (outdoor → waterproof gloss/matt; windows → transparent; premium → metallic; over dark surfaces → blockout)." },
    { question: "How many stickers do I get per sheet?", answer: "Depends on your sticker size. The live calculator on the product page computes it when you enter width × height in mm — sheet is 320 × 450mm with a 10mm gutter between stickers for die-cut bleed. 100×100mm = 8 per sheet, 50×50mm = 40 per sheet, 25×25mm = 130+ per sheet." },
    { question: "Can I have different designs on one sheet?", answer: "No — one design per sheet. If you need multiple designs, order multiple sheets (different design on each). For gang-printing mixed designs on one sheet, use our UV DTF sticker product instead." },
    { question: "How much does sticker printing cost?", answer: "Per-sheet price drops with volume: $15 at 1 sheet, $14 at 10 sheets, $13 at 20, $12 at 30, $11 at 40, $10 at 50 sheets. Same price on all nine materials. For 50+ sheets, contact us for a custom quote." },
    { question: "What shape can the stickers be?", answer: "Any shape you design the cut path for — round, rounded rectangle, custom outline of your logo, odd shapes, even cut-outs inside the sticker. Send your artwork with a spot-colour cut path and we die-cut to that line." },
    { question: "Are the stickers waterproof?", answer: "The Waterproof Gloss, Waterproof Matt, and Metallic variants are all UV-resistant and water-rated — suitable for outdoor use on laptops, bottles, helmets, bikes. Transparent and Blockout variants are water-resistant but we recommend waterproof finishes for anything facing regular weather." },
    { question: "What file format do you need?", answer: "Vector PDF (preferred), AI, or SVG with your artwork plus a separate cut path — a spot-colour stroke named \"CutContour\" by convention. CMYK for body colours, 3mm bleed on the outside of the cut path. For metallic materials, design with the substrate showing through (avoid large solid white fills)." },
    { question: "How long does production take?", answer: "3 working days from approved proof — includes printing, die-cutting, and quality check. Larger runs don't add days; the cutter handles 50 sheets as fast as 10." },
  ],
};

// ────────────────────────────────────────────────────────────────
// 4. UV DTF STICKER
// ────────────────────────────────────────────────────────────────

const uvdtf = {
  id: 'd29c3b77-f9ef-4974-af50-1ebe83e9c50c',
  productUpdate: {
    tagline: 'Printed-on look on any hard surface — peel and press',
    description: "UV DTF stickers bond like a printed surface onto glass, metal, acrylic, wood, ceramic. Gang as many designs as you want onto one A4 ($25) or A3 ($50) sheet. No heat, no tools — peel, press, release.",
  },
  extras: {
    seo_title: 'UV DTF Sticker Printing Singapore | A4 & A3 Gang Sheets',
    seo_desc: "UV DTF sticker printing in Singapore — peel-and-press transfers onto glass, metal, wood, acrylic, ceramic. A4 sheet $25, A3 sheet $50. Fit as many designs as you want per sheet.",
    seo_body: `UV DTF sticker printing Singapore — printed-on look on hard surfaces (glass bottles, metal tumblers, acrylic signage, wooden boards, ceramic mugs, powder-coated products). A4 sheet $25, A3 sheet $50. Gang-sheet ready — fit unlimited designs per sheet. No heat press, no tools — peel from transfer paper, press onto the surface, release. 3 working days. Glassware branding, premium packaging stickers, product labels, bar branding, retail signage.`,
    intro: `A UV DTF sticker does one thing regular vinyl can't — it applies to almost any hard surface and looks like the design was printed directly onto the object. Glass bottles, metal tumblers, acrylic signage, ceramic mugs, wooden boards, powder-coated equipment — peel from the transfer paper, press onto the surface, release. No heat, no tools, no surface prep beyond a clean wipe. Two sheet sizes: A4 at $25 and A3 at $50. Unlike regular die-cut stickers, you can fit as many designs as you want onto a single sheet — just gang them up in your artwork. 3 working days production.`,
    matcher: {
      rows: [
        { need: "*Glass bottle* labels — 50 bottles for an event", pick_title: "A3 sheet · 50 sticker gang-up", pick_detail: "S$50 · one sheet, 50 designs (varied or identical) · $1/bottle" },
        { need: "*Metal tumbler* branding for corporate gifts", pick_title: "A4 sheet · 20 tumblers", pick_detail: "S$25 · one A4, 20 designs · $1.25/tumbler · peel + press on rim or body" },
        { need: "*Acrylic retail* signage logos — small run", pick_title: "A4 sheet · 5–10 logo stickers", pick_detail: "S$25 · one A4 fits multiple logo sizes · no cut path needed, transfer applies cleanly" },
        { need: "*Ceramic mug* personalisation — mixed designs", pick_title: "A3 sheet · 30 mixed designs", pick_detail: "S$50 · gang-up any combination of designs · one sheet covers a whole order" },
        { need: "*Premium product* labels — small volume, looks built-in", pick_title: "A4 × 3 sheets · varied design run", pick_detail: "S$75 · multiple A4s for different product lines · each sheet a different layout" },
      ],
      title: "Tell us the job,\nwe'll tell you",
      kicker: "Quick guide",
      title_em: "the pick.",
      right_note_body: "No heat, no tools, no expertise. Peel, press, release — sticks like it was printed on.",
      right_note_title: "Applies to any hard surface.",
    },
    seo_magazine: {
      lede: "UV DTF changes what a sticker can look like. Regular vinyl sits on a surface — you can see the edge, the thickness, the sticker-ness. UV DTF bonds so cleanly it reads as printed-on. One format, two sheet sizes, and the design-per-sheet limit is whatever you can fit.",
      title: "Everything worth knowing,",
      title_em: "before you peel.",
      issue_label: "Issue №01 · UV DTF Stickers",
      articles: [
        {
          num: "01",
          title: "Why UV DTF looks different from regular vinyl.",
          body: [
            "A regular die-cut vinyl sticker is a film that sits *on* the surface. You can see the edge thickness, feel it with a fingernail, notice the way light bounces off the sticker face differently from the surface around it. It's unmistakeably a sticker.",
            "UV DTF uses a UV-cured ink layer sandwiched with an adhesive that **bonds into the micro-texture** of the surface. Applied to glass, metal, or acrylic, the ink reads as if it were printed directly onto the object — no visible edge film, no thickness, no sticker aesthetic. The transfer paper peels away cleanly after pressing, leaving just the ink bonded to the surface.",
          ],
          side: {
            kind: "list",
            label: "What it bonds to",
            rows: [
              { text: "Glass", time: "Bottles, jars, lens covers" },
              { text: "Metal", time: "Tumblers, bike frames, kit" },
              { text: "Acrylic", time: "Signage, display cases" },
              { text: "Ceramic", time: "Mugs, tiles, plates" },
              { text: "Wood", time: "Boards, boxes, crates" },
              { text: "Powder-coat", time: "Equipment, appliances" },
            ],
          },
        },
        {
          num: "02",
          title: "Gang-sheet economics — fit everything on one sheet.",
          body: [
            "Unlike regular die-cut stickers (one design per sheet), UV DTF sheets are **gang-up sheets** — fit as many designs as you can arrange on the sheet. An **A4 sheet ($25)** holds roughly 20–40 medium logo stickers, or 100+ small marker stickers. An **A3 sheet ($50)** doubles that.",
            "The economics flip vs die-cut stickers: because a single sheet can hold mixed designs, UV DTF wins for short runs of many different products — a small merch drop with 8 product designs fits on one A3 sheet. For hundreds of copies of *one* design, regular die-cut stickers are usually cheaper per piece. Rule of thumb: UV DTF for variety, die-cut for volume.",
          ],
          side: {
            kind: "list",
            label: "Sheet capacity",
            rows: [
              { text: "A4 $25", time: "~20–100 designs gang-up" },
              { text: "A3 $50", time: "~40–200 designs gang-up" },
            ],
          },
        },
        {
          num: "03",
          title: "Application — peel, press, release.",
          body: [
            "Each sticker comes as a sandwich of **transfer paper + ink + release liner**. Peel the release liner, position the ink-side down onto the cleaned surface, rub firmly for 10–15 seconds (a credit card edge works), then peel the transfer paper from the top. The ink stays bonded; the paper comes away clean.",
            "No heat press required. No vinyl-cutter skill. The only real prep is **cleaning the surface** with isopropyl alcohol or a degreaser wipe — any oil or dust under the application point shows as a cloudy spot. Applies in under 30 seconds per sticker once you've got the rhythm. Apply to curved surfaces (bottles, tumblers) by working from one side across; the thin ink layer flexes without cracking.",
          ],
          side: {
            kind: "stat",
            num: "~30 sec",
            label: "Per sticker applied",
            caption: "peel, position, press, release",
          },
        },
        {
          num: "04",
          title: "Artwork — cutless, full-colour, any shape.",
          body: [
            "UV DTF doesn't use a die-cut path — the ink prints to whatever shape you design, and the surrounding clear area has no adhesive so it disappears on application. You can print irregular outlines, letter-shaped stickers, logos with cut-outs, multi-part designs that stay in register when applied.",
            "Send a PDF at A4 or A3 page size, with your designs gang-arranged. Leave **5mm between designs** for clean separation during application (stickers peel one at a time from the sheet). CMYK full-colour, no spot colours, no cut path needed. For white elements on dark surfaces, we can include a white ink underlay — tell us in the brief if your design needs it.",
          ],
          side: {
            kind: "list",
            label: "Artwork prep",
            rows: [
              { text: "Format", time: "PDF · A4 or A3 page size" },
              { text: "Gang-up", time: "Any layout · 5mm gaps" },
              { text: "Cut path", time: "Not needed · ink defines shape" },
              { text: "Colour", time: "CMYK · white underlay on request" },
            ],
          },
        },
      ],
    },
  },
  faqs: [
    { question: "What surfaces does UV DTF stick to?", answer: "Glass, metal, acrylic, ceramic, wood, powder-coated metal, and most hard non-porous surfaces. Not designed for fabric (use heat-transfer vinyl or DTF garment transfers for that) or porous materials like untreated cardboard." },
    { question: "How is this different from a regular sticker?", answer: "Regular vinyl stickers sit on top of the surface — you can see the edge and feel the thickness. UV DTF bonds a thin UV-cured ink layer into the surface micro-texture, so the design reads as if it were printed directly on the object. No visible sticker edge, no thickness, no peeling over time." },
    { question: "Do I need a heat press?", answer: "No. UV DTF applies at room temperature — peel the release liner, press the sticker onto the clean surface with firm pressure (10–15 seconds), then peel away the transfer paper. A credit card edge works as a pressure tool. No heat, no tools, no expertise." },
    { question: "How many designs can I fit on one sheet?", answer: "As many as you can arrange on the page. An A4 sheet fits roughly 20–40 medium logo stickers or 100+ small marker designs. A3 doubles that. Unlike our regular die-cut stickers (one design per sheet), UV DTF sheets are gang-up — mix any combination of designs." },
    { question: "How much does UV DTF cost?", answer: "A4 sheet: $25. A3 sheet: $50. Flat per-sheet pricing — fit as many designs as you want onto the sheet without affecting the price." },
    { question: "What file format do you need?", answer: "PDF at A4 or A3 page size, with your designs gang-arranged. CMYK full colour. Leave 5mm gaps between designs for clean separation during application. No cut path needed — the ink print itself defines the sticker shape. If you need white ink underlay for dark surfaces, mention it in the brief." },
    { question: "How long does production take?", answer: "3 working days from approved proof. Same lead time for A4 and A3 sheets." },
    { question: "Will it fade outdoors?", answer: "UV DTF is UV-cured and rated for indoor and outdoor use — fade-resistant for 1–2 years under direct sunlight, longer in shaded conditions. Not recommended for heavy-abrasion surfaces (like the outside of a bike helmet taking rain + friction daily) where vinyl is still the better pick." },
  ],
};

// ────────────────────────────────────────────────────────────────
// APPLY
// ────────────────────────────────────────────────────────────────

async function main() {
  for (const p of [ncr, stamp, stickers, uvdtf]) {
    await patchProduct(p.id, p.productUpdate, p.extras, p.faqs);
    console.log(`✓ ${p.id}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
