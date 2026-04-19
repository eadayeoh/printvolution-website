// Rewrites easel-stand page content to match what we actually sell:
//   Poster sizes: A2 · A1 · A0
//   Print media (finish): Matt Lam / Gloss Lam (both included)
//   Board: Compressed Foam Board (included) / Black Kapaline Board
//   Stand: Black aluminium tripod (included) / Wooden easel
//   Print: Eco Solvent · Lead time: 1 working day
//
// Leaves H1 (h1) + H1 italic sub (h1em) untouched per memory — rewrites
// tagline, description, seo_title/desc/body, intro, matcher,
// seo_magazine, how_we_print, and FAQs.

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

const tagline =
  'Printed easel stands for same-day events — A2, A1 or A0 poster on foam or black kapaline board, matt or gloss laminated, on a black aluminium tripod or wooden easel. One working day from artwork to ready-for-pickup.';

const description =
  'Portable printed easel stands for Singapore events, lobbies, weddings, F&B and retail pop-ups. Pick poster size (A2 / A1 / A0), finish (matt or gloss lam), board (foam or black kapaline) and stand (black tripod or wooden easel). Eco-solvent digital print, one working day turnaround.';

const intro =
  'Events, hotel lobbies, restaurants and retail pop-ups all share one signage problem — you need something visible for a few hours or a few days, in a specific spot, without drilling into the wall or leaving anything behind. The printed easel stand solves it in one piece. Pick a poster size (A2 tabletop, A1 lobby, A0 entrance-scale), laminate it matt or gloss, mount it on foam or black kapaline board, and stand it on a black aluminium tripod or a wooden easel. One working day from file approval to ready-for-pickup at Paya Lebar Square.';

const seo_title = 'Easel Stand Printing Singapore | A2 A1 A0 Event Displays';
const seo_desc =
  'Printed easel stands for Singapore events, weddings, lobbies, F&B and retail. A2, A1 or A0 poster on foam or black kapaline board, matt or gloss lam, black tripod or wooden easel. One-day turnaround.';

// Two lines, keyword-intense per the site-wide SEO body style.
const seo_body =
  'Easel stand printing Singapore — wedding venue welcome signs, hotel lobby directionals, event registration boards, restaurant menu specials, retail pop-up displays, exhibition supplementary signage. ' +
  'A2 / A1 / A0 poster printed eco-solvent, matt or gloss laminated, mounted on compressed foam or black kapaline board, standing on a black aluminium tripod or wooden easel — one working day from file to event-ready.';

const matcher = {
  kicker: 'Quick guide',
  title: 'Tell us the job,\nwe\'ll point you at',
  title_em: 'the right spec.',
  right_note_title: 'Every easel stand ships event-ready.',
  right_note_body:
    'Poster printed eco-solvent at your chosen size, laminated, bonded to the board, set up on the stand, and boxed for transport. Unbox, unfold the tripod (or prop the wooden easel), and it\'s live.',
  rows: [
    {
      need: '*Wedding welcome sign* at the reception entrance — reads from 3–5m away',
      pick_title: 'A1 · Matt Lamination · Foam Board · Black Tripod',
      pick_detail:
        'A1 (594 × 841mm) is the sweet spot for standing signage — big enough to read across a walkway, small enough to place on a side table. Matt lam kills flash from venue lighting. Black aluminium tripod disappears into the background so the poster is the thing people see.',
      apply: { size: 'a1', media: 'matt', board: 'foam', stand: 'black', qty: 1 },
    },
    {
      need: '*Restaurant weekly special* — daily menu board near the entrance',
      pick_title: 'A2 · Gloss Lamination · Foam Board · Black Tripod',
      pick_detail:
        'A2 (420 × 594mm) is the tabletop-to-waist-height size — perfect for a menu board near a host stand. Gloss lam makes food photography pop under the venue lights. Order a second one next week when the special changes.',
      apply: { size: 'a2', media: 'gloss', board: 'foam', stand: 'black', qty: 1 },
    },
    {
      need: '*Hotel lobby* event board for a corporate client, needs to look premium',
      pick_title: 'A0 · Matt Lamination · Black Kapaline Board · Wooden Easel',
      pick_detail:
        'A0 (841 × 1189mm) carries from across the lobby. Black kapaline board has a dark painted edge (instead of the white edge on plain foam) — the poster looks like a framed piece rather than a printed sheet. Wooden easel finishes the upscale look.',
      apply: { size: 'a0', media: 'matt', board: 'kapaline', stand: 'wooden', qty: 1 },
    },
    {
      need: 'Trade-show *booth supplementary signage* — two matching stands flanking the main panel',
      pick_title: 'A1 · Matt Lamination · Black Kapaline Board · Black Tripod · 2 pcs',
      pick_detail:
        'Kapaline\'s painted edge reads cleaner on a show floor with harsh lighting than raw foam board. A pair of A1s at the sides reinforces the main message without competing with it. Stack them in the crate between shows.',
      apply: { size: 'a1', media: 'matt', board: 'kapaline', stand: 'black', qty: 2 },
    },
    {
      need: 'Retail *pop-up campaign* — matching A0 stands across three locations',
      pick_title: 'A0 · Matt Lamination · Foam Board · Black Tripod · 3 pcs',
      pick_detail:
        'Foam board is the right call when you need three or more — lighter to transport, cheaper per set, and the white edge isn\'t visible once the stand is placed against the backdrop of a pop-up booth.',
      apply: { size: 'a0', media: 'matt', board: 'foam', stand: 'black', qty: 3 },
    },
  ],
};

const seo_magazine = {
  issue_label: 'Issue · Easel Stands',
  title: 'Everything worth knowing,',
  title_em: 'before you order.',
  lede:
    'An easel stand has to land on the right scale, the right finish, and the right mount — otherwise it looks cheap from three metres away. **Here is what actually matters** when you pick size, board, and stand.',
  articles: [
    {
      num: '01',
      title: 'What actually makes an easel stand work.',
      body: [
        `An easel stand is the *no-install signage solution*. You can't drill into a hotel lobby wall. You don't want to leave tape residue in a rented event venue. A poster on the floor is invisible. An easel stand solves all three — it brings the graphic up to reading height, stands on its own three legs (or wooden frame), and packs flat into a crate when the event is over.`,
        `What makes a good one is boring but crucial: **the stand has to not wobble**, the board has to not warp, and the graphic has to not wash out under venue lighting. Eco-solvent printing on laminated poster stock, bonded to a rigid board, on a properly counter-weighted tripod or hardwood easel — that combination is what we ship. Cheap easel stands fail on all three.`,
      ],
      side: {
        kind: 'pills',
        label: 'Where easel stands earn their keep',
        items: [
          { text: 'Wedding welcome signs', pop: true },
          { text: 'Hotel lobby directionals' },
          { text: 'Restaurant menu boards' },
          { text: 'Trade-show booth supplements' },
          { text: 'Retail pop-up campaigns' },
          { text: 'Corporate event signage' },
        ],
      },
    },
    {
      num: '02',
      title: 'A2, A1 or A0 — picking the right scale.',
      body: [
        `Size is a *viewing-distance decision*. **A2** (420 × 594mm) is tabletop-to-waist height — the menu board next to a host stand, the registration sign at a small event, the POS placard on a retail counter. Read it comfortably from 1–2 metres. **A1** (594 × 841mm) is the standing sign — reception welcome, lobby event board, booth flank. Reads from 3–5 metres. **A0** (841 × 1189mm) is the main-entrance piece — hotel grand lobby, mall pop-up façade, ballroom foyer. Reads from 5–8 metres away.`,
        `Mistake to avoid: picking A2 because it's the cheapest, then placing it where A1 was needed. The sign ends up looking like an afterthought. If the viewing distance is unclear, **go one size up**. An oversized easel sign reads as premium; an undersized one reads as an apology.`,
      ],
      side: {
        kind: 'list',
        label: 'Reading distance',
        rows: [
          { text: 'A2 (420 × 594mm)', time: '1–2m' },
          { text: 'A1 (594 × 841mm)', time: '3–5m' },
          { text: 'A0 (841 × 1189mm)', time: '5–8m' },
        ],
      },
    },
    {
      num: '03',
      title: 'Foam board vs black kapaline — when the edge shows.',
      body: [
        `The two board options are both 5mm rigid foam-cored, but the *edge finish* is the whole difference. **Compressed foam board** has a white paper skin top and bottom with a white foam core — the edge, when seen from the side, reads as three pale stripes. Great when the stand is placed against a wall, a backdrop, or a panel where nobody sees the edge. 90% of jobs.`,
        `**Black kapaline** has a black-painted core. The edge reads as a solid dark line — like a framed canvas. This matters when the stand is placed in the open (lobby centres, corridor mid-points, show floors with walking traffic on both sides) where the edge is visible from any angle. For premium-context jobs — hotel lobbies, luxury retail, corporate boardrooms — kapaline is worth the extra per piece. For a restaurant menu near the wall, foam is fine.`,
      ],
      side: {
        kind: 'list',
        label: 'Which board',
        rows: [
          { text: 'Edge against a wall', time: 'Foam' },
          { text: 'Edge visible', time: 'Kapaline' },
          { text: 'Throwaway / short job', time: 'Foam' },
          { text: 'Premium venue', time: 'Kapaline' },
        ],
      },
    },
    {
      num: '04',
      title: 'Matt vs gloss — lighting is what decides.',
      body: [
        `**Matt lamination** diffuses light. Under venue chandeliers, tilted downlights, photography flashes — matt stays readable from every angle with no hot spots. The signage default for anything indoors with ceiling lights.`,
        `**Gloss lamination** saturates colour and makes photography pop. Food shots on a restaurant menu, product shots on a retail sign, wedding photography on a welcome board — gloss adds depth. The trade-off is visible reflections if someone stands between the sign and a window or spotlight. Use gloss when the content is *image-heavy and colour-driven*; use matt when the content is *text-heavy and the sign moves around the room*.`,
      ],
      side: {
        kind: 'pills',
        label: 'Which finish',
        items: [
          { text: 'Text-heavy', pop: true },
          { text: 'Outdoor-adjacent' },
          { text: 'Moves around a room' },
          { text: 'Food photography' },
          { text: 'Product shots' },
          { text: 'Wedding photos' },
        ],
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '🖨️',
    title: 'Eco-solvent digital print',
    desc: 'Large-format eco-solvent ink on poster stock — sharp type, saturated colour, no setup cost per copy. The right method for 1–10 piece orders at A2/A1/A0 scale; different tech from the offset runs we use for bulk-print products.',
  },
  {
    icon_url: null,
    emoji: '✨',
    title: 'Laminated + board-mounted',
    desc: 'Matt or gloss lamination bonded to the poster after print, then mounted to compressed foam or black kapaline board. One rigid piece — no curl, no peeling edges, no separate parts to assemble.',
  },
  {
    icon_url: null,
    emoji: '🦵',
    title: 'Black tripod or wooden easel',
    desc: 'Black aluminium tripod (the conference-room standard) or solid wooden easel (the premium-venue choice). Both included with the poster — no separate stand order.',
  },
  {
    icon_url: null,
    emoji: '⚡',
    title: 'One working day, event-ready',
    desc: 'File-approved today, ready-for-pickup at Paya Lebar Square tomorrow. We print, laminate, mount and pack in one continuous run — no handoffs that add days.',
  },
];

const faqs = [
  {
    question: 'What poster sizes do you offer?',
    answer: 'A2 (420 × 594mm), A1 (594 × 841mm) or A0 (841 × 1189mm). A2 reads from 1–2 metres (tabletop, host stand, POS counter), A1 reads from 3–5 metres (lobby welcome, booth flank), A0 reads from 5–8 metres (main entrance, ballroom foyer). Pick by viewing distance; if unsure, go one size up.',
  },
  {
    question: 'What is the difference between compressed foam board and black kapaline board?',
    answer: 'Foam board has a white paper skin on both faces with a white foam core — the edge (when seen from the side) reads as three pale stripes. Included with the poster. Black kapaline has a black-painted core — the edge reads as a solid dark line, like a framed canvas. Kapaline costs a bit more per piece but is worth it whenever the edge of the stand is visible from open space (lobby centres, show floor, anywhere without a backdrop).',
  },
  {
    question: 'What is the difference between the black tripod and the wooden easel?',
    answer: 'The black tripod is a collapsible aluminium stand — the kind you see at conferences. Included with every poster, lightweight, packs flat, stable up to A0. The wooden easel is a solid hardwood easel with a fixed angle — premium look, heavier, better for hotel lobbies, luxury retail and venues where the stand itself should look like part of the décor.',
  },
  {
    question: 'Matt or gloss lamination — which should I pick?',
    answer: 'Matt is the default — diffuses light, no hot spots from ceiling lighting or camera flashes, reads cleanly from any angle. Pick matt for text-heavy signs, directionals, welcome boards, trade-show content. Gloss is the option when the design is image-driven — food shots on a menu, product photography, wedding photos. Gloss saturates colour but can reflect if someone stands between the sign and a window or spotlight.',
  },
  {
    question: 'Can I reuse the stand with a new poster later?',
    answer: 'The tripod and wooden easel are both reusable — they\'re standalone stands, not glued to the board. The poster-on-board is one piece (lam + print + mount are bonded), so a new design means a new board. If you need to refresh signage regularly (restaurant weekly specials, event week-by-week), keep one stand and reorder just the poster-on-board.',
  },
  {
    question: 'How do I set it up on the day?',
    answer: 'Black tripod: unclip the three legs, spread them to a stable angle, lock the collar. The board sits on the top support shelf. Wooden easel: fold out the rear leg until it locks, place the board on the ledge. No tools, no assembly, under 30 seconds either way. We ship the stand already folded with the poster-on-board in the same box.',
  },
  {
    question: 'How fast can I get it?',
    answer: 'One working day from file approval to ready-for-pickup at Paya Lebar Square. Approve the file before 11am today, collect tomorrow after 2pm. We print, laminate, mount and pack in one continuous run — no queue waits between stages.',
  },
  {
    question: 'What artwork format do you need?',
    answer: 'Send an Adobe Illustrator (.AI) file — CMYK, 150 dpi minimum at final print size (large-format print needs less DPI than small print; 150 is sufficient at A0 viewing distance), 3mm bleed on all sides, fonts outlined. PDF works too if the artwork is vector or high-resolution raster. Free file check inside 12 hours; if anything needs a fix you\'ll hear from us before printing starts.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Apply
// ────────────────────────────────────────────────────────────────────
try {
  const [prod] = await sql`select id from public.products where slug='easel-stand'`;
  if (!prod) throw new Error('easel-stand not found');

  await sql`
    update public.products
    set tagline = ${tagline},
        description = ${description}
    where id = ${prod.id}
  `;

  // Note: deliberately NOT touching h1 / h1em per user memory.
  await sql`
    update public.product_extras
    set seo_title = ${seo_title},
        seo_desc = ${seo_desc},
        seo_body = ${seo_body},
        intro = ${intro},
        matcher = ${sql.json(matcher)},
        seo_magazine = ${sql.json(seo_magazine)},
        how_we_print = ${sql.json(how_we_print)}
    where product_id = ${prod.id}
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

  console.log('✓ easel-stand content rewritten');
  console.log('  h1 (preserved):', check.h1);
  console.log('  h1em (preserved):', check.h1em);
  console.log('  seo_title:', check.seo_title);
  console.log('  articles:', check.articles);
  console.log('  how-we-print cards:', check.hwp_cards);
  console.log('  matcher rows:', check.matcher_rows);
  console.log('  faqs:', check.faqs);
} finally {
  await sql.end();
}
