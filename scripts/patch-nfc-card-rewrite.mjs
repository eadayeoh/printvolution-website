// NFC Card — rewrite pricing + configurator + page content to match
// the new, simpler spec:
//
//   Colour: Metallic Matt Gold / Silver / Black / White
//   Sides : Single Sided ($28) or Double Sided (+$5 → $33)
//   No quantity discounts. Per-card pricing, order any qty.
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

const PID = '444f02d3-e905-435f-a03e-88ff4c94b4f5';

// -----------------------------------------------------------------------------
// 1. pricing_table: colour × sides × qty=1, per_unit_at_tier_rate mode
// -----------------------------------------------------------------------------
const COLORS = [
  { slug: 'metallic_matt_gold',   label: 'Metallic Matt Gold',   swatch: '#B08A3A', note: 'Warm metallic' },
  { slug: 'metallic_matt_silver', label: 'Metallic Matt Silver', swatch: '#A8A8A8', note: 'Cool metallic' },
  { slug: 'metallic_matt_black',  label: 'Metallic Matt Black',  swatch: '#111111', note: 'Stealth dark' },
  { slug: 'white',                label: 'White',                swatch: '#F3F3F3', note: 'Classic white' },
];
const SIDES = [
  { slug: 'single', label: 'Single Sided', note: 'Tap side only' },
  { slug: 'double', label: 'Double Sided', note: '+$5 · brand on front, tap on back' },
];
const PRICE_SINGLE_CENTS = 2800;
const PRICE_DOUBLE_CENTS = 3300;

const prices = {};
for (const c of COLORS) {
  prices[`${c.slug}:single:1`] = PRICE_SINGLE_CENTS;
  prices[`${c.slug}:double:1`] = PRICE_DOUBLE_CENTS;
}

const pricingTable = {
  axes: {
    color: COLORS.map((c) => ({ slug: c.slug, label: c.label, swatch: c.swatch, note: c.note })),
    sides: SIDES.map((s) => ({ slug: s.slug, label: s.label, note: s.note })),
  },
  axis_order: ['color', 'sides'],
  qty_tiers: [1],
  qty_mode: 'per_unit_at_tier_rate',
  prices,
};

// -----------------------------------------------------------------------------
// 2. products row — tagline + pricing_table
// -----------------------------------------------------------------------------
const TAGLINE = 'Metallic tap cards — $28 single, $33 double sided';

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
// 3. product_configurator — full rebuild. Steps:
//    color  (swatch)  — 4 metallic options, required
//    sides  (swatch)  — Single / Double, required
//    url    (text)    — destination URL, required
//    qty    (qty)     — per-piece, min 1, presets 1/5/10/25
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
    step_id: 'color',
    step_order: 0,
    label: 'Card Colour',
    type: 'swatch',
    required: true,
    options: COLORS.map((c) => ({ slug: c.slug, label: c.label, swatch: c.swatch, note: c.note })),
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
    options: SIDES.map((s) => ({ slug: s.slug, label: s.label, note: s.note })),
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'url',
    step_order: 2,
    label: 'Your URL / Link to share',
    type: 'text',
    required: true,
    options: [],
    show_if: null,
    step_config: { note: 'Any link — LinkedIn, portfolio, Calendly, Linktree. You can change this later by swapping the destination of your own link.' },
  },
  {
    product_id: PID,
    step_id: 'qty',
    step_order: 3,
    label: 'Quantity',
    type: 'qty',
    required: true,
    options: [],
    show_if: null,
    step_config: { min: 1, step: 1, presets: [1, 5, 10, 25] },
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
  seo_title: 'NFC Business Card Singapore | Metallic Tap Cards from $28',
  seo_desc: 'Metallic matt NFC business cards in Singapore. Gold, silver, black or white. $28 single-sided, $33 double-sided. Flat per-card pricing, chip encoded and tested before delivery.',
  hero_big: 'NFC CARDS',
  h1: 'NFC Business Cards Singapore',
  h1em: 'One Tap. Every Detail.',
  intro: 'Metallic matt NFC cards — four colours, single or double sided, one flat price per card. A tap on any modern phone opens the URL you nominate: LinkedIn, portfolio, Calendly, a landing page, whatever you point it at. Change where the link goes later and the card keeps working — you never reprint to update your details. Chip encoded and tap-tested on both iPhone and Android before it leaves the workshop.',
  seo_body: 'NFC business card printing Singapore — metallic matt gold, silver, black, or white. Single sided $28, double sided $33, no volume discount. Chip writes URL / vCard / Calendly link, encoded and tested on iPhone + Android before delivery.',
  chooser: null,
  seo_magazine: {
    lede: 'Metallic NFC cards look premium on camera and tap cleanly in real life — but only when the chip, the coil, and the top coat are spec\'d together. Four things decide whether the card works three years from now: the colour of the finish (metallic matt doesn\'t shield the antenna the way heavy foil does), whether it\'s single or double sided, the link you encode, and the testing before it leaves the workshop.',
    title: 'Everything worth knowing,',
    title_em: 'before it leaves your pocket.',
    issue_label: 'Issue №01 · NFC Card',
    articles: [
      {
        num: '01',
        title: 'Metallic matt over the coil — why it still taps clean.',
        body: [
          'The NFC antenna is a flat copper coil spiralling inside the card. Heavy foil across the coil shields the signal and kills the tap; **metallic matt pigment** does not. The matt coating carries metallic particles in a thin film — the card reads gold, silver, or black on camera, but the chip still talks to the phone at full range. All four finishes (matt gold, matt silver, matt black, white) are safe over the coil.',
          'That\'s why we stick to metallic matt rather than stamped foil for the tap face. You get the premium look without the engineering compromise, and every card reads at the full 4 cm range on both iPhone and Android.',
        ],
        side: {
          kind: 'pills',
          label: 'Colour options',
          items: [
            { pop: true, text: 'Metallic Matt Gold' },
            { text: 'Metallic Matt Silver' },
            { text: 'Metallic Matt Black' },
            { text: 'White' },
          ],
        },
      },
      {
        num: '02',
        title: 'Single or double sided — pick by how you hand the card over.',
        body: [
          '**Single sided** puts everything on one face: your name, the tap target, any QR backup. Cleanest when the card is slipped into a wallet slot the tap face up. **Double sided** (+$5) puts your brand or photo on the front and keeps the tap face on the back, so the card looks the same either way it\'s pulled out.',
          'The chip reads through both sides of the card equally — sidedness is a design choice, not a technical one. If you\'re ordering for a sales team, double sided lets everyone share matching fronts with personal tap targets on the reverse.',
        ],
        side: {
          kind: 'list',
          label: 'When to pick which',
          rows: [
            { text: 'Networking / 1-to-1', time: 'Single' },
            { text: 'Team / matching front', time: 'Double' },
            { text: 'Event giveaway', time: 'Single' },
            { text: 'Agent / property', time: 'Double' },
          ],
        },
      },
      {
        num: '03',
        title: 'What the chip actually stores — and why it\'s reprogrammable.',
        body: [
          'Your card stores one payload. The most common is a **URL** — tap opens your LinkedIn, portfolio, Calendly, or a simple landing page. Hosted behind a link you own (even a free Linktree), you change the destination later without touching the card. A **vCard (VCF)** dumps name + phone + email directly into the recipient\'s contacts — useful, but baked in at encoding time, so update-after-delivery is not possible.',
          'For flexibility, we encode URLs by default. Tell us at checkout if you need a vCard or wifi payload instead. One card, one payload, NDEF-formatted so iOS and Android read it the same way.',
        ],
        side: {
          kind: 'pills',
          label: 'Payload options',
          items: [
            { pop: true, text: 'URL / redirect' },
            { text: 'vCard (VCF)' },
            { text: 'Wifi (SSID+PW)' },
          ],
        },
      },
      {
        num: '04',
        title: 'Tested on iPhone + Android before we hand it over.',
        body: [
          'Every card gets tapped on both an iPhone and an Android reference device from three angles before it ships. Any card that reads inconsistently goes back for rework. The graphic is positioned so the phone\'s antenna aligns with the coil, not the card edge where reception is weakest.',
          'Flat per-card pricing — $28 single sided, $33 double sided, any of the four colours, any quantity from one upward. No volume commitment, no minimum run, no hidden setup fee. Ready in 1 working day.',
        ],
        side: {
          kind: 'stat',
          num: '<4cm',
          label: 'Read distance',
          caption: 'tested on iPhone + Android',
        },
      },
    ],
  },
  how_we_print: null,
  matcher: {
    kicker: 'Quick guide',
    title: 'Tell us the job,\nwe\'ll tell you',
    title_em: 'the pick.',
    rows: [
      {
        need: 'Meeting clients *this week* and want a tap-ready card',
        pick_title: 'White, Single Sided, URL',
        pick_detail: '$28/card · 1 working day · encoded and tested before delivery',
      },
      {
        need: 'Sales team — matching front, personal link on the back',
        pick_title: 'Metallic Matt Black, Double Sided, URL',
        pick_detail: '$33/card · order one per person · each encoded individually',
      },
      {
        need: 'You want the card to *feel premium* when it taps',
        pick_title: 'Metallic Matt Gold, Double Sided, URL',
        pick_detail: '$33/card · metallic matt pigment, not foil · reads clean over the coil',
      },
      {
        need: 'Event booth — tap opens *wifi or booking page* instantly',
        pick_title: 'Metallic Matt Silver, Single Sided, wifi',
        pick_detail: '$28/card · guests tap and connect · no app install needed',
      },
      {
        need: 'Trying the idea out, just *one or two cards* to start',
        pick_title: 'Any colour, Single Sided',
        pick_detail: '$28/card · order any quantity from 1 up · no volume minimum',
      },
    ],
    right_note_title: 'Encoded before it ships.',
    right_note_body: 'We program your link, test every card on-site, send it working.',
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
    question: 'How does an NFC business card work?',
    answer: 'The card has a chip inside. Hold it against the back of an NFC-enabled phone and the phone opens whatever link you asked us to program — LinkedIn, portfolio, a booking page, anything. No app. No QR scan. Works on any iPhone from the 7 onwards and every recent Android.',
  },
  {
    product_id: PID,
    display_order: 1,
    question: 'Does the recipient need to install anything?',
    answer: 'No. NFC tap is built into the phone\'s operating system. They tap, the browser opens, that\'s it.',
  },
  {
    product_id: PID,
    display_order: 2,
    question: 'Can I change the link later without reprinting?',
    answer: 'Yes — if you host the destination behind a link you own (a free Linktree, Bitly, or your own redirect URL). You change where that link points, and the card keeps taking the new visitor to the right place. If you\'re using a raw direct URL we encoded, that one is baked in, so we recommend routing through a redirect you control.',
  },
  {
    product_id: PID,
    display_order: 3,
    question: 'What\'s the difference between the four colours?',
    answer: 'They\'re all metallic matt — a pigment finish that reads premium on camera without using foil over the chip (foil would kill the tap). Gold is warm, silver is cool and corporate, black is stealth/dark mode, white is clean and classic. Pick by brand colour; the chip reads at full range on all four.',
  },
  {
    product_id: PID,
    display_order: 4,
    question: 'Should I get single or double sided?',
    answer: 'Single sided is cleanest for solo use — one face carries everything. Double sided ($5 more per card) is for when you want brand or a photo on the front and the tap details on the back — useful for sales teams, property agents, and anyone handing the card over at matching events.',
  },
  {
    product_id: PID,
    display_order: 5,
    question: 'Is there a minimum quantity? Any bulk discount?',
    answer: 'No minimum — order one card if that\'s what you need. No bulk discount either: every card is individually encoded and tested, so the price stays flat at $28 single sided or $33 double sided regardless of quantity.',
  },
  {
    product_id: PID,
    display_order: 6,
    question: 'How long does it take?',
    answer: '1 working day for standard orders. We encode your link, tap-test every card on both an iPhone and an Android before it leaves us, and deliver or let you collect from Paya Lebar Square.',
  },
  {
    product_id: PID,
    display_order: 7,
    question: 'Can I put wifi or a vCard on the chip instead of a link?',
    answer: 'Yes. Mention it at checkout — we can program a wifi credential (SSID + password, phone auto-joins on tap) or a vCard (dumps your details straight into the contact app). One payload per card. URL is the default because it\'s the most flexible.',
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
console.log('\nSpot-check:');
console.log('  white:single:1         →', `$${prices['white:single:1'] / 100}`);
console.log('  metallic_matt_gold:double:1 →', `$${prices['metallic_matt_gold:double:1'] / 100}`);
console.log('  (min across table)     →', `$${Math.min(...Object.values(prices)) / 100}`);
