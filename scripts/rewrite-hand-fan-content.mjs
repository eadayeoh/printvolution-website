// Rewrites hand-fan page content to match the real configurator:
//
//   Material   — 310gsm Art Card (most popular) / 500gsm Synthetic Card (premium, waterproof)
//   Finishing  — None (500gsm) / Matt Lamination (310gsm)
//   Handle     — Yes, with plastic handle / No, hand-held paddle (310gsm only)
//   Type       — 14 supplier shapes (A = round synthetic; B–K = handle shapes
//                on 310gsm matt; L–N = no-handle paddles on 310gsm matt)
//   Assembly   — Always "Fully assembled" (+S$0.21/pc) when handle=yes
//   Quantity   — Tier-snap 100, 200, 300, 400, 500, 1000, 2000, 3000
//
// Keyword: "Hand Fan Printing Singapore" (H1 + SEO title + body).
// User explicitly asked for the keyword-in-H1 override — safe to write
// h1 / h1em here (default "skip h1 on rewrites" rule is waived).

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

// ────────────────────────────────────────────────────────────────────
// Copy
// ────────────────────────────────────────────────────────────────────

// H1 — user asked for "Hand Fan Printing Singapore" keyword in H1.
const h1 = 'Hand Fan Printing Singapore,';
const h1em = 'offset-run, fully assembled.';

const tagline =
  'Custom-printed branded hand fans for Singapore events — matt-laminated art card or waterproof synthetic, 14 ready shapes plus custom-quote die-cuts, plastic-handle or paddle, fully assembled. From 100 pieces, seven working days.';

// Short description — shown as the hero sub-copy directly under the
// H1, so keep it to one crisp sentence. The full stock / shape / handle
// details live in the intro + magazine below, not here.
const description =
  'Hand fan printing in Singapore for roadshows, rallies, block parties, temple handouts, weddings and corporate anniversaries — fully assembled, from 100 pieces in seven working days.';

// Intro — plain text; not rendered on the hero anymore (description
// wins there now) but still feeds JSON-LD / search-engine metadata.
// Kept concise and without markdown — asterisks would show up verbatim
// in structured-data snippets.
const intro =
  'Hand fan printing in Singapore splits into four decisions — stock, finishing, handle, shape — and the calculator locks each down in order. 310gsm Art Card with Matt Lamination is the event-standard pick and unlocks the full shape library (11 with-handle shapes Types A–K plus 3 paddle shapes Types L–N). 500gsm Synthetic Card is waterproof for outdoor-all-day and humid-goodie-bag use cases (round Type A only). Handle: Yes (with plastic handle, fully assembled at S$0.21/pc assembly fee included in the line) or No (hand-held paddle, 310gsm only). Quantity tiers run 100 through 3,000 pieces; custom die-cut silhouettes are available on a custom quote. Seven working days from artwork approval to ready-for-collection at Paya Lebar Square.';

// SEO attributes intentionally carry use-cases + location + outcome
// only — no material names (gsm, art card, synthetic) or print specs
// (offset, CMYK, matt lam, die-cut). Those live in the body content
// (description / intro / magazine), not the SEO metadata.
const seo_title = 'Hand Fan Printing Singapore | Roadshows, Rallies, Events & Weddings';
const seo_desc =
  'Hand fan printing Singapore for roadshows, GE rallies, National Day parties, temple handouts, weddings and corporate events. From 100 pieces, fully assembled, seven working days — collected at Paya Lebar or delivered free over S$150.';

// 2-line keyword-intense body per site-wide SEO style. No material
// names / specs here — just use-cases, location, quantity, lead time.
const seo_body =
  'Hand fan printing Singapore — roadshow giveaways, GE rally fans, National Day block-party handouts, temple and religious-festival distributions, wedding favours, corporate-anniversary fans, mall-launch merchandise, trade-show takeaways. ' +
  '14 ready shapes plus custom-quote die-cut silhouettes, plastic-handle or hand-held paddle, fully assembled from 100 to 3,000 pieces in seven working days — collected at Paya Lebar Square or delivered island-wide free over S$150.';

// ────────────────────────────────────────────────────────────────────
// Matcher — each row maps to a real configurator combo.
// Price math: tier base + (qty × 0.212 assembly when handle=yes).
// ────────────────────────────────────────────────────────────────────
const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the event,\nwe'll print you",
  title_em: 'the right fan.',
  right_note_title: 'Offset-run, event-graded.',
  right_note_body:
    'Offset-printed on both faces, matt-laminated on 310gsm or 500gsm synthetic, die-cut to the shape you pick, plastic handle attached and fully assembled on the handle builds.',
  rows: [
    {
      need: '*Roadshow at Bugis Junction* this Saturday — 500 branded fans for booth visitors',
      pick_title: '310gsm Art Card · Matt Lam · Plastic Handle · Type B Cloud · 500 pcs',
      pick_detail:
        'Matt lam on 310gsm is the event-standard print for Singapore-heat booths — solid hand-feel, fingerprint-resistant, photographs premium across the run. From S$549.40 including assembly. Seven working days.',
      apply: { material: '310gsm', finishing: 'matt', handle: 'yes', type: 'b', assembly: 'yes', qty: 500 },
    },
    {
      need: '*National Day block party* — 1,000 printed fans in polka-dot shape for the neighbourhood',
      pick_title: '310gsm Art Card · Matt Lam · Plastic Handle · Type J Polka · 1,000 pcs',
      pick_detail:
        'At 1,000 pieces the per-fan print cost drops sharply — from S$794.10 including assembly. Polka circle reads playful across a crowd; matt lam keeps the fingerprints off after a full afternoon of handling.',
      apply: { material: '310gsm', finishing: 'matt', handle: 'yes', type: 'j', assembly: 'yes', qty: 1000 },
    },
    {
      need: '*Outdoor all-day corporate anniversary* — humidity, sweaty palms, 300 fans printed',
      pick_title: '500gsm Synthetic Card · Plastic Handle · Type A Round · 300 pcs',
      pick_detail:
        '500gsm synthetic is waterproof — no absorption when palms sweat, no warping in humid air. Type A round is the only shape printed on synthetic stock. From S$587.70 including assembly.',
      apply: { material: '500gsm', finishing: 'none', handle: 'yes', type: 'a', assembly: 'yes', qty: 300 },
    },
    {
      need: '*Temple / religious-festival distribution* — 3,000 paddle fans, no stick',
      pick_title: '310gsm Art Card · Matt Lam · No Handle · Type L Paddle · 3,000 pcs',
      pick_detail:
        'Hand-held paddle (no stick) — fits palms of all ages in a prayer hall, quicker to distribute in bulk, no assembly fee. From S$918.00. Only printed on 310gsm matt — synthetic has no no-handle option.',
      apply: { material: '310gsm', finishing: 'matt', handle: 'no', type: 'l', qty: 3000 },
    },
    {
      need: '*Small corporate event*, 100 fans, *tight budget* — still prints premium',
      pick_title: '310gsm Art Card · Matt Lam · Plastic Handle · Type G Raindrop · 100 pcs',
      pick_detail:
        'Cheapest entry — 100 pcs printed with handle and assembly from S$257.10. Raindrop circle is one of the 11 with-handle shapes; matt-lam finish still photographs premium at the smallest run size.',
      apply: { material: '310gsm', finishing: 'matt', handle: 'yes', type: 'g', assembly: 'yes', qty: 100 },
    },
  ],
};

// ────────────────────────────────────────────────────────────────────
// Magazine — four articles keyed to the real axis decisions.
// ────────────────────────────────────────────────────────────────────
const seo_magazine = {
  issue_label: 'Issue · Hand Fan Printing',
  title: 'Everything worth knowing,',
  title_em: 'before the plates lock.',
  lede:
    'Hand fans are offset-printed, not digital — we run plates, lay ink both sides, die-cut the shape, matt-laminate 310gsm stock, and attach the plastic handle on the handle builds. **Stock, handle, shape, quantity** — four decisions that change the outcome on the booth floor. Here is what actually matters on each one.',
  articles: [
    {
      num: '01',
      title: 'Why hand fans are offset-printed from 100 pieces, not digital.',
      body: [
        'Hand fans are **offset-printed on both faces**, die-cut to the shape you pick, and finished — not digital. The reason: offset amortises plate setup across the whole run and locks colour identically from fan 1 to fan 3,000, which is what a National Day block party or a retail roadshow actually needs. Digital drifts slightly across a 500-piece run; on a welcome table fanned out in front of visitors, that drift shows up as one corner of the pile reading warmer than the other.',
        'Total lead time is **seven working days** from artwork approval to ready-for-collection at Paya Lebar Square. On the handle builds, the fans ship **fully assembled** — plastic handle already attached, so you unbox and distribute at the event. Free delivery within Singapore over S$150.',
      ],
      side: {
        kind: 'stat',
        label: 'Lead time',
        num: '7 days',
        caption: 'artwork approval → ready for collection',
      },
    },
    {
      num: '02',
      title: '310gsm Art Card with Matt Lam, or 500gsm Synthetic — the stock call.',
      body: [
        '**310gsm Art Card with Matt Lamination** is the event default. Matt lam adds a tactile, premium hand-feel, keeps fingerprints off across a day of handling, and reads well on camera under booth lighting. On 310gsm it is the cheapest stock that still feels proper, and it unlocks the full shape library — 11 with-handle shapes (A–K) and 3 paddle shapes (L–N).',
        '**500gsm Synthetic Card** is the premium call. It is waterproof — outdoor-all-day events, humid goodie bags and rain-on-the-forecast scenarios all favour synthetic over card. Trade-off: price (roughly 60% more per piece at 500 pcs) and shape — synthetic only runs the round Type A, so custom silhouettes would need to switch to 310gsm matt (or run on a custom quote).',
      ],
      side: {
        kind: 'pills',
        label: 'Stock picker',
        items: [
          { text: '310gsm + Matt Lam', pop: true },
          { text: '500gsm Synthetic' },
          { text: 'Synthetic = waterproof' },
          { text: 'Synthetic = round only' },
        ],
      },
    },
    {
      num: '03',
      title: 'Plastic handle or hand-held paddle — decide by how the fan gets used.',
      body: [
        '**Plastic handle (Yes)** is the conventional fan — rigid stick attached to the fan body, arrives fully assembled. Assembly is S$0.21 per piece and shows as a separate line in the breakdown. Available on both 310gsm and 500gsm, across 11 ready shapes (Types A through K). This is what you pick for roadshows, rallies, block parties — anywhere people will flap it.',
        '**No handle — hand-held paddle (No)** is a 310gsm-only option with 3 paddle shapes (Types L, M, N — all round, 170 × 170mm). Reasons to pick it: temple and religious-festival distributions where the fan is held flat in a prayer hall, bulk giveaways where speed of distribution outweighs the flapping use case, or brands that want a clean round silhouette with the grip built into the card itself. Skip the assembly fee — nothing to attach.',
      ],
      side: {
        kind: 'list',
        label: 'Handle by event',
        rows: [
          { text: 'Roadshow / rally', time: 'Plastic handle' },
          { text: 'Outdoor anniversary', time: 'Plastic handle' },
          { text: 'Temple distribution', time: 'No handle' },
          { text: 'Bulk giveaway', time: 'Either' },
        ],
      },
    },
    {
      num: '04',
      title: 'Files, bleed, and the 14 ready shapes — what to hand our print shop.',
      body: [
        'Send an **Adobe Illustrator (.AI) file or print-ready PDF** — CMYK colour space, 300dpi minimum, 3mm bleed around the die-cut shape, fonts outlined. Double-sided: put front and back on separate artboards, or a two-page PDF clearly labelled front / back. Our file check runs inside 12 hours — if bleed is short, a colour is in RGB, or a font is missing you hear from us the same business day, before the plates go down.',
        'The 14 ready shapes are: Type A round (synthetic only), Types B–K with handle on 310gsm matt (cloud, cross-pattern, soft square, flower, star, raindrop circle, bear, thumbs-up, polka circle, small diamond), Types L–N no-handle round paddles. Pick by two-metre silhouette readability — the fan is read while moving, so silhouette does more work than fine detail. **Custom die-cut silhouettes are available** too (mascot outlines, logo marks, bottle shapes) — they run on a custom quote since the one-off plotter tooling sits outside the on-page calculator.',
      ],
      side: {
        kind: 'stat',
        label: 'Ready shapes',
        num: '14',
        caption: '1 synthetic · 11 handle · 3 paddle · custom on quote',
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '🖨️',
    title: 'Offset-printed both faces',
    desc: 'CMYK offset on both sides from 100 pieces — colour locks identical across the run, fan 1 and fan 3,000 match on the welcome table.',
  },
  {
    icon_url: null,
    emoji: '✨',
    title: 'Matt lam on 310gsm art card',
    desc: 'Matt lamination gives the fan a premium, fingerprint-resistant hand-feel and reads well on camera under booth lighting across a day of use.',
  },
  {
    icon_url: null,
    emoji: '💦',
    title: '500gsm waterproof synthetic',
    desc: 'Waterproof synthetic stock — pick this for outdoor-all-day events, humid goodie bags, or anything where rain is on the forecast.',
  },
  {
    icon_url: null,
    emoji: '🪭',
    title: 'Fully assembled on handles',
    desc: 'Handle-build fans ship with the plastic handle already attached — unbox and distribute, no DIY assembly at the event.',
  },
];

const faqs = [
  {
    question: 'Why are hand fans offset-printed and not digital?',
    answer:
      'Offset earns its setup at fan quantities. We run plates once and the per-piece print cost drops sharply across both sides of the card — from 100 pcs upward, offset beats digital on price and locks colour identically across the whole run. That matters when 500 branded fans are fanned out on a welcome table side-by-side: digital drifts and one corner of the pile reads warmer than the other. Offset does not drift.',
  },
  {
    question: 'Which stock should I pick — 310gsm Art Card or 500gsm Synthetic?',
    answer:
      '310gsm Art Card with Matt Lamination is the event default — tactile, fingerprint-resistant, reads premium on camera, and it unlocks the full shape library (11 with-handle shapes plus 3 no-handle paddles). 500gsm Synthetic Card is waterproof — outdoor-all-day events, humid goodie bags, or rain-on-the-forecast. The trade-off: synthetic is roughly 60% more per piece at 500 pcs and only runs in the round Type A shape.',
  },
  {
    question: 'Do I need the plastic handle, or can I go hand-held?',
    answer:
      'Both work. Plastic handle (Yes) is the conventional fan — rigid stick attached to the body, arrives fully assembled and ready to wave. Available across Types A–K. No handle (hand-held paddle) is a 310gsm-only option with 3 paddle shapes (Types L, M, N — all round 170 × 170mm). It skips the assembly fee, distributes quicker in bulk, and suits temple or religious-festival use where the fan is held flat in a prayer hall.',
  },
  {
    question: 'What shapes are available?',
    answer:
      '14 ready shapes total. Type A (round, on 500gsm synthetic only); Types B–K on 310gsm matt with handle — cloud, cross-pattern, soft square, flower, star, raindrop circle, bear, thumbs-up, polka circle, small diamond; Types L–N on 310gsm matt without handle — three round paddle variants at 170 × 170mm. The configurator on this page filters the shape list live to what is actually available for your stock + finishing + handle combo.',
  },
  {
    question: 'Can I order a custom die-cut shape on a hand fan?',
    answer:
      'Yes — custom die-cut silhouettes are available on hand fans (mascot outlines, logo marks, bottle shapes, anything you can vector). They run on a **custom quote** instead of through the on-page calculator, because the one-off plotter tooling, artwork review and cutting-die setup need to be priced against your shape and quantity. Send us your vector outline via the contact form or email and we come back with shape feasibility + pricing, usually within one working day. The 14 ready shapes on the calculator cover most briefs and skip the custom-quote step.',
  },
  {
    question: 'Is assembly included, and what does "fully assembled" mean?',
    answer:
      'Yes — when you pick the plastic handle, fully assembled is the only build we offer. The fans ship with the handle already attached, ready to distribute at the event. The assembly fee is S$0.21 per piece and shows as a separate line in the breakdown. When you pick no handle (paddle), there is nothing to assemble and no fee.',
  },
  {
    question: "What's the minimum order and how do quantity tiers work?",
    answer:
      'Minimum 100 pieces across all configs. Price tiers: 100, 200, 300, 400, 500, 1,000 — plus 2,000 and 3,000 on 310gsm matt with no handle. The calculator snaps your typed quantity to the nearest tier at or below what you entered (e.g. typing 750 snaps to 500 pcs at the 500 rate). You order and receive the tier quantity the calculator shows — we do not quote custom in-between numbers on hand fans.',
  },
  {
    question: 'What artwork format do you need, and how long is the file check?',
    answer:
      'Send an Adobe Illustrator (.AI) file or a print-ready PDF — CMYK colour space, 300dpi minimum, 3mm bleed around the die-cut shape, fonts outlined. Double-sided: put front and back on separate artboards, or a two-page PDF clearly labelled front / back. Free file check inside 12 hours — if bleed is short, a colour is in RGB, or a font is missing, you hear from us the same business day, before the plates go down.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Apply — preserves any admin-uploaded images on how_we_print cards
// (keyed by title) so re-running this rewrite never wipes icons the
// admin set through the editor.
// ────────────────────────────────────────────────────────────────────
function mergeHowWePrintIcons(newCards, existingCards) {
  if (!Array.isArray(existingCards) || existingCards.length === 0) return newCards;
  // Match by title first (safe against reorder), fall back to index.
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
  const [prod] = await sql`select id from public.products where slug='hand-fan'`;
  if (!prod) throw new Error('hand-fan not found');

  // Snapshot existing extras so we can merge admin-set images back in
  // rather than clobbering them with the hard-coded defaults below.
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

  // User explicitly asked for H1 to carry "Hand Fan Printing Singapore" —
  // override the default "skip h1 on rewrites" convention here.
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

  // Replace FAQs
  await sql`delete from public.product_faqs where product_id = ${prod.id}`;
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    await sql`
      insert into public.product_faqs (product_id, question, answer, display_order)
      values (${prod.id}, ${f.question}, ${f.answer}, ${i})
    `;
  }

  const [check] = await sql`
    select p.tagline,
           e.h1, e.h1em, e.seo_title,
           jsonb_array_length(coalesce(e.seo_magazine->'articles','[]'::jsonb)) as articles,
           jsonb_array_length(coalesce(e.how_we_print, '[]'::jsonb)) as hwp_cards,
           jsonb_array_length(coalesce(e.matcher->'rows', '[]'::jsonb)) as matcher_rows,
           (select count(*) from public.product_faqs f where f.product_id = p.id) as faqs
    from public.products p
    left join public.product_extras e on e.product_id = p.id
    where p.id = ${prod.id}
  `;

  console.log('✓ hand-fan content rewritten');
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
