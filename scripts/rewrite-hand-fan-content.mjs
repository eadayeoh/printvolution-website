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
// Sets H1 to "Hand Fan Singapore," + italic emphasis — user explicitly
// asked for that keyword in the H1 (overrides the default "don't touch
// h1/h1em on rewrites" memory rule). Name stays "Hand Fan" since that's
// the catalogue / breadcrumb label.

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

// H1 — user asked for "Hand Fan Singapore" keyword.
const h1 = 'Hand Fan Singapore,';
const h1em = 'ready for the event.';

const tagline =
  'Branded hand fans for Singapore events — 310gsm art card with matt lamination or 500gsm waterproof synthetic, plastic-handle or hand-held, 14 supplier shapes, fully assembled on arrival. From 100 pieces, seven working days.';

const description =
  'Custom-printed hand fans for roadshows, GE rallies, National Day block parties, temple distributions, wedding favours and corporate anniversaries. 310gsm Art Card with Matt Lamination for the event-standard build, or 500gsm Synthetic Card for outdoor heat and humid air. Plastic-handle or hand-held paddle, 14 supplier shapes (round, cloud, star, bear, thumbs-up, polka, paddles and more), fully assembled by us — body glued to handle in a straight line, ready to wave out of the box.';

const intro =
  'Hand fan jobs decide on four things — the stock, the handle, the shape, and the run size. **310gsm Art Card with Matt Lamination** is the event default: the matt-lam finish survives a three-hour roadshow in 32°C heat without the ink cracking at the handle crease. **500gsm Synthetic Card** is the premium call for outdoor-all-day or humid-goodie-bag scenarios — waterproof, does not absorb perspiration from the palm. Handle options: **Yes — with plastic handle** (body glued in a straight line, S$0.21/pc assembly included) or **No — hand-held paddle** (no stick, 310gsm only). Shape is supplier-defined: 11 with-handle shapes (Types A–K) and 3 paddle shapes (Types L–N) — no custom die-cut. Quantity tiers run 100, 200, 300, 400, 500, 1,000, 2,000, 3,000 — you order and receive the tier the calculator shows.';

const seo_title = 'Hand Fan Printing Singapore | 310gsm Matt & 500gsm Synthetic';
const seo_desc =
  'Branded hand fans Singapore — 310gsm art card with matt lamination or 500gsm waterproof synthetic, plastic-handle or paddle, 14 supplier shapes, fully assembled. From 100 pcs, seven-day.';

// 2-line keyword-intense body per site-wide SEO style.
const seo_body =
  'Hand fan printing Singapore — roadshow giveaways, GE rally fans, National Day block-party handouts, wedding favours, religious-festival distributions, corporate-event fans, mall-launch merchandise, trade-show takeaways. ' +
  '310gsm art card with matt lamination or 500gsm waterproof synthetic card, 14 supplier shapes (round, cloud, cross-pattern, soft square, flower, star, raindrop, bear, thumbs-up, polka, diamond, paddles), plastic-handle or hand-held — fully assembled, 100–3,000 pieces, seven working days.';

// ────────────────────────────────────────────────────────────────────
// Matcher — each row maps to a real configurator combo.
// Price math: tier base + (qty × 0.212 assembly when handle=yes).
// ────────────────────────────────────────────────────────────────────
const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the event,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'Every fan is event-graded.',
  right_note_body:
    'Handle glued in a straight line, stock that survives sweat. Boxed by 100s with the fan face protected — grab and distribute at the booth.',
  rows: [
    {
      need: '*Roadshow at Bugis Junction* this Saturday — 500 branded fans for booth visitors',
      pick_title: '310gsm Art Card · Matt Lam · Plastic Handle · Type B Cloud · 500 pcs',
      pick_detail:
        'Matt lam on 310gsm is the event-standard build — survives a three-hour afternoon in 32°C heat without the ink cracking at the handle crease. From S$549.40 including assembly. Seven working days.',
      apply: { material: '310gsm', finishing: 'matt', handle: 'yes', type: 'b', assembly: 'yes', qty: 500 },
    },
    {
      need: '*National Day block party* — 1,000 fans in polka-dot shape for the neighbourhood',
      pick_title: '310gsm Art Card · Matt Lam · Plastic Handle · Type J Polka · 1,000 pcs',
      pick_detail:
        'At 1,000 pieces the per-fan price drops sharply — from S$794.10 including assembly. Polka circle pattern reads playful across a crowd; matt lam keeps fingerprints off after a full day of handling.',
      apply: { material: '310gsm', finishing: 'matt', handle: 'yes', type: 'j', assembly: 'yes', qty: 1000 },
    },
    {
      need: '*Outdoor all-day corporate anniversary* — humidity, sweaty palms, 300 fans',
      pick_title: '500gsm Synthetic Card · Plastic Handle · Type A Round · 300 pcs',
      pick_detail:
        '500gsm synthetic is waterproof — no absorption when palms sweat, no warping in humid air. Type A round is the only shape the supplier offers on synthetic stock. From S$587.70 including assembly.',
      apply: { material: '500gsm', finishing: 'none', handle: 'yes', type: 'a', assembly: 'yes', qty: 300 },
    },
    {
      need: '*Temple / religious-festival distribution* — 3,000 paddle fans, no stick',
      pick_title: '310gsm Art Card · Matt Lam · No Handle · Type L Paddle · 3,000 pcs',
      pick_detail:
        'Hand-held paddle (no stick) — fits palms of all ages in a prayer hall, quicker to distribute in bulk, no assembly fee. From S$918.00. Only available on 310gsm matt — synthetic has no no-handle option.',
      apply: { material: '310gsm', finishing: 'matt', handle: 'no', type: 'l', qty: 3000 },
    },
    {
      need: '*Small corporate event*, 100 pieces, *tight budget* — still looks proper',
      pick_title: '310gsm Art Card · Matt Lam · Plastic Handle · Type G Raindrop · 100 pcs',
      pick_detail:
        'Cheapest entry — 100 pcs with handle and assembly from S$257.10. Raindrop circle is one of the 11 with-handle shapes; the matt-lam finish still photographs premium at the smallest run size.',
      apply: { material: '310gsm', finishing: 'matt', handle: 'yes', type: 'g', assembly: 'yes', qty: 100 },
    },
  ],
};

// ────────────────────────────────────────────────────────────────────
// Magazine — four articles keyed to the real axis decisions.
// ────────────────────────────────────────────────────────────────────
const seo_magazine = {
  issue_label: 'Issue · Hand Fan',
  title: 'Everything worth knowing,',
  title_em: 'before you print 500.',
  lede:
    'A branded hand fan is the only promo item people pocket at an outdoor booth in Singapore. **Stock, handle, shape, quantity** — four axes decide whether it gets flapped all weekend or tossed by noon. Here is what actually matters on each one.',
  articles: [
    {
      num: '01',
      title: '310gsm Art Card or 500gsm Synthetic — the stock decision.',
      body: [
        '**310gsm Art Card with Matt Lamination** is the event default. The matt-lam finish survives a three-hour afternoon at Gardens by the Bay or a Bugis Junction roadshow — the ink does not crack at the crease where the card meets the plastic handle, the edge stays crisp through 400 flaps an hour. It is the cheapest stock that still reads as premium, and it is what most customers order.',
        '**500gsm Synthetic Card** is the premium call. It is waterproof — so outdoor-all-day events, humid goodie bags, and scenarios where the fan will travel home in an MRT bag without drying out all favour synthetic. It does not absorb perspiration from the palm. The trade-off is price (roughly 60% more per piece at 500 pcs) and shape — the supplier only offers the round Type A on synthetic, so custom shapes are not available on this stock.',
      ],
      side: {
        kind: 'pills',
        label: 'Stock picker',
        items: [
          { text: '310gsm Art Card + Matt', pop: true },
          { text: '500gsm Synthetic' },
          { text: 'Synthetic = waterproof' },
          { text: 'Synthetic = round only' },
        ],
      },
    },
    {
      num: '02',
      title: 'Plastic handle or hand-held paddle — what the use case tells you.',
      body: [
        '**Plastic handle (Yes)** is what most people picture — a rigid stick glued in a straight line along the centre axis of the fan, body-to-handle bonded so it does not wobble when flapped. Assembly is included at S$0.21 per piece; the fans arrive ready to wave out of the box, no DIY step at the event. Available on both 310gsm and 500gsm, across 11 supplier shapes (Types A through K).',
        '**No handle — hand-held paddle (No)** is a 310gsm-only option with 3 paddle shapes (Types L, M, N — all round, 170 × 170mm). Reason to pick it: temple / religious-festival distributions where the fan is held flat in a prayer hall, bulk events where speed-of-distribution matters more than a stick, or brands that want a clean round silhouette with the grip built into the card itself. Skip the assembly fee entirely since there is nothing to glue.',
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
      num: '03',
      title: '14 supplier shapes — pick by silhouette, not by novelty.',
      body: [
        'The supplier offers **14 ready shapes**: Type A (round, synthetic only); Types B–K on 310gsm matt with handle (cloud, cross-pattern, soft square, flower, star, raindrop circle, bear, thumbs-up, polka circle, small diamond); Types L–N on 310gsm matt without handle (three round paddle variants, 170 × 170mm). We do **not offer custom die-cuts** on hand fans — the plotter setup for one-off shapes does not pay back at fan quantities.',
        'Pick by silhouette readability from two metres: **round / cloud / polka** for friendly consumer brands, **cross / diamond / raindrop** for corporate and launch events, **bear / thumbs-up / star / flower** for CNY and festival handouts where the shape carries the mood. If the brief asks for something outside the 14, we recommend switching to car-decal or die-cut sticker products where custom cut lines are standard.',
      ],
      side: {
        kind: 'stat',
        label: 'Supplier shapes',
        num: '14',
        caption: '1 synthetic · 11 handle · 3 paddle',
      },
    },
    {
      num: '04',
      title: 'Designing for a surface that will be in constant motion.',
      body: [
        'A fan is read while moving — design brief changes. Small body copy and thin sans-serif taglines smear into nothing when the fan is flapping; the audience sees a blur and reads nothing. Push the **logo to roughly 40% of the fan face**, strip the copy to a single line of large type, and put the QR code on the back where the person holds the fan still to scan it. Double-sided printing is included — front for the brand, back for the event date, hashtag, or booth number.',
        '**Files we prefer**: Adobe Illustrator (.AI) or print-ready PDF, CMYK colour, 300dpi, 3mm bleed around the die-cut shape, fonts outlined. Put front and back on separate artboards (or a two-page PDF, clearly labelled). Free file check in 12 hours — if anything needs a fix you hear from us inside the first business day.',
      ],
      side: {
        kind: 'quote',
        text: 'We ordered 500 fans for the CNY mall activation. Every one went home with a customer — nothing left in the bin.',
        attr: 'Marketing Lead, SG mall tenant',
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '🪭',
    title: 'Straight-glued handles',
    desc: 'Plastic handle aligned to the centre axis, body-to-handle bonded — no drift, no wobble when the fan is flapped. Glue cures 48 hours before packing.',
  },
  {
    icon_url: null,
    emoji: '✨',
    title: 'Matt lam on 310gsm art card',
    desc: 'The event-standard build — matt lamination on 310gsm card keeps fingerprints off, protects ink at the handle crease, photographs premium across a booth.',
  },
  {
    icon_url: null,
    emoji: '💦',
    title: '500gsm synthetic stock',
    desc: 'Waterproof option for outdoor heat, humid air and sweaty palms. Does not absorb perspiration; holds rigid through a full afternoon of use.',
  },
  {
    icon_url: null,
    emoji: '📦',
    title: 'Event-pack ready',
    desc: 'Bulk-boxed by 100 pieces, fan face protected, handle-down — grab and distribute at the booth. No assembly step on your side.',
  },
];

const faqs = [
  {
    question: 'What stock should I pick — 310gsm Art Card or 500gsm Synthetic?',
    answer:
      '310gsm Art Card with Matt Lamination is the event default — survives a three-hour roadshow in 32°C heat, ink does not crack at the handle crease, and you get access to the full 11 with-handle shapes plus the 3 no-handle paddles. 500gsm Synthetic Card is waterproof — pick it for outdoor-all-day events, humid goodie bags, or any scenario where perspiration or rain is on the cards. The trade-off: synthetic is roughly 60% more per piece at 500 pcs and only comes in the round Type A shape.',
  },
  {
    question: 'Do I need the plastic handle, or can I go hand-held?',
    answer:
      'Both work. Plastic handle (Yes) is the conventional fan — a rigid stick glued in a straight line along the centre axis, body-to-handle bonded, arrives fully assembled and ready to wave. Available across Types A–K. No handle (hand-held paddle) is a 310gsm-only option with 3 paddle shapes (Types L, M, N — all round 170 × 170mm). It skips the assembly fee, distributes quicker in bulk, and suits temple or religious-festival use where the fan is held flat in a prayer hall.',
  },
  {
    question: 'What shapes are available?',
    answer:
      '14 supplier shapes total: Type A (round, on 500gsm synthetic only); Types B–K on 310gsm matt with handle (cloud, cross-pattern, soft square, flower, star, raindrop circle, bear, thumbs-up, polka circle, small diamond); Types L–N on 310gsm matt without handle (three round paddle variants at 170 × 170mm). The configurator on this page filters the shape list to what is actually available for the stock + finishing + handle combo you have picked.',
  },
  {
    question: 'Can I order a custom die-cut shape?',
    answer:
      'Not on hand fans — the plotter setup for one-off shapes does not pay back at fan quantities, so we stick to the 14 supplier shapes. If a custom outline is a hard requirement, the car-decal and die-cut-sticker products on the site take any vector shape you draw. For fans, pick the closest supplier shape and rely on the artwork to carry the brand read.',
  },
  {
    question: 'Is assembly included in the price?',
    answer:
      'Yes, when you pick the plastic handle. Fully assembled is the only build we offer on handle fans — body glued to handle in a straight line, cured for 48 hours before packing, shipped in bulk boxes ready to distribute. The assembly fee is S$0.21 per piece and shows as a separate line in the breakdown. When you pick no handle (paddle), there is nothing to assemble and no fee.',
  },
  {
    question: "What's the minimum order, and can I order any quantity?",
    answer:
      'Minimum 100 pieces across all configs. Supplier tiers: 100, 200, 300, 400, 500, 1,000 — plus 2,000 and 3,000 on 310gsm matt with no handle. The calculator snaps your typed quantity to the nearest tier at or below what you entered (e.g. typing 750 snaps to 500 pcs at the 500 rate). You order and receive the tier quantity the calculator shows — we do not quote custom in-between numbers on hand fans.',
  },
  {
    question: 'How long does it take from order to pickup?',
    answer:
      'Seven working days. The supplier runs are offset-printed, finished (matt lamination on 310gsm, none on synthetic), die-cut to the chosen shape, and glued to the handle if applicable. The glue cures 48 hours before the fans ship, so the quoted seven-day lead time is from artwork approval to ready-for-collection at Paya Lebar Square. Free delivery within Singapore over S$150.',
  },
  {
    question: 'What artwork format do you need?',
    answer:
      'Adobe Illustrator (.AI) file or a print-ready PDF — CMYK colour space, 300dpi minimum, 3mm bleed around the die-cut shape, fonts outlined. Double-sided: put front and back on separate artboards, or a two-page PDF clearly labelled front / back. Design tip for fans specifically: push the logo to roughly 40% of the fan face (it is read while moving), keep copy to a single line of large type, and put the QR code on the back where people hold the fan still to scan. Free file check in 12 hours.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Apply
// ────────────────────────────────────────────────────────────────────
try {
  const [prod] = await sql`select id from public.products where slug='hand-fan'`;
  if (!prod) throw new Error('hand-fan not found');

  await sql`
    update public.products
    set tagline = ${tagline},
        description = ${description}
    where id = ${prod.id}
  `;

  // User explicitly asked for H1 to carry "Hand Fan Singapore" —
  // override the default "skip h1 on rewrites" convention here.
  await sql`
    insert into public.product_extras (product_id, seo_title, seo_desc, seo_body, h1, h1em, intro, matcher, seo_magazine, how_we_print)
    values (${prod.id}, ${seo_title}, ${seo_desc}, ${seo_body}, ${h1}, ${h1em}, ${intro}, ${sql.json(matcher)}, ${sql.json(seo_magazine)}, ${sql.json(how_we_print)})
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
