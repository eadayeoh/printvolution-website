// Transparent Card — rewrite pricing + configurator + page content to
// match the new per-box spec:
//
//   Material   : Translucent / Transparent  (cheaper bracket)
//                Frosted Plastic / Touche   (pricier bracket)
//   White Ink  : No  (base price)
//                Yes (+$40 for 1 box, +$5 per additional box)
//   Qty        : 1–10 boxes, 100 cards per box
//   Mix names  : any number of names across the order; volume price
//                scales on total box count regardless of names
//   Lead time  : 3 working days
//
// Per-box rates from the admin sheet (img 1):
//   Translucent/Transparent: 1:$45 → 10:$36/box
//   Frosted/Touche         : 1:$50 → 10:$41/box
//
// White-ink surcharge is a TOTAL, not per-box — the plate setup is the
// expensive part, additional boxes only add $5 each (img 2):
//   1 box: $40   5 box: $60   10 box: $85
//
// Leaves h1 + h1em untouched per the "no touching H1 on rewrites" rule.
// Surgical: only products row, configurator, extras, faqs. Admin-edited
// images in any other tables are not touched.

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

const PID = '445d3c29-7fa2-4637-8d44-57e2f610c009';

// -----------------------------------------------------------------------------
// 1. pricing_table: material × white_ink axes, 1–10 box tiers
// -----------------------------------------------------------------------------
const MATERIALS = [
  {
    slug: 'translucent_transparent',
    label: 'Translucent / Transparent',
    note: 'Clear or frosted-translucent PVC · 100/box',
    swatch: '#D6ECF5',
  },
  {
    slug: 'frosted_plastic_touche',
    label: 'Frosted Plastic / Touche',
    note: 'Velvet-feel frosted stock · 100/box',
    swatch: '#CDCDCD',
  },
];

const WHITE_INK = [
  { slug: 'no',  label: 'No White Ink',  note: 'Design prints see-through over the clear stock' },
  { slug: 'yes', label: 'Add White Ink', note: 'White underbase so logo / text reads solid — setup $40, +$5 per extra box' },
];

// Per-box rate in cents, indexed by [material][boxes]. Multiply rate × boxes
// to get the base total (matches the admin sheet's per-box/total columns).
const PER_BOX_CENTS = {
  translucent_transparent: {
    1: 4500, 2: 4400, 3: 4300, 4: 4200, 5: 4100,
    6: 4000, 7: 3900, 8: 3800, 9: 3700, 10: 3600,
  },
  frosted_plastic_touche: {
    1: 5000, 2: 4900, 3: 4800, 4: 4700, 5: 4600,
    6: 4500, 7: 4400, 8: 4300, 9: 4200, 10: 4100,
  },
};

// White-ink surcharge is a total, not per-box: $40 for 1 box, +$5 per
// additional box (img 2). Formula: 3500 + 500 × boxes = 4000 at 1 box,
// 8500 at 10 boxes.
const WHITE_INK_SURCHARGE_CENTS = (boxes) => 3500 + 500 * boxes;

const QTY_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const prices = {};
for (const m of MATERIALS) {
  for (const w of WHITE_INK) {
    for (const boxes of QTY_TIERS) {
      const base = PER_BOX_CENTS[m.slug][boxes] * boxes;
      const surcharge = w.slug === 'yes' ? WHITE_INK_SURCHARGE_CENTS(boxes) : 0;
      prices[`${m.slug}:${w.slug}:${boxes}`] = base + surcharge;
    }
  }
}

const pricingTable = {
  axes: {
    material: MATERIALS.map((m) => ({ slug: m.slug, label: m.label, note: m.note, swatch: m.swatch })),
    white_ink: WHITE_INK.map((w) => ({ slug: w.slug, label: w.label, note: w.note })),
  },
  axis_order: ['material', 'white_ink'],
  qty_tiers: QTY_TIERS,
  prices, // default mode — total for that combo+tier
};

// -----------------------------------------------------------------------------
// 2. products row — tagline, lead_time (3 working days), pricing_table
// -----------------------------------------------------------------------------
const TAGLINE = 'Clear or frosted PVC — 100 cards/box, mix names, from $36/box at 10 boxes';

const prodRes = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({
    tagline: TAGLINE,
    lead_time_days: 3,
    pricing_table: pricingTable,
  }),
});
if (!prodRes.ok) throw new Error(`PATCH products: ${prodRes.status} ${await prodRes.text()}`);
console.log('✓ products row patched (tagline + 3-day lead + pricing_table)');

// -----------------------------------------------------------------------------
// 3. product_configurator — full rebuild
//    material  (swatch) — the two price brackets
//    white_ink (swatch) — base vs white-ink underbase
//    names     (text)   — one name per line, mix across boxes
//    qty       (qty)    — 1–10 boxes, 100 cards/box
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
    options: MATERIALS.map((m) => ({ slug: m.slug, label: m.label, note: m.note, swatch: m.swatch })),
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'white_ink',
    step_order: 1,
    label: 'White Ink Underbase',
    type: 'swatch',
    required: true,
    options: WHITE_INK.map((w) => ({ slug: w.slug, label: w.label, note: w.note })),
    show_if: null,
    step_config: null,
  },
  {
    product_id: PID,
    step_id: 'names',
    step_order: 2,
    label: 'Name(s) on the Cards',
    type: 'text',
    required: false,
    options: [],
    show_if: null,
    step_config: {
      note: 'One name per line = one box. Leave blank if all boxes share the same name. Volume price applies to the total box count regardless of how many different names.',
    },
  },
  {
    product_id: PID,
    step_id: 'qty',
    step_order: 3,
    label: 'Boxes (100 cards each)',
    type: 'qty',
    required: true,
    options: [],
    show_if: null,
    step_config: {
      min: 1,
      step: 1,
      presets: [1, 2, 5, 10],
      note: 'Each box holds 100 cards. Per-box price drops every extra box — from $45 (1 box) to $36 (10 boxes) for translucent, or $50 → $41 for frosted.',
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
// 4. product_extras — rewrite page content (leave h1, h1em untouched)
// -----------------------------------------------------------------------------
const EXTRAS = {
  seo_title: 'Transparent Card Printing Singapore | Clear & Frosted PVC from $45/Box',
  seo_desc: 'Transparent and frosted PVC name card printing in Singapore. 100 cards per box, mix names across boxes, from $45/box for one box down to $36/box at ten. White ink underbase available. 3 working days.',
  hero_big: 'CLEAR CARDS',
  // h1 and h1em intentionally NOT touched
  intro: 'Clear or frosted PVC name cards — 100 to a box, priced per box. Translucent / Transparent starts at $45/box and drops to $36/box when you order ten; Frosted / Touche runs $50 to $41 on the same ladder. Each box can carry a different name — order ten boxes for a ten-person team, ten designs, one volume rate. Add a white-ink underbase when you need logo or text to read solid over the clear stock. 3 working days from artwork approval.',
  seo_body: 'Transparent card printing Singapore — clear and frosted PVC at 0.5mm, 100 cards per box, volume priced by box count with name-mixing across boxes at no extra charge. White ink underbase optional for solid elements. 3 working days lead time.',
  chooser: null,
  seo_magazine: {
    lede: 'A transparent card lives or dies on four choices — the stock (clear vs frosted), whether you underbase with white ink, how you use the see-through areas in the artwork, and how many boxes you order for the team. This page is the plain version: what the two materials feel like, when white ink earns its keep, and why per-box pricing + name mixing is the right shape for a team rollout.',
    title: 'Everything worth knowing,',
    title_em: 'about printing clear.',
    issue_label: 'Issue №01 · Transparent Card',
    articles: [
      {
        num: '01',
        title: 'Translucent / Transparent vs Frosted / Touche — pick by the feel.',
        body: [
          '**Translucent / Transparent** is the clear-glass look — fully see-through where no ink lands, slight haze on translucent stock. Light passes through, whatever sits behind shows through, and the card reads as a window rather than a surface. $45/box at one box, down to $36 at ten.',
          '**Frosted Plastic / Touche** is the etched-glass look — light still passes, but with a velvet-matte diffusion that hides scratches and fingerprints. The stock feels softer in hand and reads as more premium in low light. Slightly pricier: $50/box at one box, $41 at ten. Same 0.5mm thickness, same 90×54mm business-card format.',
        ],
        side: {
          kind: 'list',
          label: 'Per-box rate (min)',
          rows: [
            { text: 'Translucent / Transparent', time: '$36/box @10' },
            { text: 'Frosted / Touche',          time: '$41/box @10' },
          ],
        },
      },
      {
        num: '02',
        title: 'White ink underbase — when it earns its keep.',
        body: [
          'Without white ink, your design prints translucent over the clear stock — a colour logo over a bright background behind the card will fade into the background. Fine for artistic effects where see-through *is* the point, wrong when the recipient needs to actually read your name.',
          '**Add white ink** and we lay down a white underbase exactly where your solid elements go — logo, typeface, name — before the colour pass. Those areas now read opaque while everything else stays clear. Setup is the expensive part (the white plate has to be made and registered), so surcharge is $40 for one box and only $5 per additional box after that — $85 total at ten boxes.',
        ],
        side: {
          kind: 'stat',
          num: '+$40',
          label: 'White ink setup',
          caption: '+$5 per extra box after',
        },
      },
      {
        num: '03',
        title: 'One box, ten boxes, ten different names — same volume rate.',
        body: [
          'The quantity step counts boxes, not names. Order ten boxes for ten different team members and every box gets priced at the ten-box rate — $360 for translucent, $410 for frosted, regardless of how many distinct names you list. Submit the names as one-per-line on the order; we match each name to a box in production.',
          'This is how name-card pricing should work and usually does not: most SG print shops either force a shared design across the batch, or charge set-up fees per name variant. We do neither. Each box is essentially its own design, priced at the pooled volume rate.',
        ],
        side: {
          kind: 'pills',
          label: 'Works for',
          items: [
            { pop: true, text: 'Agency team' },
            { text: 'Property agents' },
            { text: 'Clinic / studio' },
            { text: 'Sales rollout' },
          ],
        },
      },
      {
        num: '04',
        title: 'Designing for clear — the three rules that save a reprint.',
        body: [
          'Transparent print is unforgiving where opaque print is forgiving. Three things save a reprint: **(1)** send CMYK artwork with a named white-ink layer where you want opaque — we use that layer to drive the underbase; **(2)** keep body text at 10pt or above, since transparent ink + small type reads as haze from arm\'s length; **(3)** avoid gradient fades into full transparency — they print unevenly because there\'s no underbase to anchor the colour.',
          'Send print-ready art (PDF with fonts outlined, or layered AI) and we\'ll proof on-screen before press. Lead time is 3 working days from proof approval — add a day if the white-ink layer needs rebuilding.',
        ],
        side: {
          kind: 'list',
          label: 'Artwork checklist',
          rows: [
            { text: 'CMYK colour mode',        time: 'Required' },
            { text: 'White-ink layer named',   time: 'If using' },
            { text: 'Body text ≥ 10pt',        time: 'Required' },
            { text: 'Fonts outlined',          time: 'Required' },
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
        need: '*One person, one box* — clean clear card with logo reading solid',
        pick_title: 'Translucent, Add White Ink, 1 box',
        pick_detail: '$85 total · 100 cards · logo/text opaque over clear stock',
      },
      {
        need: 'Team of *ten*, each person gets their own box',
        pick_title: 'Translucent, Add White Ink, 10 boxes',
        pick_detail: '$445 total · $44.50/box blended · send 10 names, 10 designs, one price',
      },
      {
        need: 'Premium card for *agency or studio partners*',
        pick_title: 'Frosted / Touche, Add White Ink, 5 boxes',
        pick_detail: '$290 total · velvet stock, hides fingerprints, reads high-end',
      },
      {
        need: 'Artistic effect — you *want* the translucent look without solid logo',
        pick_title: 'Translucent, No White Ink, any qty',
        pick_detail: 'From $45/box · design prints see-through · strongest when held to light',
      },
      {
        need: 'Just *testing the stock* before committing to a big run',
        pick_title: 'Translucent, No White Ink, 1 box',
        pick_detail: '$45 · 100 cards to evaluate · step up to white ink or frosted on the next run',
      },
    ],
    right_note_title: 'One ladder, one rule.',
    right_note_body: 'Price scales on box count, not on how many names — order the team\'s boxes together and share the volume rate.',
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
    question: 'How many cards in a box?',
    answer: '100 cards. Pricing, volume tiers, and lead time all count by box — send us however many boxes you need and we pack 100 cards into each.',
  },
  {
    product_id: PID,
    display_order: 1,
    question: 'Can each box have a different name?',
    answer: 'Yes — that\'s the whole point of the volume pricing. Ten boxes can be ten different names for a ten-person team and you still pay the ten-box rate. Submit the names one-per-line on the order and we match each to a box in production.',
  },
  {
    product_id: PID,
    display_order: 2,
    question: 'What\'s the difference between translucent and frosted?',
    answer: 'Translucent / Transparent is clear-glass — light passes through cleanly, see-through where no ink is printed. Frosted Plastic / Touche is etched-glass — light still passes but diffused, velvet matte to the touch, hides fingerprints and scratches. Same 0.5mm PVC, same 90×54mm format, different feel.',
  },
  {
    product_id: PID,
    display_order: 3,
    question: 'Do I need white ink?',
    answer: 'Add white ink when you want logos or text to read solid and not take on whatever colour is behind the card. Skip it if the see-through effect *is* the design. Setup is $40 for the first box, +$5 per additional box — the expensive part is making the white plate, so adding more boxes barely costs more.',
  },
  {
    product_id: PID,
    display_order: 4,
    question: 'How much is volume pricing saving me?',
    answer: 'Per-box rate drops every extra box. Translucent goes from $45/box at one box to $36/box at ten — that\'s $90 saved over ten boxes versus one-off. Frosted drops $50 → $41 on the same ladder. Volume discount applies to the total box count, not per-name or per-design.',
  },
  {
    product_id: PID,
    display_order: 5,
    question: 'How should I send artwork?',
    answer: 'CMYK PDF with fonts outlined, or a layered AI with a named white-ink layer if you\'re using the underbase. Body text at 10pt minimum so it reads through the translucent stock. We proof on-screen before press and flag anything that will print unevenly.',
  },
  {
    product_id: PID,
    display_order: 6,
    question: 'How long does printing take?',
    answer: '3 working days from proof approval. Add a day if the white-ink layer needs rebuilding from your artwork.',
  },
  {
    product_id: PID,
    display_order: 7,
    question: 'Do transparent cards fit in a standard card holder?',
    answer: 'Yes — they\'re the standard 90×54mm business-card size at 0.5mm thick, same slot-fit as any other name card. The stock feels a touch lighter than PVC; frosted feels softer than clear.',
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
// 6. Spot-check — a few combos against the admin sheet
// -----------------------------------------------------------------------------
console.log('\nSpot-check (base rates, no white ink):');
console.log(`  TT :1 → $${prices['translucent_transparent:no:1']/100}  (expect 45)`);
console.log(`  TT :5 → $${prices['translucent_transparent:no:5']/100}  (expect 205)`);
console.log(`  TT :10 → $${prices['translucent_transparent:no:10']/100}  (expect 360)`);
console.log(`  FP :1 → $${prices['frosted_plastic_touche:no:1']/100}  (expect 50)`);
console.log(`  FP :5 → $${prices['frosted_plastic_touche:no:5']/100}  (expect 230)`);
console.log(`  FP :10 → $${prices['frosted_plastic_touche:no:10']/100}  (expect 410)`);
console.log('\nSpot-check (with white ink):');
console.log(`  TT+WI:1  → $${prices['translucent_transparent:yes:1']/100}  (expect 45+40=85)`);
console.log(`  TT+WI:5  → $${prices['translucent_transparent:yes:5']/100}  (expect 205+60=265)`);
console.log(`  TT+WI:10 → $${prices['translucent_transparent:yes:10']/100}  (expect 360+85=445)`);
console.log(`  FP+WI:10 → $${prices['frosted_plastic_touche:yes:10']/100}  (expect 410+85=495)`);
console.log(`\nmin across table → $${Math.min(...Object.values(prices))/100}`);
