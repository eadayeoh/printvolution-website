// Rewrites table-tent page content. Keyword: "Table Tent Printing Singapore".
//
// Current pricing config (pricing_table, 52 price points):
//   Type        — TC-01 / TC-02 / TC-03 / TC-04
//   Material    — 310gsm Art Card (single)
//   Lamination  — Matt Lamination (2-sided)
//   Spot UV     — No / Yes (1 side)
//   Qty         — 100 / 200 / 300 / 500 / 1000 / 2000 / 3000 (tier-snap)
//   Lead time   — 7 working days, offset-printed
//
// Writes ONLY to product_extras + product_faqs. Configurator untouched.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = await fs.readFile(path.join(root, '.env.local'), 'utf8');
for (const raw of envFile.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false });

const h1 = 'Table Tent Printing Singapore';
const h1em = 'offset-run, restaurant-ready.';

const tagline =
  'Table tent printing in Singapore — four supplier shapes (TC-01 to TC-04), 310gsm art card with matt lamination, optional Spot UV, offset-run from 100 to 3,000 pieces in seven working days.';

const description =
  'Table tent printing in Singapore for restaurants, cafés, hotels, conference venues and retail counters. Four supplier shapes (TC-01 to TC-04) on 310gsm art card, matt-laminated both sides, optional 1-side Spot UV upgrade. Tier-priced from 100 pieces upward; offset-run for consistent colour across the whole batch.';

const intro =
  'Table tents are the fold-and-stand card you see on restaurant, café and hotel tables — menus, QR codes, specials, event info, room-service details. We offer four supplier shapes (TC-01, TC-02, TC-03, TC-04) on 310gsm art card, matt-laminated on both sides for wipe-clean durability. Spot UV on one side is an optional upgrade that adds tactile gloss to the brand or hero image without changing the matt feel of the rest of the card. Pricing is tier-snapped — 100, 200, 300, 500, 1,000, 2,000 and 3,000 pieces — and offset-run for consistent colour from card 1 to card 3,000.';

// SEO attributes: use-cases + location + lead time only. No material
// names or print specs.
const seo_title = 'Table Tent Printing Singapore | Restaurant, Café, Hotel & Retail Counter Cards';
const seo_desc =
  'Table tent printing Singapore for restaurants, cafés, hotels, conference venues and retail counters. Four supplier shapes, tier-priced from 100 to 3,000 pieces, seven working days.';

const seo_body =
  'Table tent printing Singapore — restaurant menus and specials, café QR-order cards, hotel in-room service cards, conference-venue seating tents, retail counter promotions, event registration-desk cards, catering buffet labels, wedding-table stationery. ' +
  'Four supplier shapes, matt-laminated art card, optional Spot UV upgrade on one side — offset-run from 100 to 3,000 pieces, seven working days, collected at Paya Lebar Square or delivered island-wide free over S$150.';

// Price math for matcher
const PRICES = {
  'tc01:no':  { 100: 127.60, 200: 157.80, 300: 187.80, 500: 236.70, 1000: 326.70, 2000: 564.00, 3000: 855.70 },
  'tc02:no':  { 100: 236.30, 200: 277.80, 300: 337.80, 500: 416.70, 1000: 596.70, 2000: 995.90, 3000: 1503.80 },
  'tc03:no':  { 100: 290.60, 200: 337.80, 300: 412.80, 500: 506.70, 1000: 731.70, 2000: 1211.80, 3000: 1827.90 },
  'tc04:no':  { 100: 381.20, 200: 437.80, 300: 537.80, 500: 656.70, 1000: 956.70, 2000: 1571.70, 3000: 2368.00 },
  'tc01:yes': { 100: 181.40, 300: 211.60, 500: 272.30, 1000: 368.50, 2000: 714.00, 3000: 1065.10 },
  'tc02:yes': { 100: 343.80, 300: 385.30, 500: 488.00, 1000: 680.40, 2000: 1295.90, 3000: 1922.70 },
  'tc03:yes': { 100: 425.00, 300: 472.20, 500: 595.80, 1000: 836.40, 2000: 1586.80, 3000: 2351.50 },
  'tc04:yes': { 100: 560.40, 300: 617.00, 500: 775.50, 1000: 1096.30, 2000: 2071.70, 3000: 3066.10 },
};
const p = (type, uv, qty) => PRICES[`${type}:${uv}`][qty]?.toFixed(2) ?? '—';

const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the venue,\nwe'll tell you",
  title_em: 'the spec.',
  right_note_title: 'Matt-lam, fold, stand.',
  right_note_body:
    'Offset-printed, matt-laminated both sides, die-cut to the shape you pick — ship flat-pack, fold and stand at the venue.',
  rows: [
    {
      need: '*Restaurant menu refresh* — 200 table tents for the season\'s new dishes',
      pick_title: 'TC-01 · Matt Lamination · 200 pcs',
      pick_detail: `TC-01 is the smallest / cheapest shape — fine for brief menu updates and counter cards. 200 pcs Matt lam = S$${p('tc01','no',200)}. Seven working days.`,
      apply: { type: 'tc01', material: '310gsm', lam: 'matt', spotuv: 'no', qty: 200 },
    },
    {
      need: '*Café QR-order cards* — 500 with a Spot UV logo on the front',
      pick_title: 'TC-02 · Matt Lamination + 1-side Spot UV · 500 pcs',
      pick_detail: `TC-02 is the café-counter standard size. Matt lam for wipe-clean durability, Spot UV on the logo side for a tactile premium touch. 500 pcs = S$${p('tc02','yes',500)}.`,
      apply: { type: 'tc02', material: '310gsm', lam: 'matt', spotuv: 'yes', qty: 500 },
    },
    {
      need: '*Hotel in-room service cards* — 1,000 across 200 rooms, TC-03 format',
      pick_title: 'TC-03 · Matt Lamination · 1,000 pcs',
      pick_detail: `TC-03 is the larger in-room format — room service, spa, housekeeping menus. 1,000 pcs at the tier rate = S$${p('tc03','no',1000)}. Matt lam stays clean through guest handling.`,
      apply: { type: 'tc03', material: '310gsm', lam: 'matt', spotuv: 'no', qty: 1000 },
    },
    {
      need: '*Conference venue tabletop signage* — 2,000 of the largest TC-04 format',
      pick_title: 'TC-04 · Matt Lamination + Spot UV · 2,000 pcs',
      pick_detail: `TC-04 is the largest / most visible shape. With Spot UV the venue branding reads premium under ballroom lighting. 2,000 pcs = S$${p('tc04','yes',2000)}.`,
      apply: { type: 'tc04', material: '310gsm', lam: 'matt', spotuv: 'yes', qty: 2000 },
    },
    {
      need: '*Small boutique launch* — 100 table tents, tight budget',
      pick_title: 'TC-01 · Matt Lamination · 100 pcs',
      pick_detail: `Cheapest entry on the calculator: S$${p('tc01','no',100)}. 100 pcs of TC-01 with matt lam — enough to cover a boutique\'s floor + counter without overstocking.`,
      apply: { type: 'tc01', material: '310gsm', lam: 'matt', spotuv: 'no', qty: 100 },
    },
  ],
};

const seo_magazine = {
  issue_label: 'Issue · Table Tent Printing',
  title: 'Everything worth knowing,',
  title_em: 'before you fold.',
  lede:
    'A table tent is the fold-and-stand card that sits on a restaurant or café table — menus, specials, QR codes, event info, room service. Four things decide whether it reads premium at the venue or wholesale-fair: **shape, stock + lamination, Spot UV, and how you price the batch**. Here is what matters on each.',
  articles: [
    {
      num: '01',
      title: 'Shape — TC-01 to TC-04, pick by what will sit on the table.',
      body: [
        'The four supplier shapes (TC-01, TC-02, TC-03, TC-04) are graduated footprints — TC-01 the compact counter / café size, TC-04 the larger ballroom / conference-table size. Each is priced differently at the same quantity: at 100 pcs, TC-01 is S$127.60, TC-02 is S$236.30, TC-03 is S$290.60, TC-04 is S$381.20. Pick by the table, the reading distance, and how much copy needs to fit.',
        'As a rule of thumb, **TC-01 / TC-02** suit café counters, bar menus, tight tables and takeout shelves — close-reading distance, short copy. **TC-03 / TC-04** suit conference rooms, ballroom tables, hotel lobbies and seated-dinner venues — further reading, more copy, or larger brand visuals.',
      ],
      side: {
        kind: 'list',
        label: 'Shape cheat sheet',
        rows: [
          { text: 'Café counter', time: 'TC-01 / TC-02' },
          { text: 'Restaurant table', time: 'TC-02 / TC-03' },
          { text: 'Hotel in-room', time: 'TC-03' },
          { text: 'Ballroom / venue', time: 'TC-04' },
        ],
      },
    },
    {
      num: '02',
      title: '310gsm with matt lamination — the venue-durable default.',
      body: [
        '**310gsm Art Card with 2-sided Matt Lamination** is the default — and for good reason. The matt lam protects the card from drink rings, finger smudges, spilled condiments, and the repeated wipe-down that restaurant and café staff give every surface. Matt reads premium under warm overhead lighting (no glare on customer-facing menus) and holds up cleanly to a multi-week run on the table.',
        'The lam is applied to both faces, so whether the tent is folded open to show one side or the other, the durability is the same. 310gsm is the stock sweet spot — rigid enough to stand without buckling, not so thick that it is hard to fold cleanly at the score line.',
      ],
      side: {
        kind: 'pills',
        label: 'Finish',
        items: [
          { text: '310gsm art card', pop: true },
          { text: 'Matt lam both sides' },
          { text: 'Wipe-clean durable' },
          { text: 'Rigid but foldable' },
        ],
      },
    },
    {
      num: '03',
      title: 'Spot UV — when the extra ~40% lift is worth it.',
      body: [
        'Spot UV is a clear gloss coating applied only on the chosen side — usually around the brand logo, a hero dish photo, or a key call-out. It sits physically on the matt-laminated card surface, catching light and creating a subtle tactile difference. On table tents it upgrades the card from "informational" to "branded-and-premium" without changing the typography or colour scheme.',
        'The upcharge is meaningful — roughly 40% more at low volumes. TC-01 at 100 pcs goes from S$127.60 (no UV) to S$181.40 (with UV); TC-04 at 500 pcs goes from S$656.70 to S$775.50. Worth the jump for hospitality-grade and launch-grade work; skip it for short-run internal signage.',
      ],
      side: {
        kind: 'stat',
        label: 'UV lift at TC-01 × 100',
        num: '+42%',
        caption: 'S$127.60 → S$181.40',
      },
    },
    {
      num: '04',
      title: 'Bulk tiers — where the per-piece cost halves (and more).',
      body: [
        'Tier pricing rewards scale hard. TC-01 at 100 pcs is S$1.28/pc; at 3,000 pcs it drops to S$0.29/pc — roughly a 78% per-piece saving. Same pattern on every shape: the plate setup cost amortises across larger runs, and offset kicks in. Plan orders accordingly — if you need 600 over the year, ordering 1,000 up front is cheaper per piece than two runs of 500.',
        'Files we prefer: **Adobe Illustrator (.AI) or print-ready PDF**, CMYK colour, 300dpi, 3mm bleed on every edge, fonts outlined. Place the fold / score line on its own layer labelled "FOLD" so the finishing operator can score cleanly. Critical text should sit at least 5mm from the score so the fold does not cross a letter.',
      ],
      side: {
        kind: 'list',
        label: 'Per-piece drop (TC-01, no UV)',
        rows: [
          { text: '100 pcs', time: 'S$1.28' },
          { text: '500 pcs', time: 'S$0.47' },
          { text: '1,000 pcs', time: 'S$0.33' },
          { text: '3,000 pcs', time: 'S$0.29' },
        ],
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '📄',
    title: 'Four supplier shapes',
    desc: 'TC-01 to TC-04 — graduated footprints from café-counter size up to ballroom tabletop scale. Pick by venue, table, and copy length.',
  },
  {
    icon_url: null,
    emoji: '✨',
    title: 'Matt lam both sides',
    desc: '310gsm art card, 2-sided matt lamination — wipe-clean through drink rings, finger smudges, and repeated table wipe-downs.',
  },
  {
    icon_url: null,
    emoji: '💎',
    title: 'Optional 1-side Spot UV',
    desc: 'Clear-gloss overlay on the logo or hero image for a tactile premium touch. Adds roughly 40% at low volumes; worth it for launches and hospitality.',
  },
  {
    icon_url: null,
    emoji: '🖨️',
    title: 'Offset-run for colour consistency',
    desc: 'Plate setup amortises from 100 pcs up; colour locks identical from card 1 to card 3,000. Per-piece drops sharply at 1,000+ tiers.',
  },
];

const faqs = [
  {
    question: 'How are the four shapes (TC-01 to TC-04) different?',
    answer:
      'TC-01 is the most compact footprint — café-counter cards, takeout-shelf signage, tight restaurant tables. TC-02 steps up for standard café / restaurant tables. TC-03 is the larger in-room / restaurant size — good for room-service cards, seated-dinner menus. TC-04 is the largest — conference tabletops, ballroom signage, launch events. Each shape is priced differently at the same quantity; scroll the Volume Pricing table on this page to compare exact rates.',
  },
  {
    question: 'Which stock and finish do you offer?',
    answer:
      '310gsm Art Card with 2-sided matt lamination is the standard and only stock combo. 310gsm is rigid enough to stand without buckling but folds cleanly at the score. Matt lam protects both faces of the card from drink rings, finger smudges, and the repeated wipe-downs restaurants and cafés give every surface. The lam also reads premium under warm overhead lighting — no glare on customer-facing menus.',
  },
  {
    question: 'What does "Spot UV" add?',
    answer:
      'Spot UV is a clear gloss coating applied only on the chosen side, usually around the brand logo or a hero image. It sits on top of the matt lamination, catching light for a tactile premium feel without changing the typography or colour scheme. The upcharge varies by shape + quantity — roughly 40% more at 100 pcs, narrowing at higher tiers. Worth picking for hospitality-grade, launch-grade, or brand-refresh work.',
  },
  {
    question: 'What is the minimum order, and how do quantity tiers work?',
    answer:
      'Minimum 100 pieces. Price tiers are 100, 200, 300, 500, 1,000, 2,000, 3,000. The calculator snaps your typed quantity to the nearest tier at or below what you entered (type 750 and you snap to the 500 tier). You order and receive the tier quantity the calculator shows — we do not quote custom in-between numbers on table tents. Note: the Spot UV option does not quote 200 pcs — at 200 with Spot UV the price snaps to the 100-pc rate.',
  },
  {
    question: 'How long does production take?',
    answer:
      'Seven working days from artwork approval to ready-for-collection at Paya Lebar Square. That covers plate setup, offset print, matt lamination, Spot UV (when picked), die-cut to the shape, and scoring + folding prep. Free delivery within Singapore on orders over S$150; otherwise collected free at Paya Lebar Square any working day.',
  },
  {
    question: 'Do the tents ship folded or flat-pack?',
    answer:
      'Flat-pack — the cards are pre-scored but not folded, so they stack flat for transport. At the venue, fold along the score line and stand the tent on the table. This keeps shipping volume low on bulk orders and avoids crease marks during transit. The score line holds a clean fold through repeated deploy / fold-down cycles.',
  },
  {
    question: 'Do you print double-sided?',
    answer:
      'Yes — both faces of the card are printed by default. Put the primary message (menu, specials, QR code) on one side and the secondary on the other (contact info, social handles, venue map, disclaimers). Double-sided print does not upcharge on table tents; the supplier quote already includes both faces at the tier rate.',
  },
  {
    question: 'What artwork format do you need?',
    answer:
      'Adobe Illustrator (.AI) file or a print-ready PDF — CMYK colour, 300dpi, 3mm bleed on every edge, fonts outlined. Place the fold / score line on its own named layer ("FOLD" or "SCORE") so the finishing operator can isolate it cleanly. Critical text should sit at least 5mm away from the score line so the fold does not cross a letter. Free file check inside 12 hours — if bleed is short, a colour is in RGB, or the fold line is missing you hear from us the same business day.',
  },
];

function mergeHowWePrintIcons(newCards, existingCards) {
  if (!Array.isArray(existingCards) || existingCards.length === 0) return newCards;
  const byTitle = new Map();
  existingCards.forEach((c, i) => {
    if (c?.title) byTitle.set(c.title, { icon_url: c.icon_url ?? null, index: i });
  });
  return newCards.map((card, i) => {
    const titleMatch = card.title ? byTitle.get(card.title) : null;
    const existingIconByIndex = existingCards[i]?.icon_url ?? null;
    const preservedIcon = titleMatch?.icon_url ?? existingIconByIndex ?? null;
    return preservedIcon ? { ...card, icon_url: preservedIcon } : card;
  });
}

try {
  const [prod] = await sql`select id from public.products where slug='table-tent'`;
  if (!prod) throw new Error('table-tent not found');

  const [existingExtras] = await sql`
    select how_we_print from public.product_extras where product_id = ${prod.id}
  `;
  const mergedHowWePrint = mergeHowWePrintIcons(how_we_print, existingExtras?.how_we_print);

  await sql`update public.products set tagline = ${tagline}, description = ${description} where id = ${prod.id}`;
  await sql`
    insert into public.product_extras (product_id, seo_title, seo_desc, seo_body, h1, h1em, intro, matcher, seo_magazine, how_we_print)
    values (${prod.id}, ${seo_title}, ${seo_desc}, ${seo_body}, ${h1}, ${h1em}, ${intro}, ${sql.json(matcher)}, ${sql.json(seo_magazine)}, ${sql.json(mergedHowWePrint)})
    on conflict (product_id) do update
      set seo_title = excluded.seo_title, seo_desc = excluded.seo_desc, seo_body = excluded.seo_body,
          h1 = excluded.h1, h1em = excluded.h1em, intro = excluded.intro,
          matcher = excluded.matcher, seo_magazine = excluded.seo_magazine, how_we_print = excluded.how_we_print
  `;
  await sql`delete from public.product_faqs where product_id = ${prod.id}`;
  for (let i = 0; i < faqs.length; i++) {
    await sql`insert into public.product_faqs (product_id, question, answer, display_order)
              values (${prod.id}, ${faqs[i].question}, ${faqs[i].answer}, ${i})`;
  }
  console.log('✓ table-tent content rewritten');
  console.log('  h1:', h1, '·', h1em);
} finally {
  await sql.end();
}
