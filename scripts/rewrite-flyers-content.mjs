// Rewrites flyers page content to match the real configurator:
//
//   Method         — Digital (short runs, 1-day) or Offset (bulk, 7-day)
//   Digital sizes  — A4 / A5 / A6
//   Digital paper  — 128gsm / 157gsm Art Paper · 250gsm / 300gsm Art Card
//   Digital sides  — Single / Double, continuous qty 22–500 (BM calc)
//   Digital lam    — None / Matt / Gloss (shown only on card stock)
//   Offset sizes   — A4 / A5 (A5 also carries 260gsm / 310gsm Art Card)
//   Offset paper   — 128gsm / 157gsm Art Paper (+ A5 Art Card)
//   Offset sides   — 4C+0C / 4C+4C
//   Offset qty     — tier-snap 300 → 200,000
//
// Sets H1 to "Flyer Printing Singapore," + magenta emphasis — user
// explicitly asked for that keyword in the H1 for SEO (overrides the
// default "don't touch h1/h1em on rewrites" memory rule). Name stays
// "Flyers" since that's the catalogue / breadcrumb label.

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

// H1 — user asked for "Flyer Printing Singapore" keyword.
const h1 = 'Flyer Printing Singapore,';
const h1em = 'digital or offset.';

const tagline =
  'Digital same-day flyers from 50 pieces, offset bulk runs up to 200,000 — A4, A5 or A6 on 128gsm art paper through 300gsm art card. One method for fast small runs, one for bulk. Same page.';

const description =
  'Digital or offset flyer printing in Singapore. Size A4 / A5 / A6, paper 128gsm and 157gsm Art Paper or 250gsm / 300gsm Art Card, matt or gloss lamination on card stock, single- or double-sided. Digital runs 50→500 pieces in one working day; offset runs 300→200,000 pieces in seven working days.';

const intro =
  'Most flyer jobs land in one of two shapes — a fast small run of 50 to 500 for immediate handouts, or a bulk run of thousands for door-drops and trade shows. Same product, different presses. We price both methods on the same page: **Digital** for short runs with continuous-quantity pricing (type any number 1 to 500) and one-working-day turnaround; **Offset** for bulk tier pricing from 300 up to 200,000 pieces, seven working days. Pick A4 for the standard flyer, A5 for the mid-size handout, A6 for postcards and coupons. Paper weights run from 128gsm Art Paper (standard flyer feel) through 300gsm Art Card (postcard-stiff). The method picker at the top of the calculator reshapes everything else.';

const seo_title = 'Flyer Printing Singapore | A4 A5 A6 Digital & Offset';
const seo_desc =
  'Digital same-day flyers from 50 pcs, offset bulk runs up to 200,000. A4 / A5 / A6 on 128gsm–300gsm stock, matt or gloss lam on card, Singapore-printed.';

// 2-line keyword-intense body per site-wide SEO style.
const seo_body =
  'Flyer printing Singapore — HDB estate drops, F&B promotion flyers, property launch leaflets, event handouts, exhibition takeaways, retail pamphlets, corporate invitations. ' +
  'A4 / A5 / A6 on 128gsm or 157gsm art paper and 250gsm or 300gsm art card, 4C+0C or 4C+4C, matt or gloss laminated on card stock — digital from 50 pieces same-day, offset from 300 pieces to 200,000 pieces in seven working days.';

const matcher = {
  kicker: 'Quick guide',
  title: 'Tell us the run,\nwe\'ll point you at',
  title_em: 'the right spec.',
  right_note_title: 'Digital ≤ 500 pcs · Offset 300 pcs+',
  right_note_body:
    'The method split is by quantity and tech. Digital does small short-run perfectly with same-day turnaround. Offset kicks in from 300 pieces up and gets cheaper-per-piece as volume grows, at a 7-working-day lead time.',
  rows: [
    {
      need: '*Restaurant new-menu handout* — need 200 tomorrow for the reopening',
      pick_title: 'A4 · 128gsm Art Paper · Double-Sided · Digital · 200 pcs',
      pick_detail:
        'Digital at 200 pieces lands next working day — A4 fits a full-menu layout without squeezing, 128gsm is the standard flyer feel. One-working-day from artwork approval to Paya Lebar pickup.',
      apply: { method: 'digital', size: 'a4', paper: '128art', sides: '2', qty: 200 },
    },
    {
      need: '*F&B delivery-area door drop* — 5,000 A5 flyers for a postcode campaign',
      pick_title: 'A5 · 157gsm Art Paper · 4C+4C · Offset · 5,000 pcs',
      pick_detail:
        'A5 is the unignorable-in-a-door-handle size. At 5,000 pieces, offset is both cheaper and more consistent than digital — 157gsm holds up through handling and weather on the route. Seven working days.',
      apply: { method: 'offset', size_offset: 'a5', paper_offset: '157art', sides_offset: '4c4c', qty_offset: 5000 },
    },
    {
      need: '*Property launch door drop* across multiple HDB blocks — 20,000 A4',
      pick_title: 'A4 · 157gsm Art Paper · 4C+4C · Offset · 20,000 pcs',
      pick_detail:
        'Fleet-scale run: 157gsm gives the "this is a real launch, not an ad" feel; 4C+4C lets the back carry floorplans and price list. Per-piece cost at 20,000 is a fraction of the 500-piece rate — offset really earns its setup fee here.',
      apply: { method: 'offset', size_offset: 'a4', paper_offset: '157art', sides_offset: '4c4c', qty_offset: 20000 },
    },
    {
      need: '*Event RSVP postcard* — 300 premium A6 on card stock, matt-laminated',
      pick_title: 'A6 · 250gsm Art Card · Double-Sided · Matt Lam · Digital · 300 pcs',
      pick_detail:
        'A6 is the postcard/coupon size — fits a purse, reads from the hand. 250gsm card feels like a real invitation, not a flyer. Matt lamination on card keeps fingerprints off. Digital at 300 pieces lands in one day.',
      apply: { method: 'digital', size: 'a6', paper: '250card', sides: '2', lamination: 'matt', qty: 300 },
    },
    {
      need: '*Trade-show takeaway sheet* — 1,000 A5 with photography, feel matters',
      pick_title: 'A5 · 157gsm Art Paper · 4C+4C · Offset · 1,000 pcs',
      pick_detail:
        '1,000 is the crossover point where offset starts beating digital on per-piece cost. 157gsm art paper on 4C+4C gives photos proper depth — the print is the pitch. Seven-day lead time so plan around your show date.',
      apply: { method: 'offset', size_offset: 'a5', paper_offset: '157art', sides_offset: '4c4c', qty_offset: 1000 },
    },
  ],
};

const seo_magazine = {
  issue_label: 'Issue · Flyers',
  title: 'Everything worth knowing,',
  title_em: 'before you order.',
  lede:
    'Flyers look simple until you order them. **Method, size, paper, quantity** — each decision pulls the price, the feel, and the lead time in a different direction. Here\'s what actually matters.',
  articles: [
    {
      num: '01',
      title: 'Digital vs offset — when to pick which.',
      body: [
        `The rule-of-thumb is roughly **500 pieces**. Below that, digital is almost always right — no plate setup, one-working-day turnaround, continuous pricing so 127 pieces costs exactly what 127 pieces of work should cost. Above 1,000 pieces, offset almost always wins — the plate setup amortises across the run, per-piece cost drops sharply, and colour is identical on piece 1 and piece 10,000. In the 300–1,000 band, both methods are offered and the call comes down to lead time: digital gets you it tomorrow, offset gets you it in a week for less.`,
        `The second difference is **consistency across the run**. Digital presses drift slightly over long runs — piece 1 and piece 5,000 might print a hair differently. For a fleet of identical brand flyers, offset's locked-in plate wins. For a small run where any drift is invisible, digital's flexibility wins. Nobody notices in practice below 500; everybody notices above 3,000.`,
      ],
      side: {
        kind: 'list',
        label: 'Which method',
        rows: [
          { text: 'Under 500 pcs', time: 'Digital' },
          { text: '300–1,000 pcs', time: 'Either' },
          { text: 'Over 1,000 pcs', time: 'Offset' },
          { text: 'Need it tomorrow', time: 'Digital' },
        ],
      },
    },
    {
      num: '02',
      title: 'A4, A5 or A6 — picking by use.',
      body: [
        `Flyer size is a *handling decision*, not a design one. **A4** (210 × 297mm) is the full-sheet flyer — room for a detailed menu, a long-form announcement, a full floor plan. It's the default for restaurants and property. **A5** (148 × 210mm) is the door-drop / hand-out size — small enough to shove through a door handle or a bag without folding, big enough to carry a hero image plus a call-to-action. Default for F&B delivery campaigns and event handouts. **A6** (105 × 148mm) is the postcard / coupon size — fits a purse, reads in one glance, feels more like an invitation than a flyer. Default for event RSVPs, loyalty stamps, promo codes.`,
        `Mistake to avoid: picking A4 out of habit when the run is a door-drop campaign. A5 costs less per piece, fits door handles without bending, and still carries everything it needs. The only reason to use A4 for a door drop is if the design genuinely needs the real estate.`,
      ],
      side: {
        kind: 'pills',
        label: 'Size cheat sheet',
        items: [
          { text: 'A4 = full menu / launch', pop: true },
          { text: 'A5 = door drop / handout' },
          { text: 'A6 = postcard / coupon' },
          { text: 'A6 = 4-up on A4 sheet' },
          { text: 'A5 = 2-up on A4 sheet' },
          { text: 'A4 = flat, standalone' },
        ],
      },
    },
    {
      num: '03',
      title: 'Paper weight vs card stock — the feel decision.',
      body: [
        `**128gsm Art Paper** is standard flyer stock — solid, not flimsy, prints colour cleanly, and stacks light for bulk distribution. It's what you expect in your mailbox. **157gsm Art Paper** is a step heavier — the hand recognises the upgrade without knowing why. For launches, events and anything where the flyer should feel considered, 157 is worth the small upcharge. **250gsm and 300gsm Art Card** cross into postcard / invitation territory — stiff, landing-with-a-soft-thud on a table, holding up to a binder or a fridge magnet. Once you're on card, **matt or gloss lamination** is an option (not offered on paper stock) — matt for a tactile premium feel, gloss to make product photography pop.`,
        `At the run quantity, the rule is: **heavier stock = higher per-piece cost, but diminishing gap at scale**. At 100 pieces, 300gsm card can be 2–3× the price of 128gsm paper. At 10,000 pieces, the gap narrows as the base printing cost dominates.`,
      ],
      side: {
        kind: 'list',
        label: 'Stock feel',
        rows: [
          { text: '128gsm Art Paper', time: 'flyer' },
          { text: '157gsm Art Paper', time: 'premium flyer' },
          { text: '250gsm Art Card', time: 'postcard' },
          { text: '300gsm Art Card', time: 'stiff postcard' },
        ],
      },
    },
    {
      num: '04',
      title: 'Lead times and what they cover.',
      body: [
        `Digital is **one working day**: approve artwork before 11am today, pick up tomorrow afternoon. Inside that window: file check (within 12 hours), print, cut, wrap. No plate setup, no cure time. Offset is **seven working days**: day 1 preflight, day 2 plate setup, days 3–5 print run, days 6–7 finishing (lamination on card, cut, bundle). Runs over 50,000 pieces can add a day or two for cutting — we flag it when you quote.`,
        `**Files we prefer**: Adobe Illustrator (.AI) or print-ready PDF, CMYK colour, 300dpi, 3mm bleed on every edge, fonts outlined. Put front and back on separate artboards (or two-page PDF, clearly labelled). Free file check inside 12 hours — if anything needs a fix you'll hear from us inside the first business day, not on day six.`,
      ],
      side: {
        kind: 'list',
        label: 'Day-by-day (offset)',
        rows: [
          { text: 'Preflight', time: 'Day 1' },
          { text: 'Plate setup', time: 'Day 2' },
          { text: 'Print run', time: 'Days 3–5' },
          { text: 'Finish + cut', time: 'Days 6–7' },
        ],
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '⚡',
    title: 'Digital, same-day small runs',
    desc: 'Short-run jobs (50–500 pcs) print digital: no plate setup, continuous qty pricing, ready for collection the next working day. The right method for restaurants, events and one-off campaigns.',
  },
  {
    icon_url: null,
    emoji: '🖨️',
    title: 'Offset, bulk-run economics',
    desc: '300–200,000 piece runs go to offset: one-time plate setup, then identical colour on piece 1 and piece 10,000, with per-piece cost dropping sharply at the 5,000 and 20,000 tiers.',
  },
  {
    icon_url: null,
    emoji: '✨',
    title: 'Matt or gloss lam on card stock',
    desc: '250gsm and 300gsm Art Card get matt or gloss lamination as a checkbox. Matt for a tactile premium feel; gloss for food photography and product shots. Not offered on art paper (the stock is too light).',
  },
  {
    icon_url: null,
    emoji: '🔍',
    title: 'Human file check in 12 hours',
    desc: 'Every PDF / AI file is reviewed before the job goes to press. CMYK conversion, bleed, resolution and font embedding are checked. You hear back the same business day if anything needs a fix.',
  },
];

const faqs = [
  {
    question: 'Digital or offset — which should I pick?',
    answer: 'Under 500 pieces: digital. The setup-free workflow beats offset on price, lead time, and flexibility at short runs. Over 1,000 pieces: offset. The plate setup amortises, per-piece cost drops, and colour stays identical across the whole run. Between 300 and 1,000 pieces, both are offered: pick digital if you need it tomorrow, offset if you can wait a week for a lower price.',
  },
  {
    question: 'What sizes do you print?',
    answer: 'A4 (210 × 297mm), A5 (148 × 210mm) or A6 (105 × 148mm). A4 is the full-sheet flyer — menus, launches, detailed layouts. A5 is the door-drop / handout size — fits door handles and bags without folding. A6 is the postcard / coupon size — fits a purse, reads in one glance. Digital offers all three; offset offers A4 and A5 (A5 also supports 260gsm / 310gsm Art Card). A6 is digital-only right now.',
  },
  {
    question: 'What paper options do you have?',
    answer: '128gsm Art Paper (standard flyer feel — what you expect in your mailbox), 157gsm Art Paper (one step heavier, feels considered), 250gsm Art Card (postcard-stiff, matt or gloss lamination available), 300gsm Art Card (heaviest, invitation-grade, lamination available). Offset A5 additionally offers 260gsm and 310gsm Art Card. Lamination is card-only — art paper is too light to lam.',
  },
  {
    question: 'Is lamination available on all flyers?',
    answer: 'No — lamination is offered only on 250gsm and 300gsm Art Card (Digital) and 260gsm / 310gsm Art Card (Offset, A5 only). Art paper (128gsm / 157gsm) is too thin for lamination to adhere properly, so we don\'t offer it there. If you need a laminated flyer, pick a card stock.',
  },
  {
    question: 'What\'s the minimum order?',
    answer: 'Digital: minimum 22 pieces for A4, 44 for A5, 88 for A6 (based on the per-A3-sheet minimum of the press). Practically, most digital customers order 50 or 100. Offset: minimum 300 pieces for A4/A5 art paper, 600 for A5 art card. If you type a quantity below the minimum the calculator will tell you.',
  },
  {
    question: 'Can I order any quantity I want?',
    answer: 'On digital: yes, type any integer up to 500. The price recomputes live using the exact supplier rate for that quantity — no snapping. On offset: the calculator snaps to the nearest supplier tier at or below what you type (e.g. typing 1,500 snaps to 1,000 pcs at the 1,000 rate). What the calculator shows is what you order and what you receive. We don\'t quote custom in-between numbers on offset.',
  },
  {
    question: 'How long does delivery take?',
    answer: 'Digital: one working day from file approval to ready-for-collection at Paya Lebar Square. Approve the file before 11am, collect the next afternoon. Offset: seven working days — day 1 preflight, day 2 plate setup, days 3–5 print run, days 6–7 finishing (lam, cut, bundle). Runs over 50,000 pcs may add a day or two for cutting; we flag it up-front when quoting. Collection is free; delivery within Singapore is free over S$150.',
  },
  {
    question: 'What artwork format do you need?',
    answer: 'Send an Adobe Illustrator (.AI) file or a print-ready PDF — CMYK colour space, 300dpi minimum, 3mm bleed on every edge, fonts outlined or embedded. Put the front and back on separate artboards (or a two-page PDF with clearly labelled front / back). Free file check within 12 hours; if anything needs a fix you\'ll hear from us before the job enters production.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Apply
// ────────────────────────────────────────────────────────────────────
try {
  const [prod] = await sql`select id from public.products where slug='flyers'`;
  if (!prod) throw new Error('flyers not found');

  await sql`
    update public.products
    set tagline = ${tagline},
        description = ${description}
    where id = ${prod.id}
  `;

  // User explicitly asked for H1 to carry "Flyer Printing Singapore" —
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

  console.log('✓ flyers content rewritten');
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
