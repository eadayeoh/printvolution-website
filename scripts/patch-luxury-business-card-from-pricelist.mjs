// Luxury Business Card — switch to pricing_table built from the
// pvpricelist-snapshot.json (rates.namecards), materials Duplex /
// Triplex / Quadplex. Finishings match Name Card's 5 Yes/No axes
// (lam / rnd / hot / suv / die) with the same NC_FIN surcharge curves.
//
// Rules (from user):
//   • Quantity is total boxes (left-column of admin sheet).
//   • Material is the axis group (top of admin sheet).
//   • LPO ignored.
//   • This product CAN mix names — the customer can submit a list of
//     distinct names and each box gets printed with one of them. The
//     volume rate applies to the total box count regardless of how
//     many different names.
//
// The "names" field is a free-text list (one per line) — no price
// impact, since the rate is driven entirely by the total box count.
// Lead time: 1 working day. Leaves h1 + h1em untouched.

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

const PID = '93828e8e-de23-4ea2-a3b8-407953271548';
const PRICELIST = JSON.parse(fs.readFileSync('scripts/pvpricelist-snapshot.json', 'utf8'));
const NC = PRICELIST.rates.namecards;

// -----------------------------------------------------------------------------
// 1. Axis definitions
// -----------------------------------------------------------------------------
const QTY_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const MATERIALS = [
  { slug: 'duplex',   rate_key: 'dig_duplex',   label: 'Duplex Card',    note: '2× sheets fused — distinctive edge, heavier feel' },
  { slug: 'triplex',  rate_key: 'dig_triplex',  label: 'Triplex Card',   note: '3× sheets — visible coloured core, executive weight' },
  { slug: 'quadplex', rate_key: 'dig_quad',     label: 'Quadplex Card',  note: '4× sheets — the thickest PV name card' },
];

const YESNO = [
  { slug: 'no',  label: 'No' },
  { slug: 'yes', label: 'Yes' },
];

const FINISHINGS = [
  { axis: 'lam', label: 'Lamination',      fin_key: 'lam' },
  { axis: 'rnd', label: 'Rounded Corners', fin_key: 'rnd' },
  { axis: 'hot', label: 'Hotstamp',        fin_key: 'hot' },
  { axis: 'suv', label: 'Spot UV',         fin_key: 'suv' },
  { axis: 'die', label: 'Die Cut',         fin_key: 'die' },
];

// -----------------------------------------------------------------------------
// 2. Build pricing_table
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
  prices,
};

console.log(`Built ${comboCount} price entries (3 materials × 2^5 finishings × 10 box tiers).`);

// -----------------------------------------------------------------------------
// 3. products row — tagline + lead + pricing_table
// -----------------------------------------------------------------------------
const TAGLINE = 'Duplex / triplex / quadplex name cards — $43–$90/box, mix names across boxes';

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
//    material (swatch)  — Duplex / Triplex / Quadplex
//    lam / rnd / hot / suv / die (swatch, Yes/No each)
//    names (text, optional)  — one per line, mix across the order
//    qty (qty, 1–10)    — total boxes, 100 cards per box
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
    step_id: 'names',
    step_order: 6,
    label: 'Name(s) on the Cards',
    type: 'text',
    required: false,
    options: [],
    show_if: null,
    step_config: {
      note: 'Mix names across the order — one name per line. Ten boxes with ten different names? Still the ten-box volume rate. Leave blank if every box is the same name.',
    },
  },
  {
    product_id: PID,
    step_id: 'qty',
    step_order: 7,
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
      note: 'Total boxes across all names. Volume rate applies to the total box count — more boxes, cheaper per box, regardless of how many names.',
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
// 5. product_extras — rewrite (h1 + h1em preserved)
// -----------------------------------------------------------------------------
const EXTRAS = {
  seo_title: 'Luxury Business Cards Singapore | Duplex, Triplex, Quadplex from $43/Box',
  seo_desc: 'Luxury thick business card printing in Singapore — Duplex, Triplex, and Quadplex stocks at 100 cards per box. From $70/box at one box to $43/box at ten. Mix names across boxes at the volume rate. Lamination, rounded corners, hotstamp, spot UV, and die-cut finishings.',
  hero_big: 'LUXURY CARDS',
  intro: 'Thick, layered name cards — Duplex (2× sheets), Triplex (3×), or Quadplex (4×). The card is fused from multiple layers of art card, so the edge shows a coloured core when turned sideways — the hallmark of executive-tier printed stationery. 100 cards per box, priced per box, volume rate scales on total boxes across the order. Mix names freely: ten boxes for a ten-person leadership team, ten different names, one volume rate. Add lamination, rounded corners, hotstamp, spot UV, or die-cut shaping. 1 working day from artwork approval.',
  seo_body: 'Luxury business card printing Singapore — Duplex, Triplex, and Quadplex stocks built from fused layers of art card, 100 cards per box, volume pricing 1–10 boxes from $70/$80/$90 at 1 box down to $43/$53/$63 at ten. Name-mixing allowed across the order. 1 working day.',
  chooser: null,
  seo_magazine: {
    lede: 'A luxury card is what you hand over when the card itself is the first impression. Duplex, Triplex, and Quadplex stocks are built by fusing layers of art card together — the result is a card thick enough that people notice the weight before they read the title, with a coloured edge that reads as obviously premium the moment it turns sideways. Four decisions: which stack thickness, which finishings, how many boxes, and whose names are on which box.',
    title: 'Everything worth knowing,',
    title_em: 'about layered name cards.',
    issue_label: 'Issue №01 · Luxury Card',
    articles: [
      {
        num: '01',
        title: 'Duplex, Triplex, Quadplex — pick by thickness in the hand.',
        body: [
          '**Duplex** fuses two art-card sheets into one card — the cross-section shows a visible seam, usually coloured to contrast with the face. Roughly 650µm thick, heavier than a regular business card, still wallet-friendly. **Triplex** stacks three sheets — 950µm, reads distinctly *thick*, the coloured core runs as a stripe down the edge. The industry standard for executive and legal cards.',
          '**Quadplex** is four sheets — 1250µm, the thickest domestically printable card, feels closer to a gift-shop keepsake than stationery. Right when the card IS the luxury artefact and wallet-fit is secondary. All three share the same 90×54mm footprint, same artwork pipeline, same full-colour both sides.',
        ],
        side: {
          kind: 'list',
          label: 'Per-box rate (1 box → 10 boxes)',
          rows: [
            { text: 'Duplex',   time: '$70 → $43' },
            { text: 'Triplex',  time: '$80 → $53' },
            { text: 'Quadplex', time: '$90 → $63' },
          ],
        },
      },
      {
        num: '02',
        title: 'Mix names — one order, many designs, one volume rate.',
        body: [
          'Most SG print shops charge you per design variant, which kills the economics of printing for a team. We don\'t. Submit ten boxes with ten different names, eight different designs, whatever — volume pricing applies to the total box count. Ten boxes of Duplex is $430 total regardless of whether it\'s ten copies of one design or one copy each of ten designs.',
          'This is why Luxury is the right pick for a leadership team, a board, or a sales bench. Everyone gets their own card on premium stock, the company pays the volume rate, and nobody\'s carrying a card thinner than the CEO\'s. List names one-per-line in the order notes; we pair names to boxes in production.',
        ],
        side: {
          kind: 'pills',
          label: 'Common mixes',
          items: [
            { pop: true, text: '10 names × 1 box' },
            { text: '5 names × 2 boxes' },
            { text: '2 names × 5 boxes' },
            { text: '1 name × 10 boxes' },
          ],
        },
      },
      {
        num: '03',
        title: 'Finishings — the three stacks already read premium; these push it further.',
        body: [
          'Lamination on a Duplex or Triplex card is optional — the layered stock is the feature, and a matt lam can actually mute the edge character. **Rounded corners** soften the hand-feel on a thick card that otherwise catches in wallet slots — worth the add on Triplex and Quadplex especially. **Hotstamp** (gold, silver, rose-gold foil) on a matching coloured core edge is the signature luxury-card move — foil on face, colour on edge, they read together.',
          '**Spot UV** and **Die Cut** are less common on layered cards but available — spot UV works best on matt-laminated luxury cards, die cut is for when the card shape is the brand. Surcharges match the Name Card product exactly: $8 → $60 for lamination, $80 → $160 for hotstamp, $150 → $200 for die cut across the 1–10 box range.',
        ],
        side: {
          kind: 'stat',
          num: '1250µm',
          label: 'Quadplex thickness',
          caption: '~2× a bank card',
        },
      },
      {
        num: '04',
        title: 'Volume — why the ten-box tier is the executive sweet spot.',
        body: [
          'Per-box rate drops $27 across the 1–10 range regardless of material. Duplex is $70 at one box → $43 at ten. Triplex $80 → $53. Quadplex $90 → $63. A ten-person team at Triplex costs $530 for 1,000 layered cards — $0.53 per card on the thickest standard-format stock in SG.',
          'At fewer than three boxes, the per-card cost stays well above $0.70 — fine for a single-executive reorder, pricy for a team rollout. The tier to aim for on a team order is five boxes minimum. Lead time is 1 working day from artwork approval; add a day if hotstamp or die cut requires a custom die.',
        ],
        side: {
          kind: 'list',
          label: 'Per-card cost at 10 boxes',
          rows: [
            { text: 'Duplex',   time: '$0.43/card' },
            { text: 'Triplex',  time: '$0.53/card' },
            { text: 'Quadplex', time: '$0.63/card' },
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
        need: '*Executive reorder* — one person, premium card',
        pick_title: 'Triplex, No finishings, 1 box',
        pick_detail: '$80 · 100 cards · 950µm thick, coloured edge core',
      },
      {
        need: 'Team of *ten*, each person gets a thick card',
        pick_title: 'Triplex, No finishings, 10 boxes',
        pick_detail: '$530 total · $0.53/card · mix ten names, one volume rate',
      },
      {
        need: 'Agency card — *needs a gold logo glint*',
        pick_title: 'Duplex, Hotstamp, 5 boxes',
        pick_detail: '$400 total · 500 cards · metallic foil on logo or monogram',
      },
      {
        need: '*Board-level* card that looks like a keepsake',
        pick_title: 'Quadplex, Matt Lam + R3 Corners, 5 boxes',
        pick_detail: '$465 total · 1,250µm stock · the thickest domestic luxury card',
      },
      {
        need: 'Five partners, *each person their own design*',
        pick_title: 'Triplex, Hotstamp, 5 boxes',
        pick_detail: '$450 total · 5 distinct designs · one volume rate',
      },
    ],
    right_note_title: 'Names mixed, rate preserved.',
    right_note_body: 'Submit any combination of names across the boxes. Volume pricing scales on total boxes, not on design count.',
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
    question: 'What\'s the difference between Duplex, Triplex, and Quadplex?',
    answer: 'Duplex is two sheets of art card fused together (~650µm thick). Triplex is three sheets (~950µm). Quadplex is four (~1250µm, roughly twice the thickness of a bank card). The edge shows a visible seam where the layers meet — usually printed in a contrasting colour for a striking core-stripe effect. Same 90×54mm footprint, same print pipeline.',
  },
  {
    product_id: PID,
    display_order: 1,
    question: 'Can I mix names across boxes?',
    answer: 'Yes. Volume pricing scales on total boxes across the order, not on how many distinct names or designs. Ten boxes = ten-box volume rate whether it\'s one name × ten boxes or ten names × one box each. List the names one-per-line in the order notes.',
  },
  {
    product_id: PID,
    display_order: 2,
    question: 'Does the coloured core get specified separately?',
    answer: 'Default is the natural cross-section of the stock (usually off-white or cream). For a custom coloured core — a black stripe between white sheets, or a magenta core on a neutral face — send the hex value in your order notes and we\'ll source the matching interleaf. Allow an extra day for material if the colour is non-standard.',
  },
  {
    product_id: PID,
    display_order: 3,
    question: 'Which finishings actually suit a layered card?',
    answer: 'Rounded corners help — thick stock otherwise catches in wallet slots. Hotstamp looks exceptional on Duplex and Triplex, pairing foil on the face with the coloured core on the edge. Lamination is optional and can mute the edge character — consider skipping it. Spot UV and die cut are available but less commonly specified on layered cards.',
  },
  {
    product_id: PID,
    display_order: 4,
    question: 'How much is the volume discount worth?',
    answer: 'Roughly $27/box saved between the 1-box and 10-box tiers. At Duplex, you pay $70 for one box and $43 for ten — effective $27 cheaper per box at volume. Same $27 drop across Triplex and Quadplex. The executive-sweet-spot is the five-to-ten box tier for team rollouts.',
  },
  {
    product_id: PID,
    display_order: 5,
    question: 'Will the card fit a standard wallet slot?',
    answer: 'Duplex fits cleanly — 650µm is thicker than a standard card but still slot-friendly. Triplex is borderline — fits most wallet slots, tight in some. Quadplex at 1250µm is typically too thick for wallet use and is picked for desk/keepsake scenarios where the tactile weight is the point.',
  },
  {
    product_id: PID,
    display_order: 6,
    question: 'How long does printing take?',
    answer: '1 working day for stock-sourced layered cards on standard stocks. Add a day if you\'re specifying a non-standard core colour or if hotstamp / die cut requires a custom die.',
  },
  {
    product_id: PID,
    display_order: 7,
    question: 'How should I send artwork?',
    answer: 'CMYK PDF with fonts outlined, or a layered AI. For hotstamp, include a separate spot-colour layer marking exactly where foil should land. For die cut, include a dieline as a named path. We proof on-screen before press and flag anything that will compromise the layered-edge character.',
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
// 7. Spot-check against admin sheet in image 1
// -----------------------------------------------------------------------------
function check(mat, lam, rnd, hot, suv, die, qty, expectedDollars) {
  const key = `${mat}:${lam}:${rnd}:${hot}:${suv}:${die}:${qty}`;
  const got = (prices[key] ?? 0) / 100;
  const pass = got === expectedDollars ? '✓' : '✗';
  console.log(`  ${pass} ${key.padEnd(42)} → $${got} (expect $${expectedDollars})`);
}
console.log('\nSpot-check against admin sheet (no finishings):');
check('duplex',   'no', 'no', 'no', 'no', 'no', 1,  70);
check('duplex',   'no', 'no', 'no', 'no', 'no', 5,  290);
check('duplex',   'no', 'no', 'no', 'no', 'no', 10, 430);
check('triplex',  'no', 'no', 'no', 'no', 'no', 1,  80);
check('triplex',  'no', 'no', 'no', 'no', 'no', 5,  340);
check('triplex',  'no', 'no', 'no', 'no', 'no', 10, 530);
check('quadplex', 'no', 'no', 'no', 'no', 'no', 1,  90);
check('quadplex', 'no', 'no', 'no', 'no', 'no', 5,  390);
check('quadplex', 'no', 'no', 'no', 'no', 'no', 10, 630);
console.log('\nWith finishings:');
check('duplex',   'yes', 'yes', 'no', 'no', 'no', 5, 290+35+40);
check('triplex',  'no',  'no',  'yes','no', 'no', 5, 340+110);
check('quadplex', 'no',  'no',  'no', 'no', 'yes', 10, 630+200);
