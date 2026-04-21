// Stickers content rewrite — aligns copy with the current live config:
//   • 7 visible materials (Blockout + Metallic Sands removed by admin)
//   • Typed qty 1–50 sheets with per_unit_at_tier_rate mode
//     ($15 → $10 per sheet as qty climbs, monotonic floor applied)
//   • 1 working day lead time (was 3)
//
// Surgical: PATCH products (tagline, description) + product_extras
// (seo_title/desc/body, intro, matcher, seo_magazine) + replace FAQs.
// H1 / H1em untouched per the skip-H1 rewrite rule.

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

const PID = 'adb6bb6d-63d0-41c2-8908-64e64541ef04';

const productUpdate = {
  tagline: 'Stick your brand anywhere — it survives everything',
  description:
    "Die-cut stickers on a 320 × 450mm sheet, one design per sheet, cut to any shape. Seven finishes — Waterproof Gloss, Waterproof Matt, Transparent, plus four Metallic effects (Rainbow, Rainbow Sands, Stripes, Gold). Type any quantity from 1 to 50 sheets — $15 per sheet at qty 1, dropping to $10 per sheet at qty 50. Next-day production.",
};

const extras = {
  seo_title: 'Sticker Printing Singapore | Die-Cut, Waterproof, Metallic',
  seo_desc:
    "Custom die-cut sticker printing in Singapore — 320 × 450mm sheet, one design per sheet, cut to any shape. 7 finishes (Waterproof Gloss / Matt, Transparent, 4 Metallics). Type any qty 1–50, $15/sheet dropping to $10/sheet by volume.",
  seo_body: `Sticker printing Singapore — 320 × 450mm die-cut sheets, one design per sheet, cut to any shape. Seven materials (Waterproof Gloss / Waterproof Matt / Transparent / Metallic Rainbow / Metallic Rainbow Sands / Metallic Stripes / Metallic Gold), all priced identically. Type any quantity from 1 to 50 sheets — $15 per sheet at qty 1, scaling to $10 per sheet at qty 50; the per-sheet rate drops at each tier (10, 20, 30, 40, 50). Next-day production. Product packaging, laptop decals, shop window graphics, helmet stickers, water bottle labels, event lanyards.`,
  intro: `Stickers travel. They end up on surfaces you never planned — laptops, water bottles, helmets, shop windows, packaging, lanyards — and they stay there, in circulation, far beyond the campaign that launched them. We die-cut any shape from a 320 × 450mm sheet in seven material finishes: Waterproof Gloss, Waterproof Matt, Transparent, and four Metallic effects (Rainbow, Rainbow Sands, Stripes, Gold). One design per sheet — enter your sticker width × height and the live calculator shows how many fit. All materials price the same: type any number of sheets from 1 to 50 and the per-sheet rate scales with volume — $15 at qty 1, $14 at 10, $13 at 20, $12 at 30, $11 at 40, $10 at 50. Next-day production from approved proof.`,
  matcher: {
    rows: [
      {
        need: "*Brand stickers* for product packaging — 100–200 pieces",
        pick_title: "Waterproof Gloss · 50×50mm · 10 sheets",
        pick_detail: "S$140 total · ~20 stickers per sheet · 200 total stickers at $0.70/piece",
      },
      {
        need: "*Event lanyard logos* — 400 pieces in one run",
        pick_title: "Waterproof Matt · 80×40mm · 20 sheets",
        pick_detail: "S$260 total · ~20 stickers per sheet · 400+ total at $0.65/piece",
      },
      {
        need: "*Premium label* — small qty, looks expensive",
        pick_title: "Metallic Gold · 40×40mm · 1 sheet",
        pick_detail: "S$15 · roughly 40 stickers per sheet · shiny gold finish",
      },
      {
        need: "*Water bottle* decals — durable, outdoor-facing",
        pick_title: "Waterproof Gloss · 70×70mm · 20 sheets",
        pick_detail: "S$260 total · ~12 per sheet · 240 total · UV + water-rated",
      },
      {
        need: "*Large quantity* merch stickers — budget-first",
        pick_title: "Waterproof Matt · 50×80mm · 50 sheets",
        pick_detail: "S$500 total · ~16 per sheet · 800 total at $0.625/piece",
      },
    ],
    title: "Tell us the job,\nwe'll tell you",
    kicker: "Quick guide",
    title_em: "the pick.",
    right_note_body: "320 × 450mm sheets · 10mm gutter between stickers for die-cut bleed · one design per sheet.",
    right_note_title: "One design, one sheet, any shape.",
  },
  seo_magazine: {
    lede:
      "A sticker is the cheapest piece of advertising you'll ever put into the world — and one of the longest-lived. Pick the right material for the surface it sticks to and the weather it'll face, size it to fit the real-world object, and order enough that the per-sticker cost makes it easy to give away.",
    title: "Everything worth knowing,",
    title_em: "before you order a sheet.",
    articles: [
      {
        num: "01",
        title: "Material — pick by where it lives.",
        body: [
          "**Waterproof Gloss** is the default for outdoor stickers — UV-resistant vinyl with a glossy finish that pops colour. Laptops, water bottles, helmets, bike frames, anything that sees weather. **Waterproof Matt** is the same durability with a softer finish — looks more considered, less mass-market, the pick for premium product branding.",
          "**Transparent** lets the surface show through — the trick for shop window graphics and packaging where the label needs to feel integrated. The four **Metallic** finishes (Rainbow, Rainbow Sands, Stripes, Gold) add reflective / iridescent effects — use for premium product labels, awards, brand moments. Rainbow catches all spectrum colours at angle; Rainbow Sands adds a sparkle texture; Stripes reads as brushed metal; Gold is a warm reflective gold substrate.",
        ],
        side: {
          kind: "list",
          label: "Material by use",
          rows: [
            { text: "Waterproof Gloss", time: "Outdoor, laptops, water bottles" },
            { text: "Waterproof Matt", time: "Premium product branding" },
            { text: "Transparent", time: "Window graphics, integrated labels" },
            { text: "Metallic Rainbow", time: "Spectrum iridescent — premium" },
            { text: "Metallic Rainbow Sands", time: "Iridescent + sparkle texture" },
            { text: "Metallic Stripes", time: "Brushed-metal look" },
            { text: "Metallic Gold", time: "Warm reflective gold" },
          ],
        },
      },
      {
        num: "02",
        title: "Sheet economics — how many stickers you actually get.",
        body: [
          "One sheet is **320 × 450mm**, one design per sheet. The live calculator on the configurator computes how many stickers fit at your chosen size — a **100 × 100mm sticker** gives you around 8 per sheet (10mm gutter for die-cut bleed), a **50 × 50mm** gives you 40, a **25 × 25mm** gives you 130+.",
          "The economics work backwards from the per-piece cost you want. If you want 1,000 stickers at around $0.50 each, that's $500 total — 50 sheets at $10/sheet. At 50 × 80mm that's roughly 16 per sheet = 800 stickers at $500 = $0.625 each. Size and qty choices are linked through the sheet calc; play with the configurator until the per-piece lands where you need it.",
        ],
        side: {
          kind: "stat",
          label: "Sheet size (mm)",
          num: "320 × 450",
          caption: "one design per sheet, 10mm die-cut gutter",
        },
      },
      {
        num: "03",
        title: "Volume pricing — $15 to $10 per sheet, any qty you type.",
        body: [
          "Type any number of sheets from **1 to 50**. The per-sheet rate drops at each tier: **$15/sheet at qty 1**, **$14 at 10**, **$13 at 20**, **$12 at 30**, **$11 at 40**, **$10 at 50**. Between tiers the rate stays at the tier you fall into — so 7 sheets is 7 × $15 = $105, and 25 sheets is 25 × $13 = $325.",
          "At every tier jump (20 / 30 / 40 / 50 sheets) **you effectively get 1 sheet free** — the total matches what the previous qty would have cost, so the extra sheet lands on the house. For runs over 50 sheets the price becomes a custom quote — higher volumes move into roll-sticker production or gang-run economics which price differently. Planning a large merch run? Tell us the target qty and we'll route the job to the right process.",
        ],
        side: {
          kind: "list",
          label: "Per-sheet tier",
          rows: [
            { text: "1 sheet", time: "$15/sheet" },
            { text: "10 sheets", time: "$14/sheet" },
            { text: "20 sheets", time: "$13/sheet · +1 free" },
            { text: "30 sheets", time: "$12/sheet · +1 free" },
            { text: "40 sheets", time: "$11/sheet · +1 free" },
            { text: "50 sheets", time: "$10/sheet · +1 free" },
          ],
        },
      },
      {
        num: "04",
        title: "Artwork — cut-path and colour build.",
        body: [
          "Send a vector file (PDF, AI, SVG) with your sticker artwork plus a separate **cut path** as a spot-colour stroke (we use the name \"CutContour\" by convention). The cut path is what drives the die-cutter — it can be any shape, not just a rectangle. Round, rounded rectangle, bespoke outline of your logo, even cut-outs inside the shape.",
          "For **Metallic** materials, the substrate is already reflective — avoid large solid-white fills since white ink sits on top of the metallic effect and looks cloudy at scale. Design with the metallic as a highlight colour (logo, accent elements) rather than an overall background. **CMYK for body colour, 3mm bleed** on the outside of the cut path so the material extends beyond the cut line.",
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
};

const faqs = [
  {
    question: "What materials do you offer?",
    answer:
      "Seven finishes, all priced the same: Waterproof Gloss, Waterproof Matt, Transparent, Metallic Rainbow, Metallic Rainbow Sands, Metallic Stripes, and Metallic Gold. Pick by where the sticker lives — outdoor/laptops → waterproof gloss or matt; windows/packaging overlays → transparent; premium labels, awards, or brand moments → metallic.",
  },
  {
    question: "How many stickers do I get per sheet?",
    answer:
      "Depends on your sticker size. The live calculator on the product page computes it when you enter width × height in mm — sheet is 320 × 450mm with a 10mm gutter between stickers for die-cut bleed. 100×100mm = 8 per sheet, 50×50mm = 40 per sheet, 25×25mm = 130+ per sheet.",
  },
  {
    question: "Can I have different designs on one sheet?",
    answer:
      "No — one design per sheet. If you need multiple designs, order multiple sheets (different design on each). For gang-printing mixed designs on one sheet, use our UV DTF sticker product instead.",
  },
  {
    question: "How much does sticker printing cost?",
    answer:
      "Type any qty from 1 to 50 sheets; the per-sheet rate drops at each tier: $15/sheet at qty 1, $14 at 10, $13 at 20, $12 at 30, $11 at 40, $10 at 50. Same price on all seven materials. Between tiers, the rate stays at the tier you're on — e.g. 7 sheets × $15 = $105, 25 sheets × $13 = $325. For 50+ sheets, contact us for a custom quote.",
  },
  {
    question: "Do I get a bonus at the volume tiers?",
    answer:
      "Yes — at 20, 30, 40, and 50 sheets you effectively get one sheet on the house. The total holds at the previous tier's peak price while the new tier rate catches up, so the extra sheet is on us at the tier jump.",
  },
  {
    question: "What shape can the stickers be?",
    answer:
      "Any shape you design the cut path for — round, rounded rectangle, custom outline of your logo, odd shapes, even cut-outs inside the sticker. Send your artwork with a spot-colour cut path and we die-cut to that line.",
  },
  {
    question: "Are the stickers waterproof?",
    answer:
      "The Waterproof Gloss, Waterproof Matt, and Metallic variants are all UV-resistant and water-rated — suitable for outdoor use on laptops, bottles, helmets, bikes. Transparent is water-resistant too but we recommend waterproof finishes for anything facing regular weather.",
  },
  {
    question: "What file format do you need?",
    answer:
      "Vector PDF (preferred), AI, or SVG with your artwork plus a separate cut path — a spot-colour stroke named \"CutContour\" by convention. CMYK for body colours, 3mm bleed on the outside of the cut path. For metallic materials, design with the substrate showing through (avoid large solid white fills).",
  },
  {
    question: "How long does production take?",
    answer:
      "Next-day production — 1 working day from approved proof — includes printing, die-cutting, and quality check. Larger runs within the 50-sheet cap don't add days; the cutter handles 50 sheets as fast as 10.",
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
  console.log('[2/3] product_extras updated (seo_title/desc/body, intro, matcher, seo_magazine).');

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
