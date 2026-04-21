// Paper Bag content rewrite + Nylon Rope handle step:
//   • 210gsm Art Card, 4C + 0C single-sided offset
//   • 10 sizes PB01-PB10 (dimensions TBC — admin to fill via UI)
//   • Matt or Gloss 1-side lamination, same price
//   • Optional 1-side Spot UV
//   • NEW: Nylon Rope handle colour (Gold / Blue / Red / Black / White /
//     Grey) — swatch with hex chips, no price impact
//   • Qty 100-10,000
//
// Order of configurator steps: size → lam_finish → spot_uv → rope → qty.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' };
const PID = 'f682c1d6-f6e7-4d36-afac-73b859ddb264';

// ─── 1. Stamp size-option note badges ────────────────────────────
// Admin should fill in real dimensions (W × H × D mm) — we just
// seed a placeholder so the badge field is visible and editable.

const [p] = await (await fetch(`${BASE}/rest/v1/products?id=eq.${PID}&select=pricing_table`, { headers: H })).json();
const pt = p.pricing_table;
const DEFAULT_NOTE = 'Add size (W × H × D mm)';
const nextSizeAxis = pt.axes.size.map((o) => ({ ...o, note: (o.note && o.note.trim()) ? o.note : DEFAULT_NOTE }));
const nextPt = { ...pt, axes: { ...pt.axes, size: nextSizeAxis } };
await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ pricing_table: nextPt }),
});
const cfg = await (await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.size&select=options`, { headers: H })).json();
const nextSizeOpts = (cfg[0]?.options ?? []).map((o) => ({ ...o, note: (o.note && o.note.trim()) ? o.note : DEFAULT_NOTE }));
await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.size`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ options: nextSizeOpts }),
});
console.log('[1/5] Size badge placeholder stamped on PB01-PB10.');

// ─── 2. Insert Nylon Rope step (if missing) before qty ───────────
const existing = await (await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.rope&select=id`,
  { headers: H },
)).json();
const ropeOptions = [
  { slug: 'gold',  label: 'Gold',  swatch: '#D2B177', note: 'Warm tan · premium retail' },
  { slug: 'blue',  label: 'Blue',  swatch: '#1C63B5', note: 'Royal blue · corporate tone' },
  { slug: 'red',   label: 'Red',   swatch: '#C21E2C', note: 'True red · festive / CNY' },
  { slug: 'black', label: 'Black', swatch: '#111111', note: 'Default · fashion / luxury' },
  { slug: 'white', label: 'White', swatch: '#FFFFFF', note: 'Clean · minimal / lifestyle' },
  { slug: 'grey',  label: 'Grey',  swatch: '#7F7F7F', note: 'Neutral · industrial / tech' },
];

if (existing.length === 0) {
  // Current order: size(0), lam_finish(1), spot_uv(2), qty(3). Bump qty
  // to 4 to make room for rope at 3.
  await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.qty`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ step_order: 4 }),
  });
  await fetch(`${BASE}/rest/v1/product_configurator`, {
    method: 'POST', headers: H,
    body: JSON.stringify([{
      product_id: PID,
      step_id: 'rope',
      step_order: 3,
      label: 'Nylon rope handle colour',
      type: 'swatch',
      required: true,
      options: ropeOptions,
      show_if: null,
      step_config: {},
    }]),
  });
  console.log('[2/5] Nylon rope step inserted (6 colours, no price impact).');
} else {
  // Refresh option list with latest swatches / labels.
  await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.rope`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ options: ropeOptions }),
  });
  console.log('[2/5] Nylon rope step already present — refreshed options.');
}

// ─── 3. products.tagline + description ───────────────────────────
const productUpdate = {
  tagline: 'Your brand carried through the mall by every customer',
  description:
    "Custom offset-printed paper bags on 210gsm Art Card, 4C + 0C single-sided. Ten standard sizes (PB01-PB10), 1-side Matt or Gloss lamination (same price, you pick), optional 1-side Spot UV highlight, nylon rope handles in six colours (Gold / Blue / Red / Black / White / Grey). Qty 100 to 10,000. From S$493.70 / 100 bags. 7 working days offset production.",
};
await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, { method:'PATCH', headers:H, body: JSON.stringify(productUpdate) });
console.log('[3/5] tagline + description updated.');

// ─── 4. product_extras (seo + intro + matcher + magazine) ────────
const extras = {
  seo_title: 'Paper Bag Printing Singapore | Custom Branded Bags with Nylon Handles',
  seo_desc:
    "Custom paper bag printing in Singapore — 210gsm Art Card, 4C + 0C offset, 10 sizes (PB01-PB10). Matt or Gloss lam, optional Spot UV, nylon rope handles in 6 colours. From S$493.70 / 100 bags.",
  seo_body: `Paper bag printing Singapore — custom retail and gift bags on 210gsm Art Card, 4C + 0C single-sided offset print. Ten standard size variants (PB01 through PB10). 1-side lamination with your choice of Matt or Gloss (same price on both). Optional 1-side Spot UV for glossy raised branding on the front face. **Nylon rope handles** in six colours: Gold, Blue, Red, Black, White, Grey. Runs from 100 to 10,000 bags. From S$493.70 / 100 bags on the smaller sizes. 7 working days offset production. Retail packaging, F&B takeaway branding, luxury gift bags, corporate event drops, festive hamper wrapping, fashion / lifestyle bag runs.`,
  intro: `A beautiful branded bag is the cheapest piece of outdoor advertising your brand will ever run — every customer who walks out with one is carrying your mark past a thousand passersby on the way home. We offset-print paper bags on **210gsm Art Card** (rigid, crease-clean, holds its shape full of product), **4C + 0C** single-sided, in **ten standard sizes PB01-PB10**. Pick your **lamination finish** — Matt for a soft premium hand-feel, Gloss for a high-sheen pop (both price the same). Add **Spot UV** for a glossy raised highlight over the logo. Choose the **nylon rope handle colour** — Gold, Blue, Red, Black, White, or Grey — to match your brand palette. Runs from **100 bags** (S$493.70 on smaller sizes) to **10,000**. **7 working days offset production.**`,
  matcher: {
    rows: [
      { need: "*Retail store* brand bags — smallest starter pack", pick_title: "PB01 · Matt Lam · Black rope · 100 bags", pick_detail: "S$493.70 · ~S$4.94/bag · default corporate look" },
      { need: "*Luxury retail* bag with gold-foil feel", pick_title: "PB08 · Gloss Lam + Spot UV · Gold rope · 500 bags", pick_detail: "S$1,050.80 · velvet premium hand-feel + raised UV + warm gold rope" },
      { need: "*F&B takeaway* bag — mid-size, high-visibility", pick_title: "PB06 · Gloss Lam · Red rope · 1,000 bags", pick_detail: "S$1,249.00 · ~S$1.25/bag · true-red rope pops at the counter" },
      { need: "*Corporate event* drop — navy brand tone", pick_title: "PB03 · Matt Lam · Blue rope · 2,000 bags", pick_detail: "S$2,610.00 · ~S$1.30/bag · royal-blue handles for corporate runs" },
      { need: "*High-volume retail* reorder — max standard", pick_title: "PB10 · Gloss Lam · White rope · 10,000 bags", pick_detail: "S$10,307.80 · ~S$1.03/bag · clean minimal finish" },
    ],
    title: "Tell us the run,\nwe'll tell you", kicker: "Quick guide", title_em: "the pick.",
    right_note_body: "210gsm Art Card · 4C + 0C single-sided offset · 1-side lamination standard · Spot UV optional · nylon rope handles (6 colours).",
    right_note_title: "One ladder, all the options.",
  },
  seo_magazine: {
    lede: "Paper bags are the highest-impact piece of packaging a retail brand ever prints per dollar — every customer carry is a billboard moment, and the bag survives the shopping trip to be reused as gift wrap or library bag. Five decisions shape whether the bag is kept or recycled.",
    title: "Everything worth knowing,", title_em: "before you print the run.",
    articles: [
      { num: "01", title: "Size — PB01 through PB10, pick by what goes inside.",
        body: [
          "Ten standard sizes in the PB ladder — from **PB01** (smallest, boutique / jewellery / single-item) through **PB10** (wide carrier, large garments, multi-item hampers). PB02 / PB03 are the everyday retail sizes for most clothing and homeware brands; PB04-PB06 suit mid-size apparel and F&B; PB07-PB10 cover wider and taller formats for bulky product carries.",
          "Dimensions sit on each size chip in the configurator — pick by the biggest item that needs to fit with a couple of centimetres of clearance. Bags too tight tear at the handle; bags too big look hollow when handed over. Need a size outside the PB ladder? Contact us for a custom die-cut quote.",
        ],
        side: { kind: 'stat', label: 'Standard sizes', num: '10', caption: 'PB01 → PB10 in one ladder' },
      },
      { num: "02", title: "Matt or Gloss — finish is feel, price stays flat.",
        body: [
          "**Matt Lamination** gives a velvet, soft-touch hand-feel on the front face — reads premium, catches fewer fingerprints, the default for luxury retail, fashion, and high-end gift runs. **Gloss Lamination** adds a high-sheen reflective finish — colour pops harder, works beautifully on photographic artwork, and is the classic pick for F&B branding where the bag should visually pop at the counter.",
          "Both price identically at every (size, Spot UV, qty) combo — matt vs gloss is a look decision, not a cost one. Whichever you pick, the lamination also protects the print from fingerprint smudges, rain, and general handling wear through the customer's journey home.",
        ],
        side: { kind: 'list', label: 'Finish by brand tone', rows: [
          { text: 'Matt Lam', time: 'Luxury retail · fashion · gift' },
          { text: 'Gloss Lam', time: 'F&B · retail · colour-rich art' },
        ]},
      },
      { num: "03", title: "Spot UV — the detail that signals premium.",
        body: [
          "**Spot UV** adds a glossy raised varnish over a selected element (usually the logo or decorative accent). Against the matte lamination base, the gloss catches the light as the bag moves — branding reads premium from across a checkout counter without shouting.",
          "The upcharge is noticeable at low qty (PB01 jumps from S$493.70 to S$791.80 at 100pc) but shrinks as the run scales (PB01 at 10,000 is S$7,526.80 plain vs S$9,452.50 with Spot UV — a ~25% premium). For luxury brand drops, premium retail launches, and gifting runs, Spot UV is the cheap-at-volume premium signal.",
        ],
        side: { kind: 'list', label: 'Spot UV upcharge (PB01)', rows: [
          { text: '100 bags',    time: '$493.70 → $791.80' },
          { text: '1,000 bags',  time: '$1,026.50 → $1,456.60' },
          { text: '10,000 bags', time: '$7,526.80 → $9,452.50' },
        ]},
      },
      { num: "04", title: "Nylon rope handles — six colours, no price change.",
        body: [
          "Paper bag handles are nylon rope — durable enough for a full shopping load, soft enough to sit comfortably in the hand without cutting into the palm. Six standard colours: **Gold** (warm tan, premium retail), **Blue** (royal, corporate), **Red** (true red, festive / CNY), **Black** (default for fashion / luxury), **White** (clean, minimal), **Grey** (neutral, industrial / tech brands).",
          "**Rope colour doesn't change the price** — it's a palette decision, not a cost one. Most runs match the rope to the dominant brand colour or the accent tone on the printed artwork. For corporate bags in a brand navy, blue rope. For festive CNY hampers, red rope. For luxury fashion, black or gold. Mixed colours in one run are available on request (minor pack-separation fee).",
        ],
        side: { kind: 'list', label: 'Rope colour by brand', rows: [
          { text: 'Gold',  time: 'Premium retail · luxury gift' },
          { text: 'Blue',  time: 'Corporate · finance · tech' },
          { text: 'Red',   time: 'Festive · CNY · F&B' },
          { text: 'Black', time: 'Fashion · streetwear · default' },
          { text: 'White', time: 'Minimal · lifestyle · wellness' },
          { text: 'Grey',  time: 'Industrial · tech · neutral' },
        ]},
      },
      { num: "05", title: "Qty — 100 minimum, 10,000 sweet spot for bulk.",
        body: [
          "Offset setup means the **minimum run is 100 bags**. At 100pc, S$493.70 on the smallest size — roughly S$4.94 per bag. Scale sharply: 1,000pc drops to S$1.03/bag, 5,000pc to S$0.79/bag, 10,000pc to S$0.75/bag on PB01. Per-piece cost flattens after 5k — larger runs still bring marginal savings but the curve is less steep.",
          "**10,000 is the top of the standard ladder.** Above that we quote separately — larger runs can share a plate or run continuous if the finish allows. For retail chain reorders, property launches, or event series, tell us the target and we'll quote the most cost-efficient route.",
        ],
        side: { kind: 'list', label: 'Qty · PB01 Matt · Black rope', rows: [
          { text: '100 bags',    time: '$493.70 · $4.94/bag' },
          { text: '500 bags',    time: '$699.00 · $1.40/bag' },
          { text: '1,000 bags',  time: '$1,026.50 · $1.03/bag' },
          { text: '5,000 bags',  time: '$3,968.80 · $0.79/bag' },
          { text: '10,000 bags', time: '$7,526.80 · $0.75/bag' },
        ]},
      },
    ],
  },
};
await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, { method:'PATCH', headers:H, body: JSON.stringify(extras) });
console.log('[4/5] extras updated (seo, intro, matcher, magazine).');

// ─── 5. FAQs ─────────────────────────────────────────────────────
const faqs = [
  { question: "What sizes do you offer?", answer: "Ten standard sizes in the PB ladder — PB01 (smallest) through PB10 (largest). Pick by the item going inside: PB01-PB03 for boutique / small retail, PB04-PB06 for everyday retail and F&B, PB07-PB10 for larger garments, hampers, and multi-item carries. Custom sizes available by separate quote." },
  { question: "Matt or Gloss lamination — which to pick?", answer: "Matt for luxury retail, fashion, and gift runs — soft velvet hand-feel, catches fewer fingerprints, reads premium. Gloss for F&B, colour-rich artwork, and bags that should pop visually at the counter. Both price identically at every combo — it's a look decision, not a cost one." },
  { question: "What does Spot UV do?", answer: "Adds a glossy raised varnish over a selected element (usually the logo or an accent). Against the matt / gloss lamination base, the UV catches the light as the bag moves — reads premium from across a checkout counter. Moderate upcharge at low qty; shrinks to ~25% premium at 10k runs." },
  { question: "What nylon rope handle colours do you offer?", answer: "Six colours: Gold (warm tan, premium retail), Blue (royal, corporate), Red (true red, festive / CNY), Black (default for fashion / luxury), White (clean, minimal), Grey (neutral, industrial / tech). Rope colour doesn't change the price — pick by your brand palette. Mixed colours across a single run available on request (minor pack-separation fee)." },
  { question: "How much does custom paper bag printing cost?", answer: "From S$493.70 for 100 bags on the smallest size (PB01, Matt lam). 1,000pc PB01 is S$1,026.50 (~S$1.03/bag). Larger sizes run higher: PB04 / PB05 at 100pc is S$855.40. With Spot UV: PB01 at 100pc is S$791.80. Use the configurator for an exact quote on your (size × lamination × Spot UV × qty) combo." },
  { question: "What's the minimum and maximum?", answer: "Minimum 100 bags — offset plate setup means smaller runs don't make economic sense. Maximum 10,000 bags in the standard ladder. For 10k+ contact us for a custom quote (retail chain reorders, property launches, event series)." },
  { question: "How long does production take?", answer: "7 working days from approved digital proof. Offset plate setup, 4C + 0C print on 210gsm Art Card, lamination (Matt or Gloss), optional Spot UV (adds 1-2 days), die-cut, fold, glue, nylon rope handle insertion. Bags ship assembled and ready to use." },
  { question: "What file format do you need?", answer: "Print-ready PDF at the unfolded dieline shape, 3mm bleed outside the cut line, CMYK for body colour, fonts embedded. For Spot UV: a separate vector layer named \"SpotUV\" in 100% black marking the glossy areas. Ask us for the dieline template for your chosen PB size before designing." },
];
await fetch(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}`, { method:'DELETE', headers:H });
await fetch(`${BASE}/rest/v1/product_faqs`, {
  method:'POST', headers:H,
  body: JSON.stringify(faqs.map((f,i) => ({ product_id: PID, question: f.question, answer: f.answer, display_order: i }))),
});
console.log(`[5/5] ${faqs.length} FAQs replaced.`);
