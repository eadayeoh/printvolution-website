// Rename Drink Carriers → Cup Sleeve.
//   • products.name:        "Drink Carriers" → "Cup Sleeve"
//   • product_extras.h1:    null → "Cup Sleeve"
//   • product_extras.h1em:  null → "310gsm Art Card Coffee Cup Sleeve (Heat Isolation)"
//   • mega_menu_items label: "Drink Carrier" → "Cup Sleeve"
//   • Content rewritten with new "Cup Sleeve" + heat-isolation framing.
// Slug stays drink-carrier to avoid breaking URLs / existing orders.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };

const PID = '25d4dd8d-1502-4f14-8557-10e64fa0131e';
const SLUG = 'drink-carrier';

// ─── 1. products.name ──────────────────────────────────────────────
await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH', headers: H,
  body: JSON.stringify({
    name: 'Cup Sleeve',
    tagline: 'Heat-isolation cup sleeves — your brand on every takeaway',
    description: 'Custom-printed coffee cup sleeves on 310gsm Art Card with Water Base Foam (heat isolation). 262mm × 50mm, 4C + 0C single-sided offset. Qty 600 to 15,000, from S$182.80. Cafés, F&B brands, event catering, takeaway drops.',
  }),
});
console.log('[1/3] products.name → Cup Sleeve');

// ─── 2. product_extras — h1, h1em, seo + long-form content ────────
const extras = {
  seo_title: 'Custom Coffee Cup Sleeve Printing Singapore | Heat Isolation',
  seo_desc:  'Custom coffee cup sleeve printing in Singapore — 310gsm Art Card with Water Base Foam heat-isolation finish, 262mm × 50mm. From S$182.80 / 600pc to S$2,742.50 / 15,000pc. Cafés, F&B, event catering.',
  seo_body:  `Cup sleeve printing Singapore — 310gsm Art Card Coffee Cup Sleeve (Heat Isolation), 262mm × 50mm, 4C + 0C offset. Cafés, F&B takeaway, event catering, pop-ups, festival concessions.
Runs 600 to 15,000 pieces. Minimum S$182.80 / 600pc, max S$2,742.50 / 15,000pc. 10 working days offset production.`,
  hero_big: 'Cup Sleeve',
  h1: 'Cup Sleeve',
  h1em: '310gsm Art Card Coffee Cup Sleeve (Heat Isolation)',
  intro: `The **cup sleeve** is the most-handled piece of packaging in a café's day — every hot takeaway drink gets one, straight from counter to customer's hand. Custom-printed sleeves carry the brand into the commute, the desk, the photo on Instagram. We print on **310gsm Art Card with Water Base Foam** — the foam layer is what gives the sleeve its heat-isolation property, keeping fingers cool against a 90°C takeaway cup. **262mm × 50mm** standard size wraps most 12oz / 16oz takeaway cups. **4C + 0C** offset print on the outside face. Runs **600 to 15,000** pieces. **10 working days offset production.**`,
  matcher: {
    rows: [
      { need: "*Single café* starter run — month's supply", pick_title: "600 sleeves · 262×50mm", pick_detail: "S$182.80 · ~S$0.30/sleeve · minimum run" },
      { need: "*Busy café* monthly order",                   pick_title: "1,500 sleeves",            pick_detail: "S$375.10 · S$0.25/sleeve · weeks of stock" },
      { need: "*Multi-outlet* F&B monthly",                  pick_title: "6,000 sleeves",            pick_detail: "S$1,122.70 · S$0.19/sleeve · spread across locations" },
      { need: "*Event / festival* concession drop",          pick_title: "9,000 sleeves",            pick_detail: "S$1,652.10 · full-weekend concession run" },
      { need: "*Bulk* quarterly reorder",                    pick_title: "15,000 sleeves",           pick_detail: "S$2,742.50 · S$0.18/sleeve · max standard tier" },
    ],
    title: "Tell us the run,\nwe'll tell you", kicker: "Quick guide", title_em: "the pick.",
    right_note_body:  "310gsm Art Card Coffee Cup Sleeve · Water Base Foam for heat isolation · 262 × 50mm standard size.",
    right_note_title: "Cool on the hand, hot in the cup.",
  },
  seo_magazine: {
    lede: "A cup sleeve is the detail most cafés underthink and over-buy. The good ones keep the drink warm, the hand cool, and the brand present — the bad ones burn fingers or tear when the cup lifts. Three decisions shape which kind ships.",
    title: "Everything worth knowing,", title_em: "before you print the cup sleeve.",
    articles: [
      { num: "01", title: "Why 310gsm Art Card with foam finish.",
        body: [
          "**310gsm Art Card** is the rigid base — thick enough to grip a full cup without flexing, thin enough to slide on and off with one hand. Any lighter and the sleeve collapses under the cup's weight when handed across the counter.",
          "**Water Base Foam** adds a textured foam layer to the inside face of the sleeve — this is the heat-isolation barrier. A plain printed sleeve against a 90°C takeaway cup transfers heat to fingers in under a minute; the foam cuts the transfer sharply so the cup is comfortable to hold the entire walk home.",
        ],
        side: { kind: 'stat', label: 'Heat barrier', num: '90→~40°C', caption: 'foam drops perceived heat' },
      },
      { num: "02", title: "Size and fit — one size, most cups.",
        body: [
          "**262mm × 50mm** is the industry-standard cup sleeve size. It wraps cleanly around most 12oz and 16oz takeaway cups (Dart, Solo, most local cup brands). For boba cups — wider, taller — this size doesn't fit; we custom-quote a larger sleeve separately.",
          "The sleeve is sized so the customer grips the middle band without covering the brand print. Logo placement matters: keep critical artwork within the middle 180mm of the 262mm width to avoid overlap at the seam when the sleeve is rolled and glued.",
        ],
        side: { kind: 'list', label: 'Fits standard', rows: [
          { text: '12oz takeaway', time: 'Yes · primary fit' },
          { text: '16oz takeaway', time: 'Yes · secondary fit' },
          { text: 'Boba / tall',   time: 'No · custom quote' },
          { text: 'Reusable mug',  time: 'No · not applicable' },
        ]},
      },
      { num: "03", title: "Qty — 600 minimum, 6k sweet spot.",
        body: [
          "**Minimum 600 sleeves** — a week or two of daily use for a single-outlet café. At 600pc the cost is S$182.80, about S$0.30 per sleeve. Scale sharply: 3,000pc drops to S$0.20, 9,000pc to S$0.18, 15,000pc to S$0.18 (the curve flattens past 6k).",
          "Most café reorders land at 3,000–6,000 per cycle — monthly for a busy single outlet, weekly for a multi-outlet chain. For festival or event catering (one-off peak weekends) the 9,000–15,000 tier covers the weekend's volume in one run.",
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
};

await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, {
  method: 'PATCH', headers: H, body: JSON.stringify(extras),
});
console.log('[2/3] product_extras rewritten — h1/h1em set, copy says "cup sleeve"');

// ─── 3. FAQs ──────────────────────────────────────────────────────
await fetch(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}`, { method: 'DELETE', headers: H });
const faqs = [
  { question: "What exactly is the cup sleeve?", answer: "A 310gsm Art Card Coffee Cup Sleeve with Water Base Foam finish (heat isolation). 262mm × 50mm, 4C + 0C single-sided offset print — cool on the hand, hot in the cup." },
  { question: "What size is the cup sleeve?",    answer: "262mm × 50mm standard — industry size that fits most 12oz and 16oz takeaway cups. For boba cups or custom-sized drinkware, contact us for a separate quote." },
  { question: "Why the foam finishing?",         answer: "Water Base Foam creates a textured barrier layer between the sleeve and the hot cup — without it, a 90°C takeaway drink transfers heat to fingers within a minute. The foam keeps the grip comfortable the entire walk." },
  { question: "How much does it cost?",          answer: "From S$182.80 for 600 sleeves (minimum order). 1,500pc is S$375.10, 3,000pc is S$596.40, 6,000pc is S$1,122.70, 15,000pc is S$2,742.50. Per-sleeve cost drops from S$0.30 at minimum to ~S$0.18 at 15k+." },
  { question: "What's the minimum order?",       answer: "600 sleeves. Below that the offset plate setup cost dominates and the job isn't economical." },
  { question: "How long does production take?",  answer: "10 working days from approved digital proof. Offset plate setup, 4C + 0C print on 310gsm Art Card, foam finish application on the inside face, cut to 262mm × 50mm, score + perforate for clean rolling, pack flat for shipping." },
  { question: "What file format do you need?",   answer: "Print-ready PDF at 262mm × 50mm with 3mm bleed on all four sides, CMYK for body colour. Logo / key artwork should sit within the middle 180mm to avoid being cut off at the seam when the sleeve is rolled. Ask for our dieline template before designing — it marks the overlap zone." },
];
await fetch(`${BASE}/rest/v1/product_faqs`, {
  method: 'POST', headers: H,
  body: JSON.stringify(faqs.map((f, i) => ({ product_id: PID, question: f.question, answer: f.answer, display_order: i }))),
});
console.log(`[3/3] ${faqs.length} FAQs rewritten.`);

// ─── 4. Mega-menu label ───────────────────────────────────────────
await fetch(`${BASE}/rest/v1/mega_menu_items?product_slug=eq.${SLUG}`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ label: 'Cup Sleeve' }),
});
console.log('[4/4] mega_menu_items label → Cup Sleeve');

console.log('\n✓ Cup Sleeve rename complete.');
