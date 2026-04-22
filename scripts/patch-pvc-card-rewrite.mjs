// PVC Card — rewrite pricing + configurator + page content to match
// the new, simpler spec:
//
//   Material : PVC Card (credit-card format, 760 microns)
//   Sides    : Single or Double Sided — same price
//   Qty tiers: 1 → $20, 5 → $50 ($10/ea), 10 → $50 ($5/ea), 50 → $150 ($3/ea)
//   No finishes, no lanyard add-on, no reader-tech integration.
//
// Patches: products.tagline, products.pricing_table, product_configurator
// (full rebuild), product_extras, product_faqs (full rebuild).

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
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

const PID = '8abf80c1-8d73-47a7-b547-be1c4b6d576a';

// -----------------------------------------------------------------------------
// 1. pricing_table: material × qty, default mode (total-at-tier)
// -----------------------------------------------------------------------------
const MATERIAL = [
  { slug: 'pvc', label: 'PVC Card', note: 'Credit-card format, 760µm' },
];

const QTY_TIERS = [1, 5, 10, 50];
const PRICES_BY_TIER = {
  1:  2000,   //  1 × $20  = $20
  5:  5000,   //  5 × $10  = $50
  10: 5000,   // 10 × $5   = $50
  50: 15000,  // 50 × $3   = $150
};

const prices = {};
for (const t of QTY_TIERS) prices[`pvc:${t}`] = PRICES_BY_TIER[t];

const pricingTable = {
  axes: { material: MATERIAL },
  axis_order: ['material'],
  qty_tiers: QTY_TIERS,
  prices, // default mode — total for the tier
};

// -----------------------------------------------------------------------------
// 2. products row — tagline + pricing_table
// -----------------------------------------------------------------------------
const TAGLINE = 'Credit-card format PVC — from $20 for one, $3/card at 50';

const prodRes = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({
    tagline: TAGLINE,
    pricing_table: pricingTable,
  }),
});
if (!prodRes.ok) throw new Error(`PATCH products: ${prodRes.status} ${await prodRes.text()}`);
console.log('✓ products row patched (tagline + pricing_table)');

// -----------------------------------------------------------------------------
// 3. product_configurator — full rebuild
//    material (swatch) — PVC Card (single option, decorative)
//    sides    (swatch) — Single / Double, no price impact
//    qty      (qty)    — tier-locked, presets 1/5/10/50
// -----------------------------------------------------------------------------
const delCfg = await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}`, {
  method: 'DELETE',
  headers: H,
});
if (!delCfg.ok) throw new Error(`DELETE configurator: ${delCfg.status} ${await delCfg.text()}`);
console.log('✓ configurator cleared');

const steps = [
  {
    product_id: PID,
    step_id: 'material',
    step_order: 0,
    label: 'Card Material',
    type: 'swatch',
    required: true,
    options: MATERIAL.map((m) => ({ slug: m.slug, label: m.label, note: m.note })),
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'sides',
    step_order: 1,
    label: 'Single or Double Sided',
    type: 'swatch',
    required: true,
    options: [
      { slug: 'single', label: 'Single Sided', note: 'Same price as double' },
      { slug: 'double', label: 'Double Sided', note: 'Same price as single' },
    ],
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'qty',
    step_order: 2,
    label: 'Quantity',
    type: 'qty',
    required: true,
    options: [],
    show_if: null,
    step_config: {
      min: 1,
      step: 1,
      presets: [1, 5, 10, 50],
      note: 'Price jumps at 5, 10, and 50 cards — calculator snaps your quantity to the nearest tier and shows what you pay and receive.',
    },
  },
];

const insCfg = await fetch(`${BASE}/rest/v1/product_configurator`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify(steps),
});
if (!insCfg.ok) throw new Error(`INSERT configurator: ${insCfg.status} ${await insCfg.text()}`);
console.log(`✓ configurator rebuilt with ${steps.length} steps`);

// -----------------------------------------------------------------------------
// 4. product_extras — rewrite page content around the new pricing scheme
// -----------------------------------------------------------------------------
const EXTRAS = {
  seo_title: 'PVC Card Printing Singapore | From $20 for One Card',
  seo_desc: 'PVC card printing in Singapore — credit-card format, 760µm, single or double sided at the same price. $20 for one, $50 for five, $50 for ten, $150 for fifty.',
  hero_big: 'PVC CARDS',
  h1: 'PVC Card Printing Singapore',
  h1em: 'Cards That Go the Distance.',
  intro: 'Bank-card quality PVC at 760 microns — the same thickness as the card in your wallet. Full-colour print, single or double sided at the same price, ready in 1 working day. Start at one card for $20 and scale down to $3 per card at fifty pieces. No lamination menu, no reader-tech integration, no upsell maze — just the print, on proper stock, priced by quantity.',
  seo_body: 'PVC card printing Singapore — 760-micron CR80 credit-card standard, full-colour single or double sided at the same price, tier pricing from $20 for 1 card to $3/card at 50. Membership, loyalty, ID, gift, and staff cards.',
  chooser: null,
  seo_magazine: {
    lede: 'A PVC card\'s only job is to survive the wallet — every knock, every fold, every three-year heat-and-sweat cycle. Stick to 760-micron stock, print full colour both sides if you need it, and order the quantity you\'ll actually use. That\'s the whole decision. No finish menu, no chip integration, no minimum run you\'ll regret. One price grid, four quantity breakpoints.',
    title: 'Everything worth knowing,',
    title_em: 'before you order.',
    issue_label: 'Issue №01 · PVC Card',
    articles: [
      {
        num: '01',
        title: 'Why 760 microns is the thickness you actually want.',
        body: [
          '**760 microns** (0.76mm) is the **ISO/IEC CR80** card standard — the exact thickness of every bank card, driver\'s licence, and building access card issued in SG. Hit that spec and the card fits every wallet slot, feels right between finger and thumb, sits next to a real ID without looking cheap.',
          'We run 760µm across every card we print here. The stock is fused from multiple PVC layers under heat and pressure — it doesn\'t delaminate, doesn\'t bow, doesn\'t warp. Thinner cards exist elsewhere for short-term throwaway use; we don\'t stock them. The cost difference isn\'t worth the trade in perceived quality when the card is going in someone\'s wallet for three years.',
        ],
        side: {
          kind: 'stat',
          num: '760µm',
          label: 'Thickness',
          caption: 'ISO/IEC CR80 — bank-card standard',
        },
      },
      {
        num: '02',
        title: 'Single or double sided — same price, pick by the design.',
        body: [
          'Every other PVC card printer charges more for double sided. We don\'t. Whether you put information on one face or both, the price per card stays the same — $20 for one, down to $3 each at fifty. Price is driven by quantity, not by how much you use the surface.',
          'That frees up the design. Put your logo and brand front, put the member number, barcode, or terms on the back. Or keep it single sided for maximum punch on one face. The choice is a layout decision, not a budget one.',
        ],
        side: {
          kind: 'pills',
          label: 'Typical layouts',
          items: [
            { pop: true, text: 'Logo front / number back' },
            { text: 'Photo ID both sides' },
            { text: 'Brand front / T&Cs back' },
            { text: 'Single-side punch' },
          ],
        },
      },
      {
        num: '03',
        title: 'The price ladder — one card to fifty, the breakpoints that matter.',
        body: [
          'Pricing steps at four points: **$20 for one card**, **$50 for five**, **$50 for ten**, **$150 for fifty**. Ten cards cost the same total as five — because at ten pieces the per-card rate drops from $10 to $5, so the tier totals meet. If you need six, seven, eight or nine cards, order ten: you pay the same $50 and get more cards out of it.',
          'Between tiers the calculator snaps to the nearest tier on the way down. Ask for seven and the calculator shows five cards for $50 — you pay for five, you receive five. Ask for thirty-five and the calculator shows ten cards for $50. To receive the higher quantity, step up to the next tier.',
        ],
        side: {
          kind: 'list',
          label: 'Tier prices',
          rows: [
            { text: '1 card', time: '$20' },
            { text: '5 cards', time: '$50' },
            { text: '10 cards', time: '$50' },
            { text: '50 cards', time: '$150' },
          ],
        },
      },
      {
        num: '04',
        title: 'What it\'s for — and where the simple pricing fits.',
        body: [
          'PVC cards work for most non-technical use cases where the card lives in a wallet: **membership and loyalty** for cafés, gyms, salons, clinics; **gift cards** sold over the counter; **staff ID and visitor passes** at small offices and studios; **event credentials** where the card is a souvenir as much as an access token.',
          'For anything needing a magnetic stripe, embedded chip, RFID, or numbered sequential personalisation across the batch, send us a WhatsApp — that\'s a custom quote, not the tier menu on this page. For everything else, the four tiers above are the whole price list.',
        ],
        side: {
          kind: 'pills',
          label: 'Good fits',
          items: [
            { pop: true, text: 'Loyalty / membership' },
            { text: 'Gift cards' },
            { text: 'Staff ID (non-access)' },
            { text: 'Event / souvenir passes' },
          ],
        },
      },
    ],
  },
  how_we_print: null,
  matcher: {
    kicker: 'Quick guide',
    title: 'Tell us the use,\nwe\'ll tell you',
    title_em: 'the pick.',
    rows: [
      {
        need: 'Just *one sample card* to check the feel and design',
        pick_title: 'PVC Card, 1 piece',
        pick_detail: '$20 total · 1 working day · print one, pick up, evaluate',
      },
      {
        need: 'Small batch for a *pop-up or first members*',
        pick_title: 'PVC Card, 10 pieces',
        pick_detail: '$50 total · $5/card · same price as ordering five — grab ten',
      },
      {
        need: '*Fifty members* for a café or studio rollout',
        pick_title: 'PVC Card, 50 pieces',
        pick_detail: '$150 total · $3/card · the real per-card price for a proper rollout',
      },
      {
        need: 'Team of *five* and each card has a different name',
        pick_title: 'PVC Card, 5 pieces',
        pick_detail: '$50 total · different design per card · send us the print-ready art',
      },
      {
        need: 'Not sure how many you need',
        pick_title: 'Start at 10 for $50',
        pick_detail: 'Same price as 5, more units for testing — $5/card for ten pieces',
      },
    ],
    right_note_title: 'One grid, four breakpoints.',
    right_note_body: 'No finish menu, no lanyard upsell, no reader-tech setup — just the print, priced by quantity.',
  },
};

const extrasRes = await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify(EXTRAS),
});
if (!extrasRes.ok) throw new Error(`PATCH extras: ${extrasRes.status} ${await extrasRes.text()}`);
console.log('✓ product_extras rewritten');

// -----------------------------------------------------------------------------
// 5. product_faqs — full rebuild
// -----------------------------------------------------------------------------
const delFaq = await fetch(`${BASE}/rest/v1/product_faqs?product_id=eq.${PID}`, {
  method: 'DELETE',
  headers: H,
});
if (!delFaq.ok) throw new Error(`DELETE faqs: ${delFaq.status} ${await delFaq.text()}`);

const FAQS = [
  {
    product_id: PID,
    display_order: 0,
    question: 'Is single sided really the same price as double sided?',
    answer: 'Yes. Our price is driven by the quantity, not by how much of the card you use. One side or both sides — same total. Pick based on your design, not your budget.',
  },
  {
    product_id: PID,
    display_order: 1,
    question: 'Why does ten cards cost the same as five ($50)?',
    answer: 'Because the per-card rate drops at the ten-piece tier. Five cards at $10 each = $50; ten cards at $5 each = $50. It\'s the same total, you just get twice as many cards. If you\'re ordering five, step up to ten — there\'s no reason not to.',
  },
  {
    product_id: PID,
    display_order: 2,
    question: 'What if I want seven or twenty cards?',
    answer: 'The calculator snaps down to the nearest tier. Ask for seven cards and it shows five cards for $50 — you pay for five, you receive five. Ask for twenty and it shows ten cards for $50. To receive the exact higher quantity you asked for, step up to the next tier (50).',
  },
  {
    product_id: PID,
    display_order: 3,
    question: 'How thick are the cards?',
    answer: '760 microns (0.76mm) — the ISO/IEC CR80 standard. Same as your bank card, your driver\'s licence, every building access card in SG. Fits every wallet slot and sits next to a real ID without feeling cheap.',
  },
  {
    product_id: PID,
    display_order: 4,
    question: 'Are the colours accurate on PVC?',
    answer: 'Yes — we print full-colour CMYK at 300 DPI on white PVC with a coating that holds the ink. Send artwork as CMYK PDF or high-resolution AI with fonts outlined. If you need a colour match to a brand Pantone, flag it on the order and we\'ll proof the batch before running all of it.',
  },
  {
    product_id: PID,
    display_order: 5,
    question: 'Can I add a magnetic stripe, chip, or RFID?',
    answer: 'Those are custom-quote jobs — send us a WhatsApp with the reader model and the use case. The four tiers on this page are for standard print-only PVC cards, which cover most membership, loyalty, gift, and visitor-pass needs.',
  },
  {
    product_id: PID,
    display_order: 6,
    question: 'Can each card have a different name or number?',
    answer: 'Yes — send us a numbered list and print-ready artwork with a clear placeholder, and we\'ll print each card individually. No extra charge per design variant within the same tier.',
  },
  {
    product_id: PID,
    display_order: 7,
    question: 'How long does it take?',
    answer: '1 working day for any tier from 1 to 50 cards. Collect from Paya Lebar Square or choose delivery at checkout.',
  },
];

const insFaq = await fetch(`${BASE}/rest/v1/product_faqs`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify(FAQS),
});
if (!insFaq.ok) throw new Error(`INSERT faqs: ${insFaq.status} ${await insFaq.text()}`);
console.log(`✓ faqs rebuilt — ${FAQS.length} entries`);

// -----------------------------------------------------------------------------
// 6. Spot-check
// -----------------------------------------------------------------------------
console.log('\nSpot-check (total at each tier):');
for (const t of QTY_TIERS) {
  const cents = prices[`pvc:${t}`];
  console.log(`  pvc:${String(t).padStart(3)} → $${(cents / 100).toFixed(2)} total · $${(cents / t / 100).toFixed(2)}/card`);
}
console.log('  min across table →', `$${Math.min(...Object.values(prices)) / 100}`);
