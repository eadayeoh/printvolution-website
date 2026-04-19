// Rewrites pvc-canvas page content. Keyword: "PVC Canvas Singapore".
//
// Configurator (per patch-pvc-canvas-material-step.mjs):
//   Material   — PVC Canvas (area price)
//   Width (cm) — number input
//   Height (cm)— number input
//   Eyelets    — number input (count)
//   Finishing  — Eyelets / Wooden Poles + Eyelets
//   Quantity   — integer stepper
//
// Writes to product_extras + product_faqs ONLY — never touches
// product_configurator, so admin-uploaded option images / customised
// option lists survive the rewrite.

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

// No trailing comma — the product-page template appends `,<br>` between
// H1 and H1em itself, so a comma here produces a doubled `,, <br>`.
const h1 = 'PVC Canvas Singapore';
const h1em = 'any size, priced by area.';

const tagline =
  'PVC canvas printing in Singapore — any size from 300mm up, priced by the square foot, eyelets priced per piece. Event banners, shop signage, exhibition displays, backdrops, and photocall walls.';

const description =
  'Custom PVC canvas printing in Singapore for event banners, shop signage, exhibition displays, photocall backdrops and temporary signage. Type your exact width and height in millimetres — price is calculated by the square foot at S$3.50/sqft, with a S$15 per-piece minimum. Eyelets optional at S$3 each. Wooden poles available as a finishing upgrade.';

const intro =
  'PVC canvas is a waterproof print substrate for banners, event backdrops, shop signage and any display that needs to survive outdoor weather or a long event run. Price is set by **area** — enter width × height in **millimetres**, charged by the square foot at S$3.50/sqft — so a 2m × 1m (2000 × 1000 mm) banner reads straight off the formula: 2000 × 1000 / 93025 × 3.50 = S$75.25 for the print. **Eyelets are priced per piece** (S$3 each), added after you decide how many corners or edges need hanging points. **Wooden Poles + Eyelets** is the finishing upgrade if you need a ready-to-hang banner with top and bottom poles (+S$15/pc). Per-piece minimum fee is S$15 — a 300 × 300mm sample lands at the floor even though its pure area price is lower.';

// SEO attributes: use-cases + location + outcome only. No material
// names or print specs. Those belong in the body.
const seo_title = 'PVC Canvas Printing Singapore | Custom-size Banners, Signage & Backdrops';
const seo_desc =
  'PVC canvas printing Singapore for event banners, shop signage, exhibition displays, photocall backdrops and outdoor banners. Any size, priced by the square foot — eyelets optional, same-week turnaround.';

const seo_body =
  'PVC canvas printing Singapore — event banners, shop signage, exhibition displays, conference backdrops, photocall walls, outdoor banners, sports-event finish lines, religious-festival banners, property show-flat signage, roadshow backdrops. ' +
  'Any size from 300mm upward, priced by area at S$3.50 per square foot with S$15 per-piece minimum, eyelets S$3 each, optional wooden-pole finishing — delivered island-wide free over S$150 or collected at Paya Lebar Square.';

// ────────────────────────────────────────────────────────────────────
// Matcher — each row maps to a real configurator combo.
// ────────────────────────────────────────────────────────────────────
// Per-piece price — mm inputs, $15 per-piece area floor, +$3/eyelet,
// +$15/pc for wooden poles. `w` and `h` below are in mm.
function pp(w, h, e, poles = false) {
  const area = Math.max(15, w * h / 93025 * 3.50);
  return area + e * 3 + (poles ? 15 : 0);
}

const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the job,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'Any size, priced by area.',
  right_note_body:
    'Type width and height in cm. Price scales by the square foot — no fixed sizes, no matrix. Eyelets are the only add-on you need to count.',
  rows: [
    {
      need: '*Shop-front sale banner* — 2m wide, 1m tall, hang from 4 corner eyelets',
      pick_title: 'PVC Canvas · 2000 × 1000 mm · 4 eyelets · Eyelets finishing',
      pick_detail: `At 2000 × 1000 mm that is ~21.5 sqft × S$3.50/sqft = S$75.25, plus 4 eyelets × S$3 = S$12. Total S$${pp(2000, 1000, 4).toFixed(2)}/pc.`,
      apply: { material: 'pvc', width: 2000, height: 1000, eyelets: 4, finishing: 'eyelets', qty: 1 },
    },
    {
      need: '*Conference photocall backdrop* — 3m × 2m, 8 eyelets around the perimeter',
      pick_title: 'PVC Canvas · 3000 × 2000 mm · 8 eyelets · Eyelets finishing',
      pick_detail: `3m × 2m is the standard photocall size — ~64.5 sqft × S$3.50/sqft = S$225.75, plus 8 eyelets × S$3 = S$24. Total S$${pp(3000, 2000, 8).toFixed(2)}/pc.`,
      apply: { material: 'pvc', width: 3000, height: 2000, eyelets: 8, finishing: 'eyelets', qty: 1 },
    },
    {
      need: '*Exhibition booth banner* — 1.5m × 2m, ready-to-hang with wooden poles',
      pick_title: 'PVC Canvas · 1500 × 2000 mm · Wooden Poles + Eyelets',
      pick_detail: `With top and bottom poles pre-attached the banner hangs straight and clean at the booth. Area ~32.3 sqft × S$3.50 = S$112.94, plus 4 eyelets + S$15 poles. Total S$${pp(1500, 2000, 4, true).toFixed(2)}/pc.`,
      apply: { material: 'pvc', width: 1500, height: 2000, eyelets: 4, finishing: 'poles', qty: 1 },
    },
    {
      need: '*Religious-festival banner* — 4m × 1m, hung from eyelets every metre',
      pick_title: 'PVC Canvas · 4000 × 1000 mm · 5 eyelets · Eyelets finishing',
      pick_detail: `4m × 1m is the long-banner format for temple / religious events. ~43 sqft × S$3.50 = S$150.50, plus 5 eyelets × S$3 = S$15. Total S$${pp(4000, 1000, 5).toFixed(2)}/pc.`,
      apply: { material: 'pvc', width: 4000, height: 1000, eyelets: 5, finishing: 'eyelets', qty: 1 },
    },
    {
      need: '*Small shop signboard* — 600 × 400 mm, no eyelets, taped to glass',
      pick_title: 'PVC Canvas · 600 × 400 mm · 0 eyelets · Eyelets finishing',
      pick_detail: `Area is below the $15 per-piece floor, so the canvas lands at the minimum: S$${pp(600, 400, 0).toFixed(2)}/pc. 4 eyelets on this size would be S$${pp(600, 400, 4).toFixed(2)}/pc.`,
      apply: { material: 'pvc', width: 600, height: 400, eyelets: 0, finishing: 'eyelets', qty: 1 },
    },
  ],
};

// ────────────────────────────────────────────────────────────────────
// Magazine articles
// ────────────────────────────────────────────────────────────────────
const seo_magazine = {
  issue_label: 'Issue · PVC Canvas Printing',
  title: 'Everything worth knowing,',
  title_em: 'before you print a banner.',
  lede:
    'PVC canvas is what you reach for when a banner needs to survive rain, wind, a three-week outdoor run, or repeated storage-and-re-use. The price is area-based, so the four decisions that actually change the outcome are **size, eyelet placement, finishing, and file prep**. Here is what matters on each one.',
  articles: [
    {
      num: '01',
      title: 'How area pricing works — square feet, S$3.50 flat, $15 minimum.',
      body: [
        'PVC canvas is priced by the **square foot**: width × height **in millimetres**, divided by 93,025 (which is 305² — the number of square millimetres in one square foot), multiplied by **S$3.50/sq ft**. So a 1000 × 1000 mm (1m × 1m) banner is 10.75 sqft → S$37.62. A 2000 × 1000 mm banner is 21.5 sqft → S$75.25. The rate is linear — double the area, double the print price.',
        'A **S$15 per-piece floor** applies to the print. A 300 × 300 mm test sample lands at the floor (its raw area price is S$3.39, but the minimum sits at S$15). That keeps very-small orders from pricing below viable production costs while still letting mid-size banners scale linearly at the S$3.50/sqft rate.',
      ],
      side: {
        kind: 'stat',
        label: 'Rate',
        num: 'S$3.50',
        caption: 'per square foot, any size',
      },
    },
    {
      num: '02',
      title: 'Eyelets — how many, and where to place them.',
      body: [
        'Eyelets are the metal-ringed holes used to hang the canvas from hooks, zip ties, rope or a banner frame. Each eyelet is **S$3 per piece**, added on top of the area price — so a 4-eyelet banner adds S$12 to the total, an 8-eyelet perimeter-hung backdrop adds S$24. If you need zero eyelets (the banner will be taped, stuck, or clipped), set the count to 0 and no eyelet charge applies.',
        'Placement rule-of-thumb: **one eyelet per 60–80cm of edge**. For a 2m × 1m shop banner, 4 corner eyelets are enough if it will hang from a rope. For an outdoor banner that needs to tension against wind, space them every 50cm along the top edge. For a photocall backdrop hung from a frame, put eyelets every 50cm along the top only.',
      ],
      side: {
        kind: 'list',
        label: 'Eyelet count cheat sheet',
        rows: [
          { text: 'Indoor, rope hang', time: '4' },
          { text: '2m × 1m outdoor', time: '6' },
          { text: '3m × 2m photocall', time: '8' },
          { text: 'Long temple banner', time: '5+' },
        ],
      },
    },
    {
      num: '03',
      title: 'Wooden Poles finishing — when it\'s worth the S$15/pc.',
      body: [
        'The Wooden Poles + Eyelets finishing adds a **top and bottom pole** (wood dowel slotted through a sewn hem) before the banner ships. Reason to pick it: the banner hangs dead-flat without curling, is quicker to deploy at a booth (just grab both poles), and rolls up cleanly between uses. The surcharge is S$15 per piece flat — independent of canvas size.',
        'Reasons to skip it: if the canvas will be stretched flat on a frame, taped to a wall, or cut to a custom shape. For one-time-use event banners, plain "Eyelets" finishing is usually fine. For recurring-use exhibition banners or roll-up backups, the pole finishing pays back in handling time and banner lifespan.',
      ],
      side: {
        kind: 'pills',
        label: 'Finishing',
        items: [
          { text: 'Eyelets — standard', pop: true },
          { text: 'Wooden Poles + Eyelets' },
          { text: 'Poles = +S$15/pc' },
          { text: 'Poles = handle + flat-hang' },
        ],
      },
    },
    {
      num: '04',
      title: 'Files, bleed, and what survives an outdoor run.',
      body: [
        'Send an **Adobe Illustrator (.AI) file or print-ready PDF** — CMYK colour, 300dpi at your final size, 3mm bleed on every edge, fonts outlined. Canvas is printed at scale so resolution matters less than on small formats, but 300dpi at final size keeps text crisp at close-reading distance. Position critical text at least 50mm from any edge so the eyelet placement doesn\'t land on a letter.',
        'For outdoor runs of more than two weeks, we recommend **gloss-laminate the face** as an add-on (contact us for the quote) — the lam protects against UV fade and rain abrasion. Untreated PVC canvas is weather-resistant for 2–3 weeks outdoor; longer runs benefit from the extra coat. Free file check in 12 hours.',
      ],
      side: {
        kind: 'stat',
        label: 'Text-safe margin',
        num: '50mm',
        caption: 'from any edge where an eyelet may land',
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '📐',
    title: 'Any size, priced by area',
    desc: 'Width × height in cm → square feet → S$3.50/sqft. No fixed size menu, no matrix, no minimum fee.',
  },
  {
    icon_url: null,
    emoji: '🔩',
    title: 'Eyelets at S$3 per piece',
    desc: 'Pick the count that matches your hanging method. Zero eyelets is fine if you tape, stick or clip the canvas.',
  },
  {
    icon_url: null,
    emoji: '🪵',
    title: 'Wooden Poles option',
    desc: 'Top and bottom pole pre-attached for ready-to-hang banners. +S$15/pc flat, regardless of canvas size.',
  },
  {
    icon_url: null,
    emoji: '🌧️',
    title: 'Weather-resistant PVC',
    desc: 'Waterproof canvas good for 2–3 weeks outdoors untreated; add gloss lamination for longer outdoor runs.',
  },
];

const faqs = [
  {
    question: 'How is the price calculated?',
    answer:
      'Price is set by area. Enter width × height in millimetres. The formula is width × height / 93,025 × S$3.50 (93,025 mm² = 1 sq ft, since 305mm² = 1 sqft). Examples: 1000 × 1000 mm = 10.75 sqft = S$37.62; 2000 × 1000 mm = 21.5 sqft = S$75.25. A S$15 per-piece minimum floor applies — small canvases land at S$15 even if the pure area price would be lower. Eyelets add S$3 each on top. Wooden Poles finishing adds S$15/pc flat.',
  },
  {
    question: 'What sizes can I order?',
    answer:
      'Any size from 300 mm upward on each dimension. Common sizes customers order: 600 × 400 mm (small signboard), 1000 × 1000 mm (standard indoor banner), 2000 × 1000 mm (shop-front banner), 3000 × 2000 mm (conference photocall backdrop), 4000 × 1000 mm (long temple / religious-festival banner). Maximum print width is around 3000 mm per piece; beyond that we can split the banner into two panels with a seam — contact us for that route.',
  },
  {
    question: 'Do I need eyelets, and how many?',
    answer:
      'Only if you need to hang the banner from hooks, rope, zip ties, or a frame. Zero eyelets is fine if the canvas will be taped, clipped, or stretched on a frame. Rule of thumb: 4 corner eyelets for a small indoor banner, 1 eyelet every 50–80cm of edge for outdoor banners that need to tension against wind. A 3m × 2m photocall backdrop usually takes 8 eyelets around the perimeter; a 4m × 1m long banner takes 5 along the top.',
  },
  {
    question: 'What is the Wooden Poles + Eyelets finishing?',
    answer:
      'A wooden pole (dowel) is sewn into a hem along the top and bottom of the canvas before shipping. The banner hangs dead-flat without curling, deploys faster at a booth, and rolls up cleanly for storage. The surcharge is S$15 per piece flat, regardless of canvas size. Pick it for recurring-use exhibition banners; skip it if the banner will be stretched on a frame or taped to a wall.',
  },
  {
    question: 'Is there a minimum order or minimum fee?',
    answer:
      'Minimum 1 piece, no minimum quantity — order a single canvas if that is what you need. A per-piece minimum fee of S$15 applies to the print (area) portion, so very-small canvases (say 300 × 300 mm) land at the S$15 floor rather than the raw area price. Eyelets and Wooden Poles finishing are billed on top of that floor. The per-piece rate does not change with quantity.',
  },
  {
    question: 'How long does the canvas last outdoors?',
    answer:
      'Untreated PVC canvas is weather-resistant for roughly 2–3 weeks of continuous outdoor use — good for event banners, short-run promotions, and temporary signage. For longer outdoor runs (a month or more), add gloss lamination on the face; the laminate protects against UV fade and rain abrasion. Contact us for the lamination add-on quote; it is priced per piece based on the canvas size.',
  },
  {
    question: 'What artwork format do you need?',
    answer:
      'Adobe Illustrator (.AI) file or a print-ready PDF — CMYK colour space, 300dpi at your final output size, 3mm bleed on every edge, fonts outlined. Keep any critical text at least 50mm from every edge, so eyelet punching does not land on a letter or logo. We pre-check the file inside 12 hours — if bleed is short, a colour is in RGB, or a font is missing, you hear from us the same business day.',
  },
  {
    question: 'How long does production take?',
    answer:
      'Three working days from artwork approval to ready-for-collection at Paya Lebar Square, on most orders up to 5 pieces. Larger runs or very large sizes (over 3m on either dimension) may take one additional day for the print and eyelet cycle to complete cleanly. Free delivery within Singapore on orders over S$150.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Apply — preserves admin-uploaded how_we_print icons on re-run.
// ────────────────────────────────────────────────────────────────────
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
  const [prod] = await sql`select id from public.products where slug='pvc-canvas'`;
  if (!prod) throw new Error('pvc-canvas not found');

  const [existingExtras] = await sql`
    select how_we_print from public.product_extras where product_id = ${prod.id}
  `;
  const mergedHowWePrint = mergeHowWePrintIcons(how_we_print, existingExtras?.how_we_print);

  await sql`
    update public.products
    set tagline = ${tagline},
        description = ${description}
    where id = ${prod.id}
  `;

  await sql`
    insert into public.product_extras (product_id, seo_title, seo_desc, seo_body, h1, h1em, intro, matcher, seo_magazine, how_we_print)
    values (${prod.id}, ${seo_title}, ${seo_desc}, ${seo_body}, ${h1}, ${h1em}, ${intro}, ${sql.json(matcher)}, ${sql.json(seo_magazine)}, ${sql.json(mergedHowWePrint)})
    on conflict (product_id) do update
      set seo_title = excluded.seo_title,
          seo_desc = excluded.seo_desc,
          seo_body = excluded.seo_body,
          h1 = excluded.h1,
          h1em = excluded.h1em,
          intro = excluded.intro,
          matcher = excluded.matcher,
          seo_magazine = excluded.seo_magazine,
          how_we_print = excluded.how_we_print
  `;

  await sql`delete from public.product_faqs where product_id = ${prod.id}`;
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    await sql`
      insert into public.product_faqs (product_id, question, answer, display_order)
      values (${prod.id}, ${f.question}, ${f.answer}, ${i})
    `;
  }

  const [check] = await sql`
    select e.h1, e.h1em, e.seo_title,
           jsonb_array_length(coalesce(e.seo_magazine->'articles','[]'::jsonb)) as articles,
           jsonb_array_length(coalesce(e.how_we_print, '[]'::jsonb)) as hwp_cards,
           jsonb_array_length(coalesce(e.matcher->'rows', '[]'::jsonb)) as matcher_rows,
           (select count(*) from public.product_faqs f where f.product_id = ${prod.id}) as faqs
    from public.product_extras e where e.product_id = ${prod.id}
  `;
  console.log('✓ pvc-canvas content rewritten');
  console.log('  h1:', check.h1);
  console.log('  h1em:', check.h1em);
  console.log('  seo_title:', check.seo_title);
  console.log('  articles:', check.articles);
  console.log('  how-we-print cards:', check.hwp_cards);
  console.log('  matcher rows:', check.matcher_rows);
  console.log('  faqs:', check.faqs);
} finally {
  await sql.end();
}
