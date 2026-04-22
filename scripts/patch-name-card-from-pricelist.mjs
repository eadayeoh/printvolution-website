// Name Card — switch from formula-driven pricing to a pricing_table
// built from pvpricelist-snapshot.json (rates.namecards), using only
// the first 5 digital materials. Finishings match image 2: lam, rnd,
// hot, suv, die — each Yes/No.
//
// Rules (from user):
//   • Quantity is total boxes (left-column of admin sheet).
//   • Material is the axis group (top of admin sheet).
//   • LPO is ignored.
//   • Each order is quoted per name — name-mixing is NOT allowed.
//     ⇒ No names axis, single name per order.
//
// Lead time: 1 working day (Digital method).
// Leaves h1 + h1em untouched per the rewrite rule. Surgical: only
// products row, configurator, extras, faqs.

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

const PID = 'e6e1d3ae-b7a9-46c9-b97b-adde24b565fc';
const PRICELIST = JSON.parse(fs.readFileSync('scripts/pvpricelist-snapshot.json', 'utf8'));
const NC = PRICELIST.rates.namecards;

// -----------------------------------------------------------------------------
// 1. Axis definitions
// -----------------------------------------------------------------------------
const QTY_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const MATERIALS = [
  { slug: 'basic',   rate_key: 'dig_basic',   label: 'Basic — 250GSM Art Card',     note: 'Standard weight · most popular' },
  { slug: 'basicp',  rate_key: 'dig_basicp',  label: 'Basic+ — 300GSM Art Card',    note: 'Heavier · reads more premium' },
  { slug: 'rj250',   rate_key: 'dig_rj250',   label: 'Premium RJ 250–299GSM',       note: '200GSM Tangerine White' },
  { slug: 'rj300',   rate_key: 'dig_rj300',   label: 'Premium RJ 300–349GSM',       note: '300GSM Maple Bright / White' },
  { slug: 'rj350',   rate_key: 'dig_rj350',   label: 'Premium RJ 350–400GSM',       note: '350GSM Grandeur / Shiruku' },
];

const YESNO = [
  { slug: 'no',  label: 'No' },
  { slug: 'yes', label: 'Yes' },
];

// Map admin-sheet labels for each finishing axis
const FINISHINGS = [
  { axis: 'lam', label: 'Lamination',      fin_key: 'lam' },
  { axis: 'rnd', label: 'Rounded Corners', fin_key: 'rnd' },
  { axis: 'hot', label: 'Hotstamp',        fin_key: 'hot' },
  { axis: 'suv', label: 'Spot UV',         fin_key: 'suv' },
  { axis: 'die', label: 'Die Cut',         fin_key: 'die' },
];

// -----------------------------------------------------------------------------
// 2. Build pricing_table — all combos material × lam × rnd × hot × suv × die
//    Value at each (material, lam, rnd, hot, suv, die, qty) =
//      boxes × per-box rate for that (material, qty)
//      + sum(NC_FIN[fin][qty] for each finishing set to 'yes')
// -----------------------------------------------------------------------------
function perBoxRate(material, qty) {
  const row = NC.NC_DIG[material.rate_key].find((r) => r[0] === qty);
  if (!row) throw new Error(`No NC_DIG entry for ${material.rate_key}:${qty}`);
  return row[1];
}
function finSurcharge(fin, qty) {
  const row = NC.NC_FIN[fin.fin_key].find((r) => r[0] === qty);
  if (!row) throw new Error(`No NC_FIN entry for ${fin.fin_key}:${qty}`);
  return row[1];
}

const axisOrder = ['material', 'lam', 'rnd', 'hot', 'suv', 'die'];
const prices = {};
let comboCount = 0;

for (const m of MATERIALS) {
  for (const lam of YESNO) {
    for (const rnd of YESNO) {
      for (const hot of YESNO) {
        for (const suv of YESNO) {
          for (const die of YESNO) {
            for (const boxes of QTY_TIERS) {
              const base = boxes * perBoxRate(m, boxes);
              let surcharge = 0;
              const finState = { lam, rnd, hot, suv, die };
              for (const f of FINISHINGS) {
                if (finState[f.axis].slug === 'yes') {
                  surcharge += finSurcharge(f, boxes);
                }
              }
              const totalDollars = base + surcharge;
              const key = `${m.slug}:${lam.slug}:${rnd.slug}:${hot.slug}:${suv.slug}:${die.slug}:${boxes}`;
              prices[key] = Math.round(totalDollars * 100); // cents
              comboCount++;
            }
          }
        }
      }
    }
  }
}

const pricingTable = {
  axes: {
    material: MATERIALS.map((m) => ({ slug: m.slug, label: m.label, note: m.note })),
    lam: YESNO,
    rnd: YESNO,
    hot: YESNO,
    suv: YESNO,
    die: YESNO,
  },
  axis_order: axisOrder,
  qty_tiers: QTY_TIERS,
  prices, // default mode — total per combo+tier
};

console.log(`Built ${comboCount} price entries (5 materials × 2^5 finishings × 10 box tiers).`);

// -----------------------------------------------------------------------------
// 3. products row — tagline + lead_time + pricing_table
// -----------------------------------------------------------------------------
const TAGLINE = 'Digital name card printing — 100 cards/box, $14–$40 per box by material and volume';

const prodRes = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({
    tagline: TAGLINE,
    lead_time_days: 1,
    print_mode: 'Digital',
    pricing_table: pricingTable,
    pricing_compute: null,
  }),
});
if (!prodRes.ok) throw new Error(`PATCH products: ${prodRes.status} ${await prodRes.text()}`);
console.log('✓ products row patched (tagline + 1-day lead + pricing_table)');

// -----------------------------------------------------------------------------
// 4. product_configurator — full rebuild
//    material (swatch, first 5 from pricelist)
//    lam / rnd / hot / suv / die (swatch, Yes/No each)
//    qty (qty, 1-10, 100 cards/box)
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
    label: 'Material',
    type: 'swatch',
    required: true,
    options: MATERIALS.map((m) => ({ slug: m.slug, label: m.label, note: m.note })),
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'lam',
    step_order: 1,
    label: 'Lamination',
    type: 'swatch',
    required: true,
    options: YESNO,
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'rnd',
    step_order: 2,
    label: 'Rounded Corners',
    type: 'swatch',
    required: true,
    options: YESNO,
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'hot',
    step_order: 3,
    label: 'Hotstamp',
    type: 'swatch',
    required: true,
    options: YESNO,
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'suv',
    step_order: 4,
    label: 'Spot UV',
    type: 'swatch',
    required: true,
    options: YESNO,
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'die',
    step_order: 5,
    label: 'Die Cut',
    type: 'swatch',
    required: true,
    options: YESNO,
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'qty',
    step_order: 6,
    label: 'Boxes (100 cards each)',
    type: 'qty',
    required: true,
    options: [],
    show_if: null,
    step_config: {
      min: 1,
      step: 1,
      presets: [1, 2, 5, 10],
      labelMultiplier: 100,
      note: '100 cards per box. This product is quoted per name — one design per order, no name-mixing. Need a different name for a teammate? Place a separate order.',
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
// 5. product_extras — rewrite everything except h1 / h1em
// -----------------------------------------------------------------------------
const EXTRAS = {
  seo_title: 'Name Card Printing Singapore | From $24/Box, 100 Cards per Box',
  seo_desc: 'Digital name card printing in Singapore. 5 materials from 250gsm Art Card to 350gsm Grandeur, 100 cards per box, $14–$40 per box depending on material and volume. Lamination, rounded corners, hotstamp, spot UV, die cut optional. 1 working day.',
  hero_big: 'NAME CARDS',
  intro: 'Digital-printed name cards, 100 cards to a box, priced per box by material and volume. Five stocks: Basic 250gsm Art Card ($24 → $14/box at 10), Basic+ 300gsm Art Card, Premium RJ 250–299gsm (Tangerine White), Premium RJ 300–349gsm (Maple Bright / White), and Premium RJ 350–400gsm (Grandeur / Shiruku). Add lamination, rounded corners, hotstamp, spot UV, or die-cut shaping — each surcharge scales with the box count. One design per order, 1 working day lead time.',
  seo_body: 'Name card printing Singapore — 5 digital stocks from 250gsm Art Card to 350gsm Grandeur, 100 cards per box, volume pricing 1–10 boxes. Lamination, rounded corners, hotstamp, spot UV, and die cut finishings priced per pvpricelist. One design per order, 1 working day.',
  chooser: null,
  seo_magazine: {
    lede: 'Name cards in Singapore are still how most first meetings end. The right card costs less than a coffee per impression and signals more than a LinkedIn handle — wrong card signals the opposite. Four things decide a good run: stock weight, lamination, any finishing accents, and the per-box rate at your volume.',
    title: 'Everything worth knowing,',
    title_em: 'before the first handshake.',
    issue_label: 'Issue №01 · Name Card',
    articles: [
      {
        num: '01',
        title: 'Basic, Basic+, or Premium — pick by the weight in hand.',
        body: [
          '**Basic (250gsm Art Card)** is the entry standard — clean white stock, full-colour print, the working baseline for everyday business cards. $24/box at one box, down to $14/box at ten. **Basic+ (300gsm)** adds 50gsm of weight and the card feels measurably heavier — usually worth the extra four dollars per box if the brand wants to register before the design does.',
          '**Premium RJ 250–299gsm (Tangerine White)** is the uncoated-feel upgrade — cotton-paper texture, takes ink with a softer finish. **Premium RJ 300–349gsm (Maple Bright / White)** is the textured option — subtle wood-grain, reads more tactile. **Premium RJ 350–400gsm (Grandeur / Shiruku)** is the heaviest + most premium — thick, cotton-feel, used for executive and luxury-brand cards.',
        ],
        side: {
          kind: 'list',
          label: 'Per-box rate (1 box → 10 boxes)',
          rows: [
            { text: 'Basic 250gsm Art',       time: '$24 → $14' },
            { text: 'Basic+ 300gsm Art',      time: '$28 → $18' },
            { text: 'RJ 250–299gsm',          time: '$32 → $23' },
            { text: 'RJ 300–349gsm',          time: '$35 → $26' },
            { text: 'RJ 350–400gsm',          time: '$40 → $31' },
          ],
        },
      },
      {
        num: '02',
        title: 'Lamination and rounded corners — the two finishings most orders actually use.',
        body: [
          '**Lamination** (matt or gloss sealed at press) protects the card face from finger-smudge and light scratches, and adds a touch of thickness. Surcharge scales gently: $8 at one box, $60 at ten boxes. **Rounded corners** (R3/R4 depending on stock) make the card feel friendlier in hand and prevent corner-bend damage in wallets. $8 at one box to $80 at ten.',
          'Both are small-money additions that change the perceived quality of the card meaningfully. If you\'re picking a Basic stock and want the card to *read* premium, Matt Lamination is the upgrade with the highest return — especially when paired with rounded corners on a dark-heavy design.',
        ],
        side: {
          kind: 'pills',
          label: 'Most-picked finishing combos',
          items: [
            { pop: true, text: 'Matt Lam only' },
            { text: 'Matt Lam + R3 Corners' },
            { text: 'Gloss Lam only' },
            { text: 'No lam, R3 Corners' },
          ],
        },
      },
      {
        num: '03',
        title: 'Hotstamp, Spot UV, Die Cut — when to reach for each.',
        body: [
          '**Hotstamp** (metallic foil pressed into the card surface) adds a gold, silver, or rose-gold glint to logos or text. Setup is the expensive part — $80 for one box, +$10/box after that. Right when a brand has a simple logo mark and wants it to catch light. **Spot UV** (selective glossy coating) works on matt-laminated cards — a logo reads as a gloss island on an otherwise matt surface. $120 for 1–3 boxes, climbs to $260 at ten.',
          '**Die Cut** shapes the card edge to something other than rectangular — rounded at one corner, a semicircle tab, a custom silhouette. Setup is the costliest of the three at $150 for 1–5 boxes and up to $200 at ten. Reach for die cut when the card shape IS the brand, not when a standard 90×54mm does the job.',
        ],
        side: {
          kind: 'stat',
          num: '$80',
          label: 'Hotstamp setup (1 box)',
          caption: '+$10 per extra box',
        },
      },
      {
        num: '04',
        title: 'Volume — why more boxes makes every card cheaper.',
        body: [
          'Per-box rate drops every extra box. Ten boxes of Basic stock is $140 total — $14 per box, $0.14 per card. Ordering just one box puts the same cards at $24/box, $0.24/card. At Premium RJ 350, ten boxes is $310 vs $40 for one — still drops to $0.31/card at the ten-box mark.',
          'One design per order — this product is quoted per name. If you\'re ordering for a team where each person needs their own card, place a separate order per person (or see our Luxury Business Card for duplex/triplex stocks that allow name-mixing). Lead time is 1 working day on all digital runs.',
        ],
        side: {
          kind: 'list',
          label: 'Per-card cost at 10 boxes',
          rows: [
            { text: 'Basic 250gsm',  time: '$0.14/card' },
            { text: 'Basic+ 300gsm', time: '$0.18/card' },
            { text: 'RJ 350–400',    time: '$0.31/card' },
          ],
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
        need: 'You need cards *before tomorrow* — clean baseline',
        pick_title: 'Basic 250gsm, No finishings, 1 box',
        pick_detail: '$24 · 100 cards · 1 working day · the meeting-saver run',
      },
      {
        need: 'Ordering *five boxes* and brand colour has to land solid',
        pick_title: 'Basic+ 300gsm, Matt Lam, 5 boxes',
        pick_detail: '$155 total · 500 cards · heavier stock + laminated finish',
      },
      {
        need: 'Card has to *survive six months* in a wallet',
        pick_title: 'Basic+ 300gsm, Matt Lam + R3 Corners, 5 boxes',
        pick_detail: '$195 total · sealed against finger-smudge · corners won\'t fray',
      },
      {
        need: '*First impression* must feel expensive',
        pick_title: 'RJ 350–400gsm, No lam, 3 boxes',
        pick_detail: '$114 total · 300 cards · cotton-feel stock, heavier than expected',
      },
      {
        need: 'Premium *with a gold logo glint*',
        pick_title: 'RJ 300–349gsm, Hotstamp, 5 boxes',
        pick_detail: '$265 total · 500 cards · metallic foil on logo or monogram',
      },
      {
        need: 'First run as *freelancer* — you\'ll reorder next quarter',
        pick_title: 'Basic 250gsm, No finishings, 2 boxes',
        pick_detail: '$46 total · 200 cards · upgrade stock on reorder',
      },
    ],
    right_note_title: 'One name per order.',
    right_note_body: 'Team ordering with different names per person? Use Luxury Business Card — duplex/triplex stocks that allow name-mixing at volume.',
  },
};

const extrasRes = await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify(EXTRAS),
});
if (!extrasRes.ok) throw new Error(`PATCH extras: ${extrasRes.status} ${await extrasRes.text()}`);
console.log('✓ product_extras rewritten (h1 + h1em preserved)');

// -----------------------------------------------------------------------------
// 6. product_faqs — full rebuild
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
    question: 'How many cards are in a box?',
    answer: '100 cards per box. Every price on this page is a box price. Ten boxes = 1,000 cards.',
  },
  {
    product_id: PID,
    display_order: 1,
    question: 'Can I have different names across the order?',
    answer: 'Not on this product — every box in the order prints the same design and name. For team rollouts where each person needs their own name, use Luxury Business Card (duplex/triplex stocks) which allows mixing names across boxes at volume pricing.',
  },
  {
    product_id: PID,
    display_order: 2,
    question: 'What\'s the difference between Basic and Premium stocks?',
    answer: 'Basic is 250gsm Art Card — the white, smooth, Australian-coffee-shop-standard business card. Basic+ is 300gsm on the same stock — 50gsm heavier, feels firmer in hand. Premium RJ 250–299gsm (Tangerine White) is cotton-feel uncoated paper. RJ 300–349gsm (Maple Bright / White) is a subtle textured stock. RJ 350–400gsm (Grandeur / Shiruku) is the thickest, cotton-feel, executive-brand weight.',
  },
  {
    product_id: PID,
    display_order: 3,
    question: 'Is lamination worth it?',
    answer: 'For Basic and Basic+ Art Card — yes, matt lamination is the single finishing with the highest return. Seals the card against finger-smudge, adds perceived depth, and makes the colour print more saturated. Not always needed on textured Premium stocks where the finish is already the feature. Gloss lam is for high-chroma designs; matt lam is the default pick.',
  },
  {
    product_id: PID,
    display_order: 4,
    question: 'Should I add rounded corners?',
    answer: 'Rounded corners soften the card\'s hand-feel and prevent corner-bend in wallets. $8 at one box, $80 at ten — small money, noticeable polish. The only time to skip is when the brand deliberately wants a sharp, hard-edged mark on the business card format.',
  },
  {
    product_id: PID,
    display_order: 5,
    question: 'When do I pick Hotstamp vs Spot UV?',
    answer: 'Hotstamp presses metallic foil (gold / silver / rose-gold) into the surface — reach for it when you want a metallic glint on a logo or monogram. Spot UV lays a glossy coating selectively on top of the card — reach for it when you have a matt lamination and want the logo to pop as a gloss island. Both are premium touches, both have high-ish setup costs.',
  },
  {
    product_id: PID,
    display_order: 6,
    question: 'How quickly can I get them?',
    answer: '1 working day for the digital method. Collect from Paya Lebar Square or delivery at checkout. Same-day is available by WhatsApp for urgent runs if artwork lands before 4pm.',
  },
  {
    product_id: PID,
    display_order: 7,
    question: 'What volume actually gets me the best per-card price?',
    answer: 'Ten boxes. Per-box rate hits its lowest at the 10-box tier — Basic drops to $14/box ($0.14/card) at 10, versus $24 ($0.24/card) at one box. If you\'re likely to use 300+ cards over the next year, ten boxes is almost always the right starting volume.',
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
// 7. Spot-check a few combos against the admin sheet
// -----------------------------------------------------------------------------
function check(mat, lam, rnd, hot, suv, die, qty, expectedDollars) {
  const key = `${mat}:${lam}:${rnd}:${hot}:${suv}:${die}:${qty}`;
  const got = (prices[key] ?? 0) / 100;
  const pass = got === expectedDollars ? '✓' : '✗';
  console.log(`  ${pass} ${key.padEnd(34)} → $${got} (expect $${expectedDollars})`);
}
console.log('\nSpot-check vs NC_DIG × NC_FIN:');
check('basic',  'no',  'no',  'no',  'no',  'no',  1,  24);       // 1×24
check('basic',  'no',  'no',  'no',  'no',  'no',  10, 140);      // 10×14
check('rj350',  'no',  'no',  'no',  'no',  'no',  5,  180);      // 5×36
check('rj350',  'no',  'no',  'no',  'no',  'no',  10, 310);      // 10×31
check('basic',  'yes', 'no',  'no',  'no',  'no',  1,  32);       // 24+8
check('basic',  'yes', 'yes', 'no',  'no',  'no',  5,  175);      // 100+35+40
check('basic',  'yes', 'yes', 'yes', 'yes', 'yes', 10, 740);      // 140+60+80+160+260+200
