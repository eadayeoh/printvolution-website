// Transparent Card — split Transparent and Translucent into separate
// material choices. They share the same price column (the cheaper of
// the two in the admin sheet), but they are distinct stocks, so a
// single grouped option was wrong.
//
// Result: 3 material options
//   transparent              — cheaper price column ($45 → $36/box)
//   translucent              — cheaper price column (same prices)
//   frosted_plastic_touche   — pricier column ($50 → $41/box)
//
// Everything else — white_ink axis, qty tiers, surcharge formula,
// lead time, h1 + h1em — stays as the previous patch left it.

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
// 1. pricing_table: rebuild with 3 materials
// -----------------------------------------------------------------------------
const MATERIALS = [
  {
    slug: 'transparent',
    label: 'Transparent',
    note: 'Fully see-through clear PVC · 100/box',
    swatch: '#E5F5FD',
  },
  {
    slug: 'translucent',
    label: 'Translucent',
    note: 'Soft-haze clear PVC · 100/box',
    swatch: '#C8DCE6',
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

// Per-box rate in cents for each price column.
const CLEAR_PER_BOX = {
  1: 4500, 2: 4400, 3: 4300, 4: 4200, 5: 4100,
  6: 4000, 7: 3900, 8: 3800, 9: 3700, 10: 3600,
};
const FROSTED_PER_BOX = {
  1: 5000, 2: 4900, 3: 4800, 4: 4700, 5: 4600,
  6: 4500, 7: 4400, 8: 4300, 9: 4200, 10: 4100,
};

// Transparent and translucent share the cheaper column; frosted/touche
// has its own column.
const PER_BOX_CENTS = {
  transparent: CLEAR_PER_BOX,
  translucent: CLEAR_PER_BOX,
  frosted_plastic_touche: FROSTED_PER_BOX,
};

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
  prices,
};

// -----------------------------------------------------------------------------
// 2. products row — update pricing_table only
// -----------------------------------------------------------------------------
const prodRes = await fetch(`${BASE}/rest/v1/products?id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ pricing_table: pricingTable }),
});
if (!prodRes.ok) throw new Error(`PATCH products: ${prodRes.status} ${await prodRes.text()}`);
console.log('✓ pricing_table rebuilt with 3 material options');

// -----------------------------------------------------------------------------
// 3. product_configurator — update the material step options in place
// -----------------------------------------------------------------------------
const stepsRes = await fetch(`${BASE}/rest/v1/product_configurator?product_id=eq.${PID}&step_id=eq.material`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({
    options: MATERIALS.map((m) => ({ slug: m.slug, label: m.label, note: m.note, swatch: m.swatch })),
  }),
});
if (!stepsRes.ok) throw new Error(`PATCH configurator material: ${stepsRes.status} ${await stepsRes.text()}`);
console.log('✓ material step updated with 3 options');

// -----------------------------------------------------------------------------
// 4. product_extras — patch the copy that conflated the two materials.
//    intro, seo_desc, seo_body, seo_magazine.articles[0], matcher rows.
//    Leave h1 + h1em alone.
// -----------------------------------------------------------------------------
const xRes0 = await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}&select=*`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const extrasRow = (await xRes0.json())[0];

const EXTRAS_PATCH = {
  seo_desc: 'Transparent, translucent and frosted PVC name card printing in Singapore. 100 cards per box, mix names across boxes, from $45/box for one box down to $36/box at ten. White ink underbase available. 3 working days.',
  intro: 'Transparent, translucent, or frosted PVC name cards — 100 to a box, priced per box. Transparent and Translucent share the cheaper ladder ($45/box at one box, down to $36/box at ten); Frosted / Touche runs $50 to $41 on the same qty steps. Each box can carry a different name — order ten boxes for a ten-person team, ten designs, one volume rate. Add a white-ink underbase when you need logo or text to read solid over the clear stock. 3 working days from artwork approval.',
  seo_body: 'Transparent card printing Singapore — transparent, translucent and frosted PVC at 0.5mm, 100 cards per box, volume priced by box count with name-mixing across boxes at no extra charge. White ink underbase optional for solid elements. 3 working days lead time.',
  seo_magazine: {
    ...(extrasRow.seo_magazine ?? {}),
    articles: (extrasRow.seo_magazine?.articles ?? []).map((a, i) => {
      if (i !== 0) return a;
      // Rewrite Article 01 to reflect three materials (two price columns).
      return {
        ...a,
        title: 'Transparent, Translucent, Frosted — three stocks, two price columns.',
        body: [
          '**Transparent** is the clean see-through — fully clear where no ink lands, the strongest window-effect when held to light. **Translucent** is the diffused clear — a soft haze that takes the edge off direct see-through, still lets light through but blurs whatever sits behind the card. Both are 0.5mm PVC in the 90×54mm business-card format, both share the same price ladder: $45/box at one box, down to $36/box at ten.',
          '**Frosted Plastic / Touche** is the etched-glass look — velvet-matte surface, hides fingerprints and micro-scratches, reads more premium in low light. Slightly pricier column: $50/box at one, $41 at ten. Same stock thickness, same size. Pick Transparent for the clearest read-through, Translucent for a softer effect, Frosted for tactile premium feel.',
        ],
        side: {
          kind: 'list',
          label: 'Per-box rate (min)',
          rows: [
            { text: 'Transparent',            time: '$36/box @10' },
            { text: 'Translucent',            time: '$36/box @10' },
            { text: 'Frosted / Touche',       time: '$41/box @10' },
          ],
        },
      };
    }),
  },
  matcher: {
    ...(extrasRow.matcher ?? {}),
    rows: [
      {
        need: '*One person, one box* — clean clear card with logo reading solid',
        pick_title: 'Transparent, Add White Ink, 1 box',
        pick_detail: '$85 total · 100 cards · logo/text opaque over clear stock',
      },
      {
        need: 'Team of *ten*, each person gets their own box',
        pick_title: 'Transparent, Add White Ink, 10 boxes',
        pick_detail: '$445 total · $44.50/box blended · send 10 names, 10 designs, one price',
      },
      {
        need: 'Softer look — *haze* instead of full clarity',
        pick_title: 'Translucent, Add White Ink, 5 boxes',
        pick_detail: '$265 total · diffused see-through · reads softer than fully transparent',
      },
      {
        need: 'Premium card for *agency or studio partners*',
        pick_title: 'Frosted / Touche, Add White Ink, 5 boxes',
        pick_detail: '$290 total · velvet stock, hides fingerprints, reads high-end',
      },
      {
        need: 'Artistic effect — you *want* the clear look without solid logo',
        pick_title: 'Transparent, No White Ink, any qty',
        pick_detail: 'From $45/box · design prints see-through · strongest when held to light',
      },
    ],
  },
};

const extrasRes = await fetch(`${BASE}/rest/v1/product_extras?product_id=eq.${PID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify(EXTRAS_PATCH),
});
if (!extrasRes.ok) throw new Error(`PATCH extras: ${extrasRes.status} ${await extrasRes.text()}`);
console.log('✓ extras copy updated (h1 + h1em preserved)');

// -----------------------------------------------------------------------------
// 5. FAQ 2 — rewrite the "difference" answer to cover 3 materials
// -----------------------------------------------------------------------------
const faqRes = await fetch(
  `${BASE}/rest/v1/product_faqs?product_id=eq.${PID}&display_order=eq.2`,
  {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({
      question: 'What\'s the difference between transparent, translucent, and frosted?',
      answer: 'Transparent is fully clear — see through the card to whatever is behind it, strongest window-effect when held to light. Translucent is diffused clear — a soft haze that still lets light through but blurs what\'s behind. Frosted Plastic / Touche is etched-glass — velvet matte to the touch, hides fingerprints and scratches, reads more premium. Transparent and Translucent share the cheaper price column; Frosted sits one column up. Same 0.5mm PVC, same 90×54mm format.',
    }),
  },
);
if (!faqRes.ok) throw new Error(`PATCH faq: ${faqRes.status} ${await faqRes.text()}`);
console.log('✓ faq 2 updated for 3-material wording');

// -----------------------------------------------------------------------------
// 6. Spot-check
// -----------------------------------------------------------------------------
console.log('\nSpot-check (no white ink):');
for (const m of ['transparent', 'translucent', 'frosted_plastic_touche']) {
  for (const q of [1, 5, 10]) {
    console.log(`  ${m.padEnd(24)}:no:${String(q).padStart(2)} → $${prices[`${m}:no:${q}`]/100}`);
  }
}
console.log(`\nmin across table → $${Math.min(...Object.values(prices))/100}`);
