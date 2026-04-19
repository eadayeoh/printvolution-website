// Rewrites life-size-standee page content to match the real configurator:
//
//   Height       — 160cm (S$120/pc) or 180cm (S$150/pc)
//   Finish       — Matt / Gloss lamination (included)
//   Quantity     — any integer, 5%-off bulk discount baked into each
//                  Height option's per-unit formula from qty 5+
//
// Keyword: "Life Size Standee Printing Singapore" (H1 + SEO title/body).
// User asked for the keyword in H1 — overrides the default "skip h1
// on rewrites" rule.
//
// Writes only to product_extras + product_faqs — never touches
// product_configurator, so admin-uploaded option images survive.

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

const h1 = 'Life Size Standee Printing Singapore,';
const h1em = 'cut-outs that stand up.';

const tagline =
  'Life-size standee printing in Singapore — 160cm or 180cm cut-outs, matt or gloss lamination, 5% off at qty 5+. Same-day turnaround for retail, events, product launches and photo ops.';

const description =
  'Life size standee printing in Singapore for retail displays, event photo ops, product launches, movie premieres, mall activations and wedding cut-outs. 160cm (5\'3") or 180cm (5\'11") height, matt or gloss lamination — built and ready for collection at Paya Lebar Square.';

const intro =
  'Life-size standees are cut-out figures — people, characters, mascots, bottle silhouettes — printed on rigid board, laminated, die-cut to the outline you supply, and mounted on a floor-standing backer. Pick Height first (160cm for most human-size shots, 180cm for taller mascots or full-stretch figures), pick Finish (matt or gloss lamination, both included in the price), enter the quantity. Price is $120/pc for 160cm and $150/pc for 180cm. Order 5 pieces or more and the discount kicks in automatically — 5% off the per-piece rate.';

// SEO attributes: use-cases + location + outcome only. No material
// names or print specs — those belong in the body content.
const seo_title = 'Life Size Standee Printing Singapore | Cut-out Figures for Events, Retail & Photo Ops';
const seo_desc =
  'Life size standee printing Singapore — 160cm and 180cm cut-out figures for retail, events, product launches, photo ops and mall activations. 5% off at qty 5+, collected at Paya Lebar.';

const seo_body =
  'Life size standee printing Singapore — retail window displays, event photo ops, product-launch cut-outs, movie premiere standees, mall activations, wedding and birthday photo props, brand-mascot floor figures, trade-show giveaways. ' +
  '160cm or 180cm cut-outs, matt or gloss lamination, die-cut to your outline, mounted on a floor backer — 5% off at qty 5 and above, collected at Paya Lebar Square or delivered island-wide free over S$150.';

// ────────────────────────────────────────────────────────────────────
// Matcher rows
// ────────────────────────────────────────────────────────────────────
const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the use,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'Cut-out, laminated, mounted.',
  right_note_body:
    'Print on rigid board, matt or gloss laminate, die-cut to the outline you supply, mount on a floor-standing backer — collected standing, ready to position.',
  rows: [
    {
      need: '*Retail launch* — one life-size figure of the brand ambassador',
      pick_title: '160cm · Matt Lamination · 1 pc',
      pick_detail:
        '160cm covers most human-size shots without the standee dwarfing the store. Matt lam reads premium under retail lighting. S$120 all-in.',
      apply: { height: '160', finish: 'matt', qty: 1 },
    },
    {
      need: '*Movie premiere* — taller character cut-out for lobby impact',
      pick_title: '180cm · Gloss Lamination · 1 pc',
      pick_detail:
        '180cm gives genuine commanding-presence at a lobby; gloss lam makes costumes and character art pop. S$150 all-in.',
      apply: { height: '180', finish: 'gloss', qty: 1 },
    },
    {
      need: '*Product launch across 5 malls* — same figure, 5 cities at once',
      pick_title: '160cm · Matt Lamination · 5 pcs',
      pick_detail:
        'Bulk pick: 5 pieces unlocks the 5% discount automatically. 160cm × 5 pcs = S$570 total (S$114/pc). Collected together or split-delivered.',
      apply: { height: '160', finish: 'matt', qty: 5 },
    },
    {
      need: '*Wedding photo op* — two figures of the couple',
      pick_title: '180cm · Gloss Lamination · 2 pcs',
      pick_detail:
        '180cm brings the figures to near-life scale for photos. Gloss lam keeps the couple\'s colours and skin tones reading rich. S$300 for a pair.',
      apply: { height: '180', finish: 'gloss', qty: 2 },
    },
    {
      need: '*Trade show booth* — 10 ambassador figures for the Singapore show circuit',
      pick_title: '160cm · Matt Lamination · 10 pcs',
      pick_detail:
        'At 10 pieces the 5% discount applies to every unit: S$1,140 total (S$114/pc vs S$120/pc at qty 1). Stackable for transport.',
      apply: { height: '160', finish: 'matt', qty: 10 },
    },
  ],
};

// ────────────────────────────────────────────────────────────────────
// Magazine articles
// ────────────────────────────────────────────────────────────────────
const seo_magazine = {
  issue_label: 'Issue · Life Size Standee Printing',
  title: 'Everything worth knowing,',
  title_em: 'before you cut out a person.',
  lede:
    'A life-size standee is a cut-out figure that stands on its own — print, laminate, die-cut to the outline, mounted on a floor backer. Four things decide whether it lands as a memorable photo op or a soft-edged cardboard cutout: **height, finish, artwork prep, and quantity**. Here is what actually matters on each one.',
  articles: [
    {
      num: '01',
      title: '160cm or 180cm — pick by the photo, not the person.',
      body: [
        '**160cm (5\'3")** is the default for most retail and event uses. It stands at roughly the same height as the average adult, which means the standee reads as life-sized without dominating the room. It also packs and stacks more easily — five 160cm cut-outs travel in a single flat crate without folding. Price is S$120 per piece.',
        '**180cm (5\'11")** is the pick when the figure is a taller character (NBA player cut-out, tall mascot, male model), when the standee is the focal point of a lobby or mall atrium, or when you want visitors to physically stand beside it for a full-stretch photo. Price is S$150 per piece — a 25% premium over the 160cm for the extra surface and rigidity.',
      ],
      side: {
        kind: 'list',
        label: 'Height picker',
        rows: [
          { text: 'Retail window', time: '160cm' },
          { text: 'Lobby centrepiece', time: '180cm' },
          { text: 'Booth ambassador', time: '160cm' },
          { text: 'Movie premiere', time: '180cm' },
        ],
      },
    },
    {
      num: '02',
      title: 'Matt or gloss lamination — both are included.',
      body: [
        '**Matt lamination** reads premium under direct retail lighting — no glare, no reflections off the subject\'s face, fingerprint-resistant across a day of visitor handling. Pick it when the standee sits in a brightly-lit window, under spotlight, or when the artwork has lots of dark / skin tone areas that glare would spoil.',
        '**Gloss lamination** saturates colours and makes photography and character art pop. Pick it when the standee is in a darker lobby or cinema, when the artwork is costume / character-heavy, or when the brief asks for a rich, photographic finish. Both lam types are included in the price — no upcharge either way.',
      ],
      side: {
        kind: 'pills',
        label: 'Finish',
        items: [
          { text: 'Matt · retail default', pop: true },
          { text: 'Gloss · richer colour' },
          { text: 'Both included' },
          { text: 'No upcharge either way' },
        ],
      },
    },
    {
      num: '03',
      title: 'Files, bleed, and cutting around the figure.',
      body: [
        'Send an **Adobe Illustrator (.AI) file or print-ready PDF** — CMYK colour, 300dpi minimum, 3mm bleed around the cut-out silhouette, fonts outlined. The cut-out runs around the outside of the figure; put the cutting outline on its own layer so the die operator can pull it cleanly. Avoid narrow protrusions under 5mm wide (hair strands, antennae, thin fingers) — they snap off in transit and handling; we thicken them with your permission before cutting.',
        'The figure reads from across a room, so the face and any copy on the standee need to be large. Aim for the face at **at least 20% of the figure\'s height**; readable copy at 30mm cap height or larger. Free file check within 12 hours of upload — if bleed is short, a colour is in RGB, or the cut-line is missing, you hear from us before the plates go down.',
      ],
      side: {
        kind: 'stat',
        label: 'Min protrusion width',
        num: '5mm',
        caption: 'or we thicken it with your permission',
      },
    },
    {
      num: '04',
      title: 'Bulk runs — when the 5% discount is worth planning around.',
      body: [
        'Every life-size standee order of **5 pieces or more** gets 5% off the per-piece rate, applied automatically at checkout. At 160cm, that drops the per-piece from S$120 to S$114 — a saving of S$30 on 5 pieces, S$60 on 10. At 180cm, the per-piece drops from S$150 to S$142.50 — saving S$37.50 on 5, S$75 on 10.',
        'The discount is worth planning around when a single campaign spans multiple venues: 5 mall-launch figures, 10 booth ambassadors for a Singapore trade show circuit, or a corporate roadshow across offices. Beyond the discount, bulk runs also print consistently — same colour on standee 1 and standee 10, which matters when two are photographed side-by-side.',
      ],
      side: {
        kind: 'list',
        label: 'Per-piece savings',
        rows: [
          { text: '160cm × 5 pcs', time: 'save $30' },
          { text: '160cm × 10 pcs', time: 'save $60' },
          { text: '180cm × 5 pcs', time: 'save $37.50' },
          { text: '180cm × 10 pcs', time: 'save $75' },
        ],
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '🧍',
    title: '160cm or 180cm rigid board',
    desc: 'Two height options covering retail, event and premiere uses. Rigid enough to stand unaided on the floor backer.',
  },
  {
    icon_url: null,
    emoji: '✨',
    title: 'Matt or gloss lamination',
    desc: 'Both included — matt for retail lighting and no glare, gloss for richer colour and character art. Pick by the venue.',
  },
  {
    icon_url: null,
    emoji: '✂️',
    title: 'Die-cut around the figure',
    desc: 'Plotter follows the outline you supply on its own layer. We pre-check for weak protrusions under 5mm and thicken with your OK.',
  },
  {
    icon_url: null,
    emoji: '💰',
    title: '5% off at qty 5+',
    desc: 'Bulk discount kicks in automatically at 5 pieces and above. S$30 off on 5 × 160cm, S$75 off on 10 × 180cm.',
  },
];

const faqs = [
  {
    question: 'What is a life size standee and what is it for?',
    answer:
      'A life size standee is a cut-out figure printed on rigid board, laminated for durability, die-cut around the outline of the figure, and mounted on a floor-standing backer so it stands unaided. We use them for retail window displays, event photo ops, product launches, movie premieres, mall activations, wedding cut-outs of the couple, birthday party photo props, brand-mascot floor figures, and trade-show booth ambassadors.',
  },
  {
    question: 'How do I pick between 160cm and 180cm?',
    answer:
      '160cm (5\'3") is the default for most retail and event uses — it reads as life-sized without dominating the room, and five of them pack into a single flat crate for transport. 180cm (5\'11") is for taller figures (NBA players, tall mascots), lobby centrepieces, and setups where visitors will physically stand next to the standee for a full-stretch photo. 160cm is S$120/pc and 180cm is S$150/pc.',
  },
  {
    question: 'Matt or gloss lamination — which should I pick?',
    answer:
      'Matt lam reads premium under bright retail lighting, has no glare on skin tones or dark areas, and resists fingerprints across a day of visitor handling — pick it for retail windows, spotlighted displays, and most in-store work. Gloss lam saturates colour and makes character art or costume photography pop — pick it for cinema lobbies, darker venues, and brief that calls for a richer, photographic finish. Both are included in the per-piece price with no upcharge either way.',
  },
  {
    question: 'Is there a bulk discount?',
    answer:
      'Yes — 5% off the per-piece rate at 5 pieces and above, applied automatically. That drops 160cm from S$120/pc to S$114/pc (save S$30 on 5 pcs, S$60 on 10 pcs) and 180cm from S$150/pc to S$142.50/pc (save S$37.50 on 5, S$75 on 10). The discount shows as a separate line in the price breakdown so you can see what it is worth at your quantity.',
  },
  {
    question: 'Can you cut out any shape, or only standard silhouettes?',
    answer:
      'Any outline you supply, as long as you give us the cut-line on its own layer in the .AI / PDF file. Typical silhouettes are people (ambassador, celebrity, couple, sports figure, character), mascots, product cut-outs (bottle, packaging hero), and text cut-outs (logo, single word, date). Narrow protrusions under 5mm wide (thin hair strands, antennae, individual fingers) tend to snap in transit — we pre-check and thicken them with your permission before the die runs.',
  },
  {
    question: 'What artwork format do you need?',
    answer:
      'Adobe Illustrator (.AI) file or a print-ready PDF — CMYK colour space, 300dpi minimum, 3mm bleed around the figure\'s silhouette, fonts outlined. Put the cutting outline on its own named layer ("DIECUT" or "CUT") so the plotter operator can isolate it. The face should be at least 20% of the figure\'s total height so it reads from across a room. Free file check inside 12 hours — if bleed is short, a colour is in RGB, or the cut-line is missing you hear from us the same business day.',
  },
  {
    question: 'How long does it take from order to pickup?',
    answer:
      'One working day from artwork approval to ready-for-collection at Paya Lebar Square on digital runs of single pieces; bulk runs of 5+ can take 2 working days to allow the die cycle and lamination to complete cleanly. We flag the exact ready-by date when quoting. Free delivery within Singapore on orders over S$150, or collect for free at Paya Lebar Square any working day.',
  },
  {
    question: 'How do the standees pack and ship?',
    answer:
      'Each standee ships flat with the floor backer pre-slotted but not assembled — the backer clips onto the rear of the cut-out in seconds at the venue, no tools needed. Bulk runs are boxed together with card dividers between each piece to protect the face. For outdoor-venue uses, tell us upstream — we can flag a heavier-gauge backer to stop the figure toppling in moderate wind.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Apply — preserves any admin-uploaded images on how_we_print cards.
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
  const [prod] = await sql`select id from public.products where slug='life-size-standee'`;
  if (!prod) throw new Error('life-size-standee not found');

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
  console.log('✓ life-size-standee content rewritten');
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
