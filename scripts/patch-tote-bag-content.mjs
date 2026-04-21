// Tote Bag content rewrite — aligns to current config:
//   • 3 canvas bag sizes — CB1 (L) 620×440×160, CB2 (M) 470×420×140,
//     CB3 (S) 340×360×80
//   • Heat-transfer print, A6 / A5 / A4 / A3 print area (A3 on CB1/CB2 only)
//   • Single or double sided, same price (not an axis)
//   • Qty 100 to 5,000 (cap applied earlier)
//   • 14 working days production, print_mode = Heat Transfer
//
// H1 / H1em untouched per the skip-H1 rewrite rule.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };
const PID = '32294086-397c-4c64-95f0-51834fe363d6';

const productUpdate = {
  tagline: 'Canvas totes that survive the commute — your brand in daily rotation',
  description:
    "Custom canvas tote bags in three sizes (CB1 Large 620×440×160, CB2 Medium 470×420×140, CB3 Small 340×360×80). Heat-transfer full-colour print area A6 / A5 / A4 / A3 (A3 on CB1 and CB2 only). Single- or double-sided print at the same price. Qty 100 to 5,000. From S$912 / 100 bags (CB3 · A6). 14 working days production.",
};

const extras = {
  seo_title: 'Canvas Tote Bag Printing Singapore | Heat-Transfer Branded Bags',
  seo_desc:
    "Custom canvas tote bag printing in Singapore — 3 sizes (Large CB1 / Medium CB2 / Small CB3), A6-A3 print area, heat-transfer full colour. Single or double sided same price. From S$912 / 100 bags.",
  seo_body: `Canvas tote bag printing Singapore — three sizes (CB1 Large 620×440×160mm, CB2 Medium 470×420×140mm, CB3 Small 340×360×80mm). Heat-transfer full-colour print in your chosen area (A6 / A5 / A4 / A3 — A3 available on CB1 and CB2 only). Single-sided or double-sided at the exact same price — pick by brand design, not cost. Runs from 100 to 5,000 bags. From S$912 for 100 CB3 Small bags with A6 print; up to S$93,797.40 for 5,000 CB1 Large with A3 print. 14 working days heat-transfer production. Corporate event swag, brand launches, retail giveaways, conference packs, staff uniforms, sustainability drives.`,
  intro: `A canvas tote is a branded object that outlives every other piece of marketing your brand ever prints — customers reuse it as a shopping bag, a library bag, a gym carry, for years. We heat-transfer print on three standard canvas sizes: **CB1 Large (620 × 440 × 160mm)** for grocery / shopping runs, **CB2 Medium (470 × 420 × 140mm)** for everyday carry, **CB3 Small (340 × 360 × 80mm)** for event giveaways and smaller gift sets. Pick your **print area** (A6 / A5 / A4 / A3 — A3 available on CB1 and CB2) and whether the print goes on **one side or both** (same price). Runs from **100** to **5,000 bags**. **14 working days heat-transfer production.**`,
  matcher: {
    rows: [
      { need: "*Small event giveaway* — single-sided pocket tote", pick_title: "CB3 Small · A6 print · single-sided · 100 bags", pick_detail: "S$912 · ~S$9.12/bag · minimum event swag order" },
      { need: "*Conference pack* — mid-size with big logo", pick_title: "CB2 Medium · A4 print · double-sided · 500 bags", pick_detail: "S$6,535.50 · double-sided at same price as single · large brand footprint" },
      { need: "*Retail giveaway* — shoppers carry weekly", pick_title: "CB1 Large · A5 print · single-sided · 1,000 bags", pick_detail: "S$14,275.50 · ~S$14.28/bag · shopping-friendly size + visible logo" },
      { need: "*Brand launch* drop — maximum visual impact", pick_title: "CB1 Large · A3 print · double-sided · 500 bags", pick_detail: "S$10,333.10 · full-size print both faces · most billboard-like configuration" },
      { need: "*Bulk corporate* sustainability drive — 5,000 max", pick_title: "CB2 Medium · A4 print · double-sided · 5,000 bags", pick_detail: "S$59,835 · ~S$11.97/bag · ceiling of the standard ladder" },
    ],
    title: "Tell us the run,\nwe'll tell you", kicker: "Quick guide", title_em: "the pick.",
    right_note_body: "Canvas totes · heat-transfer full-colour print · single or double sided at the same price.",
    right_note_title: "Same price, one side or two.",
  },
  seo_magazine: {
    lede: "A canvas tote is the longest-lived piece of marketing your brand can print — customers use a good one for years, and every commute turns into a branded billboard in the wild. Four decisions shape which kind lasts.",
    title: "Everything worth knowing,", title_em: "before you print the tote.",
    articles: [
      { num: "01", title: "Size — three canvas shapes, pick by daily use.",
        body: [
          "**CB1 Large (620 × 440 × 160mm)** is the shopping-run size — fits a week's groceries, a laptop plus files, a yoga mat and a water bottle. It's the default for retail giveaways and sustainability campaigns because customers actually use it on repeat shopping trips.",
          "**CB2 Medium (470 × 420 × 140mm)** is the everyday carry — work commute, gym bag, conference pack. The most common size for corporate swag and event drops because it fits the typical carry without being oversized. **CB3 Small (340 × 360 × 80mm)** is the event giveaway / boutique size — small enough to tuck away, perfect for retail gift bags and smaller conference packs.",
        ],
        side: { kind: 'list', label: 'Size · dimensions', rows: [
          { text: 'CB1 Large',  time: '620 × 440 × 160mm' },
          { text: 'CB2 Medium', time: '470 × 420 × 140mm' },
          { text: 'CB3 Small',  time: '340 × 360 × 80mm' },
        ]},
      },
      { num: "02", title: "Print area — A6 to A3, pick by brand footprint.",
        body: [
          "**A6 (~105 × 148mm)** is a postcard-sized logo area — good for a discreet brand mark on a minimalist tote. **A5 (~148 × 210mm)** is the default for most corporate runs — logo plus a line of copy. **A4 (~210 × 297mm)** is a full-page print area — photographic art, large wordmarks, or a bold graphic statement. **A3 (~297 × 420mm)** is billboard-size, available on CB1 and CB2 only — covers most of the tote face.",
          "Bigger print area costs more (the heat-transfer sheet and press time scales with area) but the jump from A6 to A3 on any given size isn't proportional — at 1,000pc on CB1, A6 is S$13,204.50 vs A3 at S$19,567.50, roughly a 48% upcharge for 4× the print area. For campaigns where the bag is the billboard, A3 is the right bet.",
        ],
        side: { kind: 'list', label: 'Print area · 1000pc CB1', rows: [
          { text: 'A6', time: '$13,204.50' },
          { text: 'A5', time: '$14,275.50' },
          { text: 'A4', time: '$16,399.50' },
          { text: 'A3', time: '$19,567.50' },
        ]},
      },
      { num: "03", title: "Single or double sided — same price, pick by design.",
        body: [
          "Most tote print campaigns run **single-sided** — front-face logo or wordmark, back face blank. Cleaner, faster to read on the commute, works with any brand aesthetic. **Double-sided** adds the same artwork (or a second design) to the back face — good for brand balance, for bags that swing between front/back during carry, or when you want the tote to read the same regardless of which way the wearer is walking.",
          "Either way, **price is identical**. Double-sided heat transfer adds about 2 days to production but doesn't cost more per bag. If you're unsure, go double — the tote reads as branded from every angle for the same spend.",
        ],
        side: { kind: 'list', label: 'Sides decision', rows: [
          { text: 'Single',  time: 'Clean · minimal · default' },
          { text: 'Double',  time: 'Balanced · 360° brand' },
          { text: 'Cost diff', time: 'None — same price' },
        ]},
      },
      { num: "04", title: "Qty — 100 minimum, 5,000 top of the standard ladder.",
        body: [
          "**Minimum 100 bags** — smaller runs aren't economical for heat-transfer setup. At 100pc on CB3 Small · A6, S$912 — roughly S$9.12 per bag. Scale up and the per-piece cost drops sharply: 500pc at S$3,837 (~S$7.67), 1,000pc at S$7,512 (~S$7.51), 5,000pc at S$36,963 (~S$7.39). The curve flattens past 1k because the bulk of the cost is materials, not setup.",
          "**5,000 is the top of the standard ladder.** Above that, contact us — larger runs can go screen-print (cheaper per piece at volume, fewer colours) or be split across multiple heat-transfer runs. For sustainability drives, corporate reorders, and retail chain giveaways at 10k+, tell us the target and we'll route the job to the most cost-efficient process.",
        ],
        side: { kind: 'list', label: 'CB3 · A6 qty ladder', rows: [
          { text: '100 bags',   time: '$912 · $9.12/bag' },
          { text: '500 bags',   time: '$3,837 · $7.67/bag' },
          { text: '1,000 bags', time: '$7,512 · $7.51/bag' },
          { text: '5,000 bags', time: '$36,963 · $7.39/bag' },
        ]},
      },
    ],
  },
  how_we_print: null,
  hero_big: 'Canvas Tote',
  h1: null, h1em: null, image_url: null, chooser: null,
};

const faqs = [
  { question: "What sizes do you offer?", answer: "Three canvas bag sizes: CB1 Large (620 × 440 × 160mm — shopping / grocery), CB2 Medium (470 × 420 × 140mm — everyday carry / conference), CB3 Small (340 × 360 × 80mm — event giveaway / boutique). Custom sizes available by separate quote." },
  { question: "What print area options are available?", answer: "A6 (postcard-sized logo), A5 (logo plus copy), A4 (full-page artwork), and A3 (billboard-sized). A3 is only available on CB1 and CB2 — CB3 Small's face isn't big enough for an A3 print. The configurator hides the A3 option automatically when you pick CB3." },
  { question: "Is single-sided or double-sided more expensive?", answer: "Neither — they cost the same. Double-sided heat transfer adds about 2 days to production but the per-bag price stays identical. If you want brand visibility from any angle the wearer faces, pick double." },
  { question: "How much does a printed canvas tote cost?", answer: "From S$912 for 100 CB3 Small bags with A6 print. CB2 Medium with A5 at 500pc is S$5,314.50. CB1 Large with A3 at 1,000pc is S$19,567.50. Use the configurator for an exact quote on your (size × print area × qty) combo — sides is free." },
  { question: "What's the minimum and maximum order?", answer: "Minimum 100 bags — heat-transfer setup cost makes smaller runs uneconomical. Maximum 5,000 bags in the standard ladder. For runs above 5k, contact us — larger volumes can go screen-print or split across multiple heat-transfer runs at better per-unit economics." },
  { question: "How long does production take?", answer: "14 working days from approved digital proof. Heat transfer is a slower process than offset — the print is pressed onto pre-sewn canvas bags individually, rather than printed on flat sheet and assembled after. The extra days buy you a durable print that survives the wash cycle." },
  { question: "Will the print survive washing?", answer: "Yes. Heat-transfer prints on canvas are durable for normal machine washing (cold water, inside-out recommended for maximum longevity). Avoid bleach and high-heat tumble drying. The print will fade gradually over years of heavy use but won't crack or peel within the normal lifetime of the bag." },
  { question: "What file format do you need?", answer: "Print-ready PDF at the print-area size (A6 / A5 / A4 / A3) with 3mm bleed, CMYK full colour, fonts embedded. Transparent background is fine if your artwork includes white or light tones that shouldn't be the canvas colour — we treat the canvas as the negative-space colour by default." },
];

async function main() {
  await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, { method:'PATCH', headers:H, body: JSON.stringify(productUpdate) });
  console.log('[1/3] tagline + description updated.');
  await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, { method:'PATCH', headers:H, body: JSON.stringify(extras) });
  console.log('[2/3] extras updated (seo, intro, matcher, magazine).');
  await fetch(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}`, { method:'DELETE', headers:H });
  await fetch(`${BASE}/rest/v1/product_faqs`, {
    method:'POST', headers:H,
    body: JSON.stringify(faqs.map((f,i) => ({ product_id: PID, question: f.question, answer: f.answer, display_order: i }))),
  });
  console.log(`[3/3] ${faqs.length} FAQs replaced.`);
}
main().catch(e => { console.error(e); process.exit(1); });
