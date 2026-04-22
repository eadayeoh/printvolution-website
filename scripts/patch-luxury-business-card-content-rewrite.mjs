// Luxury Business Card — rewrite page content without revealing the
// manufacturing method. Previous rewrite described the cards as
// "fused layers of art card" / "2× sheets" / "coloured core running
// as a stripe" — all of which tell the customer how we make it. The
// marketing story is the finished product: a thick card with a
// distinctive coloured edge, premium feel, heavier-than-expected.
//
// What changes: intro, seo_desc, seo_body, seo_magazine articles,
// matcher rows, faqs, material option notes, tagline.
//
// What stays: pricing_table, configurator structure, slugs
// (duplex / triplex / quadplex), finishings, lead time, h1 + h1em.

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

// -----------------------------------------------------------------------------
// 1. products row — tagline (no mention of stock construction)
// -----------------------------------------------------------------------------
const TAGLINE = 'Thick business cards with a coloured edge — $43–$90/box, mix names across boxes';

const prodRes = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ tagline: TAGLINE }),
});
if (!prodRes.ok) throw new Error(`PATCH products: ${prodRes.status} ${await prodRes.text()}`);
console.log('✓ tagline updated');

// -----------------------------------------------------------------------------
// 2. product_configurator — rewrite the material option notes. Slugs
//    stay identical (duplex / triplex / quadplex) so pricing_table
//    entries remain valid; only the note fields change.
// -----------------------------------------------------------------------------
const MATERIAL_OPTIONS = [
  { slug: 'duplex',   label: 'Duplex Card',   note: 'The entry thick card · distinctive coloured edge' },
  { slug: 'triplex',  label: 'Triplex Card',  note: 'Executive standard · bold coloured edge band' },
  { slug: 'quadplex', label: 'Quadplex Card', note: 'Our heaviest · keepsake weight' },
];

const cfgPatch = await fetch(
  `${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.material`,
  {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ options: MATERIAL_OPTIONS }),
  },
);
if (!cfgPatch.ok) throw new Error(`PATCH configurator: ${cfgPatch.status} ${await cfgPatch.text()}`);
console.log('✓ configurator material notes rewritten');

// -----------------------------------------------------------------------------
// 3. pricing_table.axes.material — same reframing in the axis labels
// -----------------------------------------------------------------------------
const productRow = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}&select=pricing_table`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const { pricing_table: pt } = (await productRow.json())[0];
pt.axes.material = MATERIAL_OPTIONS.map((m) => ({ slug: m.slug, label: m.label, note: m.note }));

const ptPatch = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ pricing_table: pt }),
});
if (!ptPatch.ok) throw new Error(`PATCH pricing_table: ${ptPatch.status} ${await ptPatch.text()}`);
console.log('✓ pricing_table material labels rewritten');

// -----------------------------------------------------------------------------
// 4. product_extras — full content rewrite, no construction talk.
//    h1 + h1em preserved per the rewrite rule.
// -----------------------------------------------------------------------------
const EXTRAS = {
  seo_title: 'Luxury Business Cards Singapore | Thick Cards with Coloured Edge, from $43/Box',
  seo_desc: 'Luxury thick business card printing in Singapore — three thickness tiers with a signature coloured edge. 100 cards per box, from $70/box at one box to $43/box at ten. Mix names across boxes at the volume rate. Lamination, rounded corners, hotstamp, spot UV, die cut.',
  hero_big: 'LUXURY CARDS',
  intro: 'Thick, high-weight name cards with a distinctive coloured edge — the mark of a card that costs more than a card should. Three thickness tiers: Duplex (the entry premium), Triplex (the executive standard), and Quadplex (the heaviest we offer). 100 cards per box, priced per box, volume rate scales on total boxes across the order. Mix names freely — ten boxes for a ten-person leadership team, ten different names, one volume rate. Add lamination, rounded corners, hotstamp, spot UV, or die-cut shaping. 1 working day from artwork approval.',
  seo_body: 'Luxury business card printing Singapore — thick business cards with a coloured edge detail, 100 cards per box, volume pricing 1–10 boxes from $70/$80/$90 at 1 box down to $43/$53/$63 at ten. Mix different names across the order at the volume rate. 1 working day.',
  chooser: null,
  seo_magazine: {
    lede: 'A luxury card is the one you reach for when the card itself is the first impression. Thickness and an edge that reads premium at a glance — these are what separate a luxury card from a standard print. Four choices shape the order: which of the three thickness tiers, which finishings, how many boxes, and — if you\'re ordering for a team — whose names go on which box.',
    title: 'Everything worth knowing,',
    title_em: 'about the thick-card category.',
    issue_label: 'Issue №01 · Luxury Card',
    articles: [
      {
        num: '01',
        title: 'Duplex, Triplex, Quadplex — three thickness tiers.',
        body: [
          '**Duplex** is our entry thick card — roughly 650µm, meaningfully heavier than a standard business card, still slim enough to slot into a wallet. The edge carries a subtle coloured detail that distinguishes it from ordinary stock the moment the card turns sideways.',
          '**Triplex** is the executive standard — around 950µm. The extra weight registers on pickup, the coloured edge reads as a bold band rather than a subtle line, and the card handles like a proper executive piece. **Quadplex** is our heaviest — 1,250µm, closer to a gift-shop keepsake than ordinary stationery. Right when the card IS the luxury artefact and wallet-fit is secondary. All three share the 90×54mm footprint and full-colour both-sides print.',
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
          'This is why Luxury is the right pick for a leadership team, a board, or a sales bench. Everyone gets their own card at the same thickness tier, the company pays the volume rate, and nobody\'s carrying a card thinner than the CEO\'s. List names one-per-line in the order notes; we pair names to boxes in production.',
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
        title: 'Finishings — the card already reads premium; these push it further.',
        body: [
          'Lamination on Duplex or Triplex is optional — the weight and edge detail are the feature, and a matt lam can mute the edge character slightly. **Rounded corners** soften the hand-feel on a thicker card and help the corners hold up to wallet use — worth the add on Triplex and Quadplex especially. **Hotstamp** (gold, silver, rose-gold foil) pairs brilliantly with the coloured edge — foil on the face, colour on the edge, the two read together as a deliberate premium look.',
          '**Spot UV** works best on matt-laminated luxury cards — a glossy logo pops against the matt face. **Die Cut** shapes the card edge to something non-standard — worth the spend when the card shape itself is part of the brand. Surcharges are identical to the Name Card product: $8 → $60 lamination, $80 → $160 hotstamp, $150 → $200 die cut across the 1–10 box range.',
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
          'Per-box rate drops $27 across the 1–10 range regardless of thickness tier. Duplex is $70 at one box → $43 at ten. Triplex $80 → $53. Quadplex $90 → $63. A ten-person team at Triplex costs $530 for 1,000 cards — $0.53 per card on the executive-standard thickness.',
          'At fewer than three boxes, per-card cost stays above $0.70 — fine for a single-executive reorder, pricy for a team rollout. For a team order, aim for five boxes minimum. Lead time is 1 working day from artwork approval; add a day if hotstamp or die cut requires a custom die.',
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
        pick_detail: '$80 · 100 cards · executive-standard thickness with coloured edge',
      },
      {
        need: 'Team of *ten*, each person gets a thick card',
        pick_title: 'Triplex, No finishings, 10 boxes',
        pick_detail: '$530 total · $0.53/card · mix ten names, one volume rate',
      },
      {
        need: 'Agency card — *needs a gold logo glint*',
        pick_title: 'Duplex, Hotstamp, 5 boxes',
        pick_detail: '$400 total · 500 cards · gold foil on logo or monogram',
      },
      {
        need: '*Board-level* card that reads as a keepsake',
        pick_title: 'Quadplex, Matt Lam + R3 Corners, 5 boxes',
        pick_detail: '$465 total · the heaviest thick card in our catalogue',
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
console.log('✓ extras rewritten (h1 + h1em preserved)');

// -----------------------------------------------------------------------------
// 5. product_faqs — full rebuild without construction reveals
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
    answer: 'Three thickness tiers. Duplex is the entry premium at ~650µm — heavier than a standard business card, still wallet-slim. Triplex is the executive standard at ~950µm — distinctly thick, bolder coloured edge. Quadplex is our heaviest at ~1,250µm, roughly twice the thickness of a bank card — the card IS the keepsake. All three share the same 90×54mm footprint and full-colour print pipeline.',
  },
  {
    product_id: PID,
    display_order: 1,
    question: 'Can I mix names across boxes?',
    answer: 'Yes. Volume pricing scales on the total box count, not on how many distinct names or designs. Ten boxes = ten-box volume rate whether it\'s one name × ten boxes or ten names × one box each. List the names one-per-line in the order notes.',
  },
  {
    product_id: PID,
    display_order: 2,
    question: 'Can I pick the colour of the edge detail?',
    answer: 'Default is a neutral off-white edge. For a custom edge colour — black, magenta, a brand hex — send the colour reference in your order notes. Allow an extra working day if the colour is non-standard.',
  },
  {
    product_id: PID,
    display_order: 3,
    question: 'Which finishings actually suit these cards?',
    answer: 'Rounded corners help — thicker cards otherwise catch in wallet slots. Hotstamp looks exceptional on Duplex and Triplex, pairing foil on the face with the coloured edge. Lamination is optional and can mute the edge character — consider skipping it. Spot UV and die cut are available but less commonly specified.',
  },
  {
    product_id: PID,
    display_order: 4,
    question: 'How much is the volume discount worth?',
    answer: 'Roughly $27/box saved between the 1-box and 10-box tiers. At Duplex, you pay $70 for one box and $43 for ten — $27 cheaper per box at volume. Same $27 drop across Triplex and Quadplex. The sweet spot for team rollouts is the five-to-ten box tier.',
  },
  {
    product_id: PID,
    display_order: 5,
    question: 'Will the card fit a standard wallet slot?',
    answer: 'Duplex fits cleanly. Triplex is borderline — fits most wallet slots, tight in some. Quadplex at 1,250µm is typically too thick for wallet use and is picked for desk/keepsake scenarios where the tactile weight is the point.',
  },
  {
    product_id: PID,
    display_order: 6,
    question: 'How long does printing take?',
    answer: '1 working day on standard specs. Add a day if you\'re specifying a non-standard edge colour, or if hotstamp or die cut requires a custom die.',
  },
  {
    product_id: PID,
    display_order: 7,
    question: 'How should I send artwork?',
    answer: 'CMYK PDF with fonts outlined, or layered AI. For hotstamp, include a separate spot-colour layer marking exactly where foil should land. For die cut, include a dieline as a named path. We proof on-screen before press and flag anything that will compromise the edge character or foil placement.',
  },
];

const insFaq = await fetch(`${BASE}/rest/v1/product_faqs`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify(FAQS),
});
if (!insFaq.ok) throw new Error(`INSERT faqs: ${insFaq.status} ${await insFaq.text()}`);
console.log(`✓ faqs rebuilt — ${FAQS.length} entries`);

console.log('\nAll done. No mention of construction method anywhere in the page copy.');
