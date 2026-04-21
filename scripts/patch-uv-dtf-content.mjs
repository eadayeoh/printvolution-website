// UV DTF content rewrite — live config is A3 only (S$50 flat) with a
// 2-working-day lead time. Prior copy still referenced A4 ($25) and
// 3-day production. Surgical: updates product_extras + replaces FAQs
// only. Leaves H1 / H1em untouched per the skip-H1 rewrite rule.

import fs from 'node:fs';

const env = fs.readFileSync(
  '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
  'utf8',
);
const kv = Object.fromEntries(
  env.trim().split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }),
);
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

const PID = 'd29c3b77-f9ef-4974-af50-1ebe83e9c50c';

const productUpdate = {
  tagline: 'Printed-on look on any hard surface — peel and press',
  description:
    "UV DTF stickers bond like a printed surface onto glass, metal, acrylic, wood, ceramic. Gang as many designs as you want onto one A3 sheet (297 × 420mm) at S$50 flat. No heat, no tools — peel, press, release. 2 working days from approved proof.",
};

const extras = {
  seo_title: 'UV DTF Sticker Printing Singapore | A3 Gang Sheet Transfers',
  seo_desc:
    "UV DTF sticker printing in Singapore — peel-and-press transfers onto glass, metal, wood, acrylic, ceramic. A3 sheet (297 × 420mm) at S$50 flat. Fit as many designs as you want per sheet.",
  seo_body: `UV DTF sticker printing Singapore — printed-on look on hard surfaces (glass bottles, metal tumblers, acrylic signage, wooden boards, ceramic mugs, powder-coated products). A3 sheet 297 × 420mm at S$50 flat, unlimited designs gang-up per sheet. No heat press, no tools — peel from transfer paper, press onto the surface, release. 2 working days from approved proof. Glassware branding, premium packaging stickers, product labels, bar branding, retail signage.`,
  intro: `A UV DTF sticker does one thing regular vinyl can't — it applies to almost any hard surface and looks like the design was printed directly onto the object. Glass bottles, metal tumblers, acrylic signage, ceramic mugs, wooden boards, powder-coated equipment — peel from the transfer paper, press onto the surface, release. No heat, no tools, no surface prep beyond a clean wipe. Single sheet format: **A3 at S$50 flat** (297 × 420mm). Unlike regular die-cut stickers, you can fit as many designs as you want onto one sheet — gang them up in your artwork. 2 working days production.`,
  matcher: {
    rows: [
      {
        need: "*Glass bottle* labels — 30–50 bottles for an event",
        pick_title: "A3 sheet · gang-up layout",
        pick_detail: "S$50 · one sheet, 30–50 designs (varied or identical) · ~S$1–1.70/bottle",
      },
      {
        need: "*Metal tumbler* branding for corporate gifts",
        pick_title: "A3 sheet · 20–40 tumblers",
        pick_detail: "S$50 · one sheet, peel + press on rim or body · ~S$1.25–2.50/tumbler",
      },
      {
        need: "*Acrylic retail* signage logos — small mixed run",
        pick_title: "A3 sheet · mixed logo sizes",
        pick_detail: "S$50 · gang varied logo sizes on one sheet · no cut path, ink defines shape",
      },
      {
        need: "*Ceramic mug* personalisation — mixed designs",
        pick_title: "A3 sheet · 20–30 mixed designs",
        pick_detail: "S$50 · gang-up any combination · one sheet covers the whole order",
      },
      {
        need: "*Multiple product lines* — different designs per line",
        pick_title: "A3 × 3 sheets · separate layouts",
        pick_detail: "S$150 · one A3 per product family, each sheet a distinct gang-up",
      },
    ],
    title: "Tell us the job,\nwe'll tell you",
    kicker: "Quick guide",
    title_em: "the pick.",
    right_note_body: "No heat, no tools, no vinyl-cutter skill · clean surface, press, release.",
    right_note_title: "One format, unlimited designs per sheet.",
  },
  seo_magazine: {
    lede:
      "UV DTF changes what a sticker can look like. Regular vinyl sits on a surface — you can see the edge, the thickness, the sticker-ness. UV DTF bonds so cleanly it reads as printed-on. One format, one flat price, and the design-per-sheet limit is whatever you can fit.",
    title: "Everything worth knowing,",
    title_em: "before you peel.",
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
          "Unlike regular die-cut stickers (one design per sheet), UV DTF sheets are **gang-up sheets** — fit as many designs as you can arrange. A single **A3 sheet (S$50)** holds roughly 40–80 medium logo stickers, 100+ small marker stickers, or around 20–30 mug-sized designs. Mixed layouts are fine — a product range with 8 different labels can sit on one sheet.",
          "The economics flip vs die-cut stickers: because a single sheet can hold mixed designs, UV DTF wins for short runs of many different products — a small merch drop or event bottle run fits on a single sheet at S$50. For hundreds of copies of *one* design, regular die-cut stickers are usually cheaper per piece. Rule of thumb: UV DTF for variety, die-cut for volume.",
        ],
        side: {
          kind: "list",
          label: "A3 sheet capacity",
          rows: [
            { text: "Small (≤30 mm)", time: "100+ markers / icons" },
            { text: "Medium (30–80 mm)", time: "40–80 logo stickers" },
            { text: "Large (80–150 mm)", time: "20–30 mug labels" },
            { text: "Poster-style", time: "1–4 feature designs" },
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
          label: "Per sticker applied",
          num: "~30 sec",
          caption: "peel, position, press, release",
        },
      },
      {
        num: "04",
        title: "Artwork — cutless, full-colour, any shape.",
        body: [
          "UV DTF doesn't use a die-cut path — the ink prints to whatever shape you design, and the surrounding clear area has no adhesive so it disappears on application. You can print irregular outlines, letter-shaped stickers, logos with cut-outs, multi-part designs that stay in register when applied.",
          "Send a **PDF at A3 page size (297 × 420mm)** with your designs gang-arranged. Leave **5mm between designs** for clean separation during application (stickers peel one at a time from the sheet). CMYK full-colour, no spot colours, no cut path needed. For white elements on dark surfaces, we can include a white ink underlay — tell us in the brief if your design needs it.",
        ],
        side: {
          kind: "list",
          label: "Artwork prep",
          rows: [
            { text: "Format", time: "PDF · A3 page size" },
            { text: "Gang-up", time: "Any layout · 5mm gaps" },
            { text: "Cut path", time: "Not needed · ink defines shape" },
            { text: "Colour", time: "CMYK · white underlay on request" },
          ],
        },
      },
    ],
  },
};

const faqs = [
  {
    question: "What surfaces does UV DTF stick to?",
    answer:
      "Glass, metal, acrylic, ceramic, wood, powder-coated metal, and most hard non-porous surfaces. Not designed for fabric (use heat-transfer vinyl or DTF garment transfers for that) or porous materials like untreated cardboard.",
  },
  {
    question: "How is this different from a regular sticker?",
    answer:
      "Regular vinyl stickers sit on top of the surface — you can see the edge and feel the thickness. UV DTF bonds a thin UV-cured ink layer into the surface micro-texture, so the design reads as if it were printed directly on the object. No visible sticker edge, no thickness, no peeling over time.",
  },
  {
    question: "Do I need a heat press?",
    answer:
      "No. UV DTF applies at room temperature — peel the release liner, press the sticker onto the clean surface with firm pressure (10–15 seconds), then peel away the transfer paper. A credit card edge works as a pressure tool. No heat, no tools, no expertise.",
  },
  {
    question: "How many designs can I fit on one sheet?",
    answer:
      "As many as you can arrange. One A3 sheet (297 × 420mm) fits roughly 40–80 medium logo stickers, 100+ small marker designs, or 20–30 mug-sized labels. Mixed layouts are fine — a product family with 8 different labels can all sit on one sheet. No cut path needed, so the ink outline IS the sticker shape.",
  },
  {
    question: "What sheet sizes and prices do you offer?",
    answer:
      "One size: A3 (297 × 420mm) at S$50 flat per sheet. Flat pricing — fit as many designs as you want onto the sheet without changing the price. Need smaller or larger than A3 for a specific project? Contact us for a custom quote.",
  },
  {
    question: "What file format do you need?",
    answer:
      "Print-ready PDF at A3 page size (297 × 420mm) with your designs gang-arranged. CMYK full colour. Leave 5mm gaps between designs for clean separation during application. No cut path needed — the ink print itself defines the sticker shape. If you need a white ink underlay for dark surfaces, mention it in the brief.",
  },
  {
    question: "How long does production take?",
    answer:
      "2 working days from approved proof. UV print, laminate with transfer paper, cure — all in-house at our Paya Lebar workshop.",
  },
  {
    question: "Will it fade outdoors?",
    answer:
      "UV DTF is UV-cured and rated for indoor and outdoor use — fade-resistant for 1–2 years under direct sunlight, longer in shaded conditions. Not recommended for heavy-abrasion surfaces (like the outside of a bike helmet taking rain + friction daily) where vinyl is still the better pick.",
  },
];

async function main() {
  const p1 = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(productUpdate),
  });
  if (!p1.ok) throw new Error(`PATCH products: ${p1.status} ${await p1.text()}`);
  console.log('[1/3] product tagline + description updated.');

  const p2 = await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(extras),
  });
  if (!p2.ok) throw new Error(`PATCH extras: ${p2.status} ${await p2.text()}`);
  console.log('[2/3] product_extras updated (seo_title/desc/body/intro, matcher, seo_magazine).');

  await fetch(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}`, {
    method: 'DELETE', headers: H,
  });
  const p3 = await fetch(`${BASE}/rest/v1/product_faqs`, {
    method: 'POST', headers: H,
    body: JSON.stringify(
      faqs.map((f, i) => ({ product_id: PID, question: f.question, answer: f.answer, display_order: i })),
    ),
  });
  if (!p3.ok) throw new Error(`POST faqs: ${p3.status} ${await p3.text()}`);
  console.log(`[3/3] ${faqs.length} FAQs replaced.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
