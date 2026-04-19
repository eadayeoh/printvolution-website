// Rewrites x-stand-banner page content. Keyword: "X Stand Banner Singapore".
//
// Current pricing config:
//   Size       — 60cm × 160cm (S$58/pc) / 80cm × 180cm (S$68/pc)
//   Material   — Poster Paper / PVC Canvas (no upcharge either way)
//   Lamination — Matt / Gloss (both included)
//   Quantity   — 5% off per-unit at qty 5+ (formula: qty * PRICE * (1 - 0.05 * threshold indicator))
//   Lead time  — 1 working day, Eco Solvent print
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

const h1 = 'X Stand Banner Singapore';
const h1em = 'lightweight, clip-and-go.';

const tagline =
  'X-stand banner printing in Singapore — 60×160 cm or 80×180 cm on poster paper or PVC canvas, matt or gloss lamination, from S$58/pc. 5% off at qty 5+, one working day.';

const description =
  'X-stand banner printing in Singapore for shop fronts, event booths, roadshows, conference entrances and short-run promotions. Lightweight X-shaped pole clips onto a printed banner — cheaper and lighter than a retractable roll-up. Two sizes, poster paper or PVC canvas, matt or gloss lamination, 5% off when you order 5 or more.';

const intro =
  'An X-stand banner is the lightweight, quick-deploy cousin of a roll-up — printed banner clips onto a cross-shaped spring pole that folds flat for transport. Cheaper and lighter than a retractable roll-up, ideal for short-run promotions, multi-venue rollouts and anywhere the banner lives for days rather than months. Two sizes cover most briefs — 60 × 160 cm (compact for narrow aisles and booth corners) and 80 × 180 cm (booth-front and lobby-scale). Material picks are Poster Paper (standard) or PVC Canvas (for outdoor or repeated-use jobs), and both matt and gloss lamination are included at no upcharge. 5% bulk discount kicks in at qty 5 and above.';

const seo_title = 'X Stand Banner Printing Singapore | Light-frame Booth, Roadshow & Shop-front Stands';
const seo_desc =
  'X-stand banner printing Singapore for shop fronts, event booths, roadshows, conference entrances. 60×160cm or 80×180cm, from S$58/pc, 5% off at qty 5+, one working day.';

const seo_body =
  'X stand banner printing Singapore — shop-front promotions, mall-roadshow booths, event registration stands, conference entrance banners, product-launch aisle signs, trade-show booth markers, religious-festival booth signage, corporate-open-house stands, job-fair booth signs, pop-up shop signs. ' +
  'Two sizes (60 × 160 cm and 80 × 180 cm), poster paper or PVC canvas, matt or gloss lamination, 5% off at qty 5+ — one working day production, collected at Paya Lebar Square or delivered island-wide free over S$150.';

// Per-piece at qty
function pp60(qty) { return 58 * (1 - 0.05 * Math.min(1, Math.max(0, qty - 4))); }
function pp80(qty) { return 68 * (1 - 0.05 * Math.min(1, Math.max(0, qty - 4))); }
function total60(qty) { return qty * pp60(qty); }
function total80(qty) { return qty * pp80(qty); }

const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the use,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'Lighter than a roll-up.',
  right_note_body:
    'Spring pole folds flat, banner clips on at the venue, deploys in ~20 seconds. Good for repeat-use campaigns where a roll-up would be overkill.',
  rows: [
    {
      need: '*Shop-front weekend sale* — one banner at the entrance',
      pick_title: '60cm × 160cm · Poster Paper · Matt Lamination · 1 pc',
      pick_detail: `Standard narrow-aisle format for a shop front. 1 pc at S$${pp60(1).toFixed(2)}/pc, ready next working day.`,
      apply: { size: '60x160', material: 'poster', lamination: 'matt', qty: 1 },
    },
    {
      need: '*Mall roadshow* — front-of-booth visual + two side aisle signs',
      pick_title: '80cm × 180cm · Poster Paper · Gloss Lamination · 3 pcs',
      pick_detail: `Larger booth-front format for lobby-scale visibility. 3 pcs at S$${pp80(3).toFixed(2)}/pc × 3 = S$${total80(3).toFixed(2)}. Gloss lam makes brand shots pop under mall lighting.`,
      apply: { size: '80x180', material: 'poster', lamination: 'gloss', qty: 3 },
    },
    {
      need: '*Outdoor product launch* — 2 banners for a covered outdoor venue',
      pick_title: '80cm × 180cm · PVC Canvas · Matt Lamination · 2 pcs',
      pick_detail: `PVC canvas picks up the outdoor durability — humid air, occasional rain. 2 pcs at S$${pp80(2).toFixed(2)}/pc × 2 = S$${total80(2).toFixed(2)}. Matt lam avoids glare from outdoor floodlights.`,
      apply: { size: '80x180', material: 'pvc', lamination: 'matt', qty: 2 },
    },
    {
      need: '*Five-venue chain rollout* — matching x-stands at 5 stores',
      pick_title: '60cm × 160cm · Poster Paper · Matt Lamination · 5 pcs',
      pick_detail: `5 pcs unlocks the 5% discount: S$${pp60(5).toFixed(2)}/pc × 5 = S$${total60(5).toFixed(2)}. Every banner past qty 5 stays at the discounted rate.`,
      apply: { size: '60x160', material: 'poster', lamination: 'matt', qty: 5 },
    },
    {
      need: '*Trade show circuit* — 10 booth markers for regional events',
      pick_title: '80cm × 180cm · PVC Canvas · Gloss Lamination · 10 pcs',
      pick_detail: `PVC canvas survives the circuit\'s repeated deploy / pack cycles. 10 pcs at S$${pp80(10).toFixed(2)}/pc × 10 = S$${total80(10).toFixed(2)}. 5% off across the whole run.`,
      apply: { size: '80x180', material: 'pvc', lamination: 'gloss', qty: 10 },
    },
  ],
};

const seo_magazine = {
  issue_label: 'Issue · X Stand Banner Printing',
  title: 'Everything worth knowing,',
  title_em: 'before the pole clicks.',
  lede:
    'An X-stand banner is the lightweight spring-pole cousin of the retractable roll-up — faster to deploy, cheaper per unit, lighter in transport. Four things decide whether it reads proper at the venue or budget-fair: **size, material, lamination, and file prep**. Here is what matters on each one.',
  articles: [
    {
      num: '01',
      title: 'Pick size by the venue — 60×160 or 80×180.',
      body: [
        '**60 × 160 cm** is the narrow format — fits tight shop-front doorways, mall-aisle corners, booth-side markers, and registration-desk stands. Cheaper at S$58 per piece (qty 1). Pick it when the banner sits beside traffic rather than blocking it.',
        '**80 × 180 cm** is the booth-front / lobby format — tall enough to read from across a hall, wide enough to carry a full product shot + tagline + logo. S$68 per piece (qty 1). Pick it when the banner is the main visual, or when the venue has high ceilings and distant reading.',
      ],
      side: {
        kind: 'list',
        label: 'Size by venue',
        rows: [
          { text: 'Shop front', time: '60×160 cm' },
          { text: 'Booth corner', time: '60×160 cm' },
          { text: 'Booth front', time: '80×180 cm' },
          { text: 'Mall lobby', time: '80×180 cm' },
        ],
      },
    },
    {
      num: '02',
      title: 'Poster Paper or PVC Canvas — pick by handling.',
      body: [
        '**Poster Paper** is the default — crisp ink hold, tight colour, lightweight in the bag. Pick it for one-off events, indoor-only use, and shorter campaigns. Cleans up fine with a damp cloth on the laminated face but is not outdoor-rain-ready.',
        '**PVC Canvas** is the upgrade for multi-venue tours, outdoor-covered use, or banners that will deploy-pack-deploy across weeks. Waterproof, rip-resistant, no curl. No per-piece upcharge over poster paper on the X-stand — pick by handling and venue, not by budget.',
      ],
      side: {
        kind: 'pills',
        label: 'Material',
        items: [
          { text: 'Poster Paper — indoor', pop: true },
          { text: 'PVC Canvas — outdoor / repeat' },
          { text: 'Same price either way' },
          { text: 'Pick by venue' },
        ],
      },
    },
    {
      num: '03',
      title: 'Lamination, bulk pricing, and the 5% discount threshold.',
      body: [
        'Both **matt** and **gloss** lamination are included at no upcharge — pick matt for direct booth lighting / dark artwork / skin tones where glare would spoil readability, gloss for product shots / vibrant brand colours / food photography. The lam protects the ink face from the inevitable fingerprints and brush-past scuffs of a booth day.',
        'Quantities of **5 pieces or more** get a 5% discount applied automatically on the per-unit rate. 60×160 drops from S$58 to S$55.10/pc at qty 5+; 80×180 drops from S$68 to S$64.60/pc. The discount stays flat past qty 5 — 10 pieces is S$551 on 60×160, 10 pieces is S$646 on 80×180. Worth planning around for multi-venue chain rollouts.',
      ],
      side: {
        kind: 'stat',
        label: 'Bulk threshold',
        num: 'qty 5+',
        caption: '5% off per unit, automatic',
      },
    },
    {
      num: '04',
      title: 'Files, bleed, and the X-stand\'s pole clip layout.',
      body: [
        'Send an **Adobe Illustrator (.AI) file or print-ready PDF** — CMYK colour, 300dpi at your final banner size, 3mm bleed on every edge, fonts outlined. The banner mounts to the X-pole via four grommet clips (one per corner) — keep critical text at least **30mm from every corner** so the clip does not cover a letter or logo element.',
        'The X-pole itself folds flat for transport (cabin-bag sized), spring-unfolds at the venue, and the banner clips on in ~20 seconds — no tools, no ground stakes. Reorders of the banner only (reusing the existing X-pole) are priced below the full kit — mention "reprint only" when quoting.',
      ],
      side: {
        kind: 'stat',
        label: 'Corner text-safe zone',
        num: '30mm',
        caption: 'from each corner where the clip lands',
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '📏',
    title: 'Two sizes cover most briefs',
    desc: '60×160cm narrow for shop fronts and aisle corners. 80×180cm standard for booth fronts and lobby scale.',
  },
  {
    icon_url: null,
    emoji: '🧻',
    title: 'Poster or PVC, no upcharge',
    desc: 'Poster paper for indoor one-offs, PVC canvas for outdoor / repeat-use. Same per-piece price — pick by venue, not budget.',
  },
  {
    icon_url: null,
    emoji: '✨',
    title: 'Matt or gloss lam included',
    desc: 'Both lamination options are free. Matt for direct lighting and dark art, gloss for vibrant product photography.',
  },
  {
    icon_url: null,
    emoji: '💰',
    title: '5% off at qty 5+',
    desc: 'Bulk discount kicks in automatically at 5 banners and above — worth planning around for chain rollouts and multi-venue events.',
  },
];

const faqs = [
  {
    question: 'What sizes do you offer?',
    answer:
      'Two standard sizes: 60 × 160 cm (narrow format for shop fronts, aisle corners, booth sides) and 80 × 180 cm (booth-front / lobby-scale for main-visual placement). Both run on the same X-pole hardware, just a different banner crop. Non-standard sizes can be quoted separately on request.',
  },
  {
    question: 'Should I pick Poster Paper or PVC Canvas?',
    answer:
      'Poster Paper is the indoor default — crisp ink, tight colour, lightweight in the carry case. Pick it for one-off indoor events, shop windows, booth markers, short campaigns. PVC Canvas is the upgrade for multi-venue tours, covered outdoor use, or banners that deploy and pack repeatedly over weeks — waterproof, rip-resistant, no curl. Both print at the same per-piece price on the X-stand, so pick by how the banner will be handled, not by budget.',
  },
  {
    question: 'Matt or gloss lamination — which is better?',
    answer:
      'Both are included at no upcharge. Pick matt for booth spotlights, overhead lighting, dark artwork, skin-tone heavy visuals, or copy-heavy layouts — anywhere glare would spoil readability. Pick gloss for product photography, food shots, or vibrant brand colours where you want the image to pop. The lam is applied to the face and protects the ink from fingerprints, dust, and brush-past handling.',
  },
  {
    question: 'Is there a bulk discount?',
    answer:
      'Yes — 5% off the per-unit rate at 5 pieces and above, applied automatically. 60×160 drops from S$58 to S$55.10/pc at qty 5+ (save S$14.50 on 5 pieces, S$29 on 10). 80×180 drops from S$68 to S$64.60/pc at qty 5+ (save S$17 on 5, S$34 on 10). The discount stays flat past qty 5 — every banner from the 5th onward is at the discounted rate.',
  },
  {
    question: 'What does the X-stand kit include?',
    answer:
      'Every X-stand kit ships complete: spring-loaded X-pole (folds flat for transport), printed banner with four corner grommets, and a carry bag. No assembly tools needed — unfold the X-pole, clip the banner onto the four corner hooks, ~20 seconds to deploy. Fits in a cabin bag at 60×160cm; check-in size at 80×180cm.',
  },
  {
    question: 'Can I reuse the X-pole and just reprint the banner?',
    answer:
      'Yes — the spring X-pole is the reusable part. Reprint-only orders (banner with grommets, no new pole) are priced below the full kit. Tell us you are reprinting when quoting, and send the original job number or pole dimensions so the new banner clips cleanly onto your existing hardware.',
  },
  {
    question: 'How fast can I get one printed?',
    answer:
      'One working day from artwork approval to ready-for-collection at Paya Lebar Square, provided the file passes the 12-hour check and is approved before 11am. Bulk runs of 5+ usually still land the next working day; 10+ banners may add a half-day for lamination and clean packing. Free delivery within Singapore over S$150, otherwise collected for free.',
  },
  {
    question: 'What artwork format do you need?',
    answer:
      'Adobe Illustrator (.AI) file or print-ready PDF — CMYK colour, 300dpi at your final banner size, 3mm bleed on every edge, fonts outlined. Keep critical text at least 30mm from each corner — the four grommet clips mount there and any copy in that zone gets partially covered. The X-stand does not have a hidden base like a roll-up, so the entire banner is visible once deployed.',
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
  const [prod] = await sql`select id from public.products where slug='x-stand-banner'`;
  if (!prod) throw new Error('x-stand-banner not found');

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
  console.log('✓ x-stand-banner content rewritten');
  console.log('  h1:', h1, '·', h1em);
} finally {
  await sql.end();
}
