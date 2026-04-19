// Rewrites roll-up-banner page content. Keyword: "Roll Up Banner Singapore".
//
// Current pricing config:
//   Size       — 60cm × 160cm / 85cm × 200cm (same per-unit price)
//   Material   — Poster Paper (included)
//   Lamination — Matt / Gloss (both included)
//   Quantity   — 1 through 10 presets; per-unit volume discount
//                formula: qty * (75 - Math.min(10, 1 * (qty - 1)))
//   Lead time  — 1 working day, Eco Solvent print
//
// Price math: $75 at qty 1, drops $1 per extra banner up to $10 off —
// so $65/pc from qty 11+.
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

const h1 = 'Roll Up Banner Singapore';
const h1em = 'stand up, zip shut, go.';

const tagline =
  'Roll-up banner printing in Singapore — 60×160 cm or 85×200 cm, poster paper with matt or gloss lamination, print-and-stand from S$75 per banner. Same-day production, free delivery over S$150.';

const description =
  'Roll-up banner printing in Singapore for roadshows, exhibition booths, product launches, corporate events, shop promotions and pop-ups. Choose the 60×160 cm or 85×200 cm size, matt or gloss lamination, and pay S$75 per banner — drops $1 per extra banner to $65 per banner at qty 11 and above. Eco-solvent print on poster paper, 1 working day turnaround.';

const intro =
  'Roll-up banners are the fold-into-a-tube, pull-up-on-two-legs floor sign you see at every booth, roadshow and launch in Singapore. The whole unit ships inside its own base — you zip it open, pull the banner up, lock the pole in place, and it stands. We print on poster paper with either matt or gloss lamination (both included), eco-solvent so the ink survives handling without smudge. Price is flat at S$75 for a single banner; each extra banner drops S$1 off the per-unit rate up to a S$10 ceiling, so 11+ banners run at S$65 each. Two sizes cover almost every brief — 60×160 cm for narrow aisles and carousel placement, 85×200 cm for lobby-scale and booth front-row.';

// SEO attributes — use-cases + location + lead time only.
const seo_title = 'Roll Up Banner Printing Singapore | Exhibition, Roadshow & Booth Banners';
const seo_desc =
  'Roll-up banner printing in Singapore for roadshows, exhibitions, booths, product launches and shop promotions. From S$75/banner, drops to S$65/pc at qty 11+. Same-day production.';

const seo_body =
  'Roll-up banner printing Singapore — exhibition booths, roadshow backdrops, mall-activation pull-ups, product-launch stands, trade-show aisle signs, conference entrance banners, shop-window promos, job-fair booth signs, religious-festival pull-ups, corporate-lobby signage. ' +
  'Two standard sizes (60 × 160 cm and 85 × 200 cm), matt or gloss lamination, print-and-stand kit ships inside its own base — from S$75 per banner, S$1 off per extra up to S$10 ceiling, same-day production, collected at Paya Lebar Square or delivered island-wide free over S$150.';

// Per-piece at qty = 75 - min(10, qty - 1)
function pp(qty) { return 75 - Math.min(10, qty - 1); }
function total(qty) { return qty * pp(qty); }

const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the use,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'Print, stand, done.',
  right_note_body:
    'Kit ships zipped. Unzip, pull the banner up, lock the pole — ~30 seconds to deploy. Fits indoor or short outdoor use.',
  rows: [
    {
      need: '*Single booth banner* — one-off exhibition stand for the weekend show',
      pick_title: '85cm × 200cm · Matt Lamination · 1 pc',
      pick_detail: `One banner at the standard booth size. S$${pp(1)}/pc · total S$${total(1)}. Same-day production if artwork is approved by 11am.`,
      apply: { size: '85x200', material: 'pvc', lamination: 'matt', qty: 1 },
    },
    {
      need: '*Mall roadshow across 3 entrances* — three matching banners',
      pick_title: '60cm × 160cm · Gloss Lamination · 3 pcs',
      pick_detail: `Narrow format for mall aisles. $1 off per extra banner kicks in — S$${pp(3)}/pc × 3 = S$${total(3)}. Gloss lam makes product shots pop under mall lighting.`,
      apply: { size: '60x160', material: 'pvc', lamination: 'gloss', qty: 3 },
    },
    {
      need: '*Product launch 5-city tour* — same banner at every venue',
      pick_title: '85cm × 200cm · Matt Lamination · 5 pcs',
      pick_detail: `Bulk run: S$${pp(5)}/pc × 5 = S$${total(5)}. Matt lam reads premium across lobby lighting; the ink stays consistent across all 5 pieces.`,
      apply: { size: '85x200', material: 'pvc', lamination: 'matt', qty: 5 },
    },
    {
      need: '*Trade show booth, 10 booth stands for a regional chain*',
      pick_title: '85cm × 200cm · Gloss Lamination · 10 pcs',
      pick_detail: `The $10-off-per-banner discount plateaus here: S$${pp(10)}/pc × 10 = S$${total(10)}. Every subsequent banner stays at S$65/pc — worth planning bulk orders around this threshold.`,
      apply: { size: '85x200', material: 'pvc', lamination: 'gloss', qty: 10 },
    },
    {
      need: '*Chain rollout* — 15 matching roll-ups for a brand refresh',
      pick_title: '60cm × 160cm · Matt Lamination · 15 pcs',
      pick_detail: `Past qty 10 the per-banner price floors at S$65/pc: S$${pp(15)}/pc × 15 = S$${total(15)}. Still one working day to print; the chain can deploy in parallel.`,
      apply: { size: '60x160', material: 'pvc', lamination: 'matt', qty: 15 },
    },
  ],
};

const seo_magazine = {
  issue_label: 'Issue · Roll Up Banner Printing',
  title: 'Everything worth knowing,',
  title_em: 'before the booth opens.',
  lede:
    'A roll-up banner is the simplest pop-up sign in the toolkit — one banner, one base, one pole. Four things decide whether it reads premium at the booth or cheap-wholesale: **size, lamination, artwork prep, and how the stand holds up across the day**. Here is what matters on each.',
  articles: [
    {
      num: '01',
      title: 'Pick the size by where it will stand.',
      body: [
        '**60 × 160 cm** is the narrow-aisle and carousel size — fits a mall roadshow lane, a booth corner, a shop-window corner, or anywhere two retractable banners need to bracket an entrance without blocking traffic. Also the picks for space-constrained lobbies and conference registration desks.',
        '**85 × 200 cm** is the front-of-booth / lobby-centrepiece size — tall enough to read from across a hall, wide enough to carry a full product shot plus tagline plus logo. Default for front-row exhibition stands, product launches, and any scenario where the banner is the main visual. Same price as the narrow size — no upcharge for the larger print area.',
      ],
      side: {
        kind: 'list',
        label: 'Size by venue',
        rows: [
          { text: 'Mall aisle', time: '60×160 cm' },
          { text: 'Booth corner', time: '60×160 cm' },
          { text: 'Lobby centrepiece', time: '85×200 cm' },
          { text: 'Trade show front', time: '85×200 cm' },
        ],
      },
    },
    {
      num: '02',
      title: 'Matt or gloss lamination — both included.',
      body: [
        '**Matt lamination** reads premium under direct lighting (booth spotlights, mall overheads) and resists fingerprints across a day of visitors brushing past. Pick it when the banner has heavy dark areas, skin tones, or copy-heavy layouts where glare would spoil readability.',
        '**Gloss lamination** saturates colour and makes photography pop. Pick it for product shots, food photography, vibrant brand colours, or any banner where the subject is the image itself. Both are included — no upcharge either way — so pick by venue and artwork, not by budget.',
      ],
      side: {
        kind: 'pills',
        label: 'Lamination',
        items: [
          { text: 'Matt — default', pop: true },
          { text: 'Gloss — richer' },
          { text: 'Both included' },
          { text: 'Pick by lighting' },
        ],
      },
    },
    {
      num: '03',
      title: 'Bulk pricing — every extra banner drops the rate.',
      body: [
        'Roll-ups drop **S$1 per extra banner off the per-unit rate**, up to a ceiling of S$10 off. That means 1 banner is S$75, 2 banners are S$74 each (total S$148), 5 banners are S$71 each, and 10 banners plateau at S$65 each (total S$650). Every banner past 10 stays at S$65/pc — the best per-unit rate the price ladder offers.',
        'If your brief spans multiple venues, events, or a chain rollout, the discount matters: a 15-banner order is S$975, which works out to the same S$65/pc as the 11-banner order. For one-off single banners the full S$75 rate applies and the volume discount does nothing.',
      ],
      side: {
        kind: 'stat',
        label: 'Best per-unit',
        num: 'S$65',
        caption: 'from 11 banners onward',
      },
    },
    {
      num: '04',
      title: 'Files, bleed, and what the stand does after the event.',
      body: [
        'Send an **Adobe Illustrator (.AI) file or print-ready PDF** — CMYK colour, 300dpi at the final banner size, 3mm bleed on every edge, fonts outlined. The **bottom 100mm** of the banner disappears into the base when the banner stands — keep critical copy above that zone. Position the logo in the **top third** so it reads from across the hall before the banner is fully unfurled.',
        'The stand itself is the reusable part: aluminium base, lightweight retractable pole, zipped carry case. Replacement banners only (no new base) can be reprinted and swapped into the existing base — keep the stand, print fresh artwork for the next campaign. Tell us if you are ordering a reprint; we will quote just the banner-roll at a reduced rate.',
      ],
      side: {
        kind: 'stat',
        label: 'Hidden at base',
        num: '100mm',
        caption: 'keep critical copy above this line',
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '📏',
    title: 'Two standard sizes',
    desc: '60 × 160 cm for narrow aisles, 85 × 200 cm for booth fronts and lobbies. Same per-unit price — pick by venue.',
  },
  {
    icon_url: null,
    emoji: '✨',
    title: 'Matt or gloss lam',
    desc: 'Both included at no upcharge. Matt for booth spotlights, gloss for product shots. Pick by lighting and artwork.',
  },
  {
    icon_url: null,
    emoji: '💰',
    title: 'Volume discount to S$65/pc',
    desc: '$1 off per extra banner, max $10 off. From 11 banners onward every banner is S$65 — the best rate on the ladder.',
  },
  {
    icon_url: null,
    emoji: '📦',
    title: 'Zip case + 30-sec deploy',
    desc: 'Ships inside its own zipped base. Unzip, pull up the banner, lock the pole — ready to stand in ~30 seconds.',
  },
];

const faqs = [
  {
    question: 'What sizes do you offer?',
    answer:
      'Two sizes: 60 × 160 cm (narrow, for mall aisles, booth corners, registration desks, shop-window corners) and 85 × 200 cm (standard booth-front and lobby-centrepiece size). Both print at the same per-unit price, so pick purely by venue and visibility. If you need a non-standard size, contact us — custom-size pull-ups can be quoted separately.',
  },
  {
    question: 'Matt or gloss lamination — which should I pick?',
    answer:
      'Both are included at no upcharge. Pick matt for booth spotlights, mall overhead lighting, dark artwork, heavy skin tones, or copy-heavy layouts where glare would spoil readability. Pick gloss for product photography, vibrant brand colours, food shots, or any banner where the image is the subject. Both protect the ink from fingerprints and routine handling.',
  },
  {
    question: 'How does the pricing work?',
    answer:
      'Single banners are S$75 each. Each additional banner in the order drops the per-unit price by S$1 (so 2 banners = S$74/pc, 5 banners = S$71/pc, 10 banners = S$66/pc) up to a maximum S$10 discount. From 11 banners onward every banner is S$65 each — the best per-unit rate. Size and lamination do not change the price; only quantity does.',
  },
  {
    question: 'What does the stand include?',
    answer:
      'Every roll-up kit ships complete: aluminium retractable base, lightweight two-part pole, printed banner-roll, and a zipped carry case. The whole unit folds flat into the base for transport (cabin-bag sized for the 60 × 160 cm, check-in size for the 85 × 200 cm). No assembly tools needed — unzip, pull up, lock the pole, ~30 seconds to stand.',
  },
  {
    question: 'Can I reuse the stand and just reprint the banner?',
    answer:
      'Yes — the aluminium base and pole are the reusable part. Reprint-only orders (banner-roll without a new base) are priced below the full kit since the hardware is not included. Tell us when quoting that you want a reprint only, and send the original job number or current stand dimensions so we match the banner size exactly.',
  },
  {
    question: 'How fast can I get one printed?',
    answer:
      'One working day from artwork approval to ready-for-collection at Paya Lebar Square, provided the file passes the 12-hour check and the artwork is approved before 11am. Larger orders of 10+ banners may take an extra half-day to laminate and box cleanly. Free delivery within Singapore on orders over S$150; otherwise collected from Paya Lebar Square any working day.',
  },
  {
    question: 'What artwork format do you need?',
    answer:
      'Adobe Illustrator (.AI) file or a print-ready PDF — CMYK colour space, 300dpi at your final banner size, 3mm bleed on every edge, fonts outlined. Keep critical text at least 100mm above the bottom edge — that portion of the banner sits inside the base when the banner stands, so any copy there gets hidden. Position the logo in the top third for legibility from across a hall.',
  },
  {
    question: 'Are the banners outdoor-safe?',
    answer:
      'Roll-up banners are designed for indoor use — booth halls, mall interiors, lobbies, conference rooms. For outdoor use (a few hours at a covered outdoor event is fine), keep them out of direct sun and rain; the retractable mechanism is not weatherproof. If you need a waterproof outdoor banner, look at PVC Canvas on this site instead — it handles weather and can be wall-mounted, pole-mounted, or stretched on a frame.',
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
  const [prod] = await sql`select id from public.products where slug='roll-up-banner'`;
  if (!prod) throw new Error('roll-up-banner not found');

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
  console.log('✓ roll-up-banner content rewritten');
  console.log('  h1:', h1, '·', h1em);
} finally {
  await sql.end();
}
