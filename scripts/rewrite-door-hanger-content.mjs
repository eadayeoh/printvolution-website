// Rewrites door-hanger page content to match the real pricing_table:
//   Paper: 260GSM / 310GSM Art Card
//   Lamination: None / Matt Lamination
//   Spot UV (only on 260gsm + Matt): None / Single Sided / Double Sided
//   Size: fixed 240×89mm, pre-cut knob hole, 4C + 4C
//   Qty: 100 → 10,000 tiered · Print: Offset · Lead time: 7 working days
//
// Leaves H1 (h1) and H1 italic sub (h1em) untouched — user curates
// those by hand. Rewrites: tagline, description, seo_title/desc/body,
// intro, matcher, seo_magazine, how_we_print, FAQs.

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
  'Offset-printed door hangers on 260gsm or 310gsm art card, 240×89mm with a pre-cut knob hole. Optional matt lamination and 1- or 2-side spot UV. Runs from 100 pieces, seven-working-day turnaround.';

const description =
  'Bulk offset-printed door hangers in a 240×89mm DL format with a pre-cut knob hole. Pick 260gsm or 310gsm art card, optional matt lamination, and 1- or 2-side spot UV on matt-laminated 260gsm. Priced per qty tier from 100 pieces, seven working days.';

const intro =
  'Door hangers get read because they physically need a decision — someone picks it up, holds it, chooses to flip it or toss it. For those few seconds you have undivided attention. We print 240×89mm hangers on 260gsm or 310gsm art card with a pre-cut knob hole, offset, double-sided full colour. Add matt lamination for durability, or spot UV (1 or 2 sides) for a glossy raised accent. Tier pricing from 100 pieces, seven working days to ready-for-collection.';

const seo_title = 'Door Hanger Printing Singapore | DL, Matt Lam, Spot UV';
const seo_desc =
  'Offset-printed 240×89mm DL door hangers on 260gsm or 310gsm art card. Matt lamination, 1- or 2-side spot UV. Bulk runs from 100 pieces, 7-working-day lead time.';

const seo_body =
  'Door hanger printing Singapore — HDB estate drops, property launch campaigns, F&B promotion hangers, hotel privacy tags, real-estate listing hangers. ' +
  '260gsm or 310gsm art card with optional matt lamination and 1- or 2-side spot UV, clean 240×89mm die-cut hole, bundle-packed for door-by-door distribution.';

const matcher = {
  kicker: 'Quick guide',
  title: 'Tell us the job,\nwe\'ll point you at',
  title_em: 'the right spec.',
  right_note_title: 'Every hanger is 240 × 89mm, double-sided.',
  right_note_body:
    'Offset CMYK on both faces with a pre-cut knob hole and bundled packing for door-by-door distribution. The choices below are about paper weight, protection, and finish — not size.',
  rows: [
    {
      need: 'Cheap-as-possible *HDB block drop* — simple two-colour message, one-time distribution',
      pick_title: '260gsm Art Card · no lamination · 500 pcs',
      pick_detail:
        'From S$142 for 500 pcs (≈ S$0.28 each). Bare 260gsm — no lam, no UV — is the lowest per-piece cost when the hanger only needs to land once.',
      apply: { paper: '260', lamination: 'none', uv: 'none', qty: 500 },
    },
    {
      need: 'F&B *delivery promo* — hangers will get touched, stuffed into bags, rained on during distribution',
      pick_title: '260gsm + Matt Lamination · 1000 pcs',
      pick_detail:
        'S$212 for 1000 pcs (≈ S$0.21 each). Matt lam stops smudging, scuffing and moisture — a must once the hanger needs to survive any handling.',
      apply: { paper: '260', lamination: 'matt', uv: 'none', qty: 1000 },
    },
    {
      need: 'Premium *property launch* — the hanger IS the first impression of the development',
      pick_title: '260gsm + Matt Lam + Single-Side Spot UV · 500 pcs',
      pick_detail:
        'S$232 for 500 pcs (≈ S$0.46 each). Spot UV on the front face adds a glossy raised accent over logo or building render — the tactile cue that reads "prestige" before they flip it over.',
      apply: { paper: '260', lamination: 'matt', uv: 'single', qty: 500 },
    },
    {
      need: 'Luxury *hotel privacy tag* or info hanger that sits on the door both sides of a Do-Not-Disturb flip',
      pick_title: '260gsm + Matt Lam + Double-Side Spot UV · 500 pcs',
      pick_detail:
        'S$292 for 500 pcs (≈ S$0.58 each). Spot UV on both faces — the hanger reads premium from the corridor and from the guest side, no weak side.',
      apply: { paper: '260', lamination: 'matt', uv: 'double', qty: 500 },
    },
    {
      need: 'Large-estate *5000+ piece* rollout where thickness signals seriousness',
      pick_title: '310gsm + Matt Lamination · 5000 pcs',
      pick_detail:
        'S$1,036.80 for 5000 pcs (≈ S$0.21 each). 310gsm feels noticeably heavier in the hand — the hanger lands with intent, not disposable-flyer energy. Full 15-tier pricing ladder from 100 up to 10,000.',
      apply: { paper: '310', lamination: 'matt', uv: 'none', qty: 5000 },
    },
  ],
};

const seo_magazine = {
  issue_label: 'Issue · Door Hangers',
  title: 'Everything worth knowing,',
  title_em: 'before you order.',
  lede:
    'Door hangers get one shot at attention — the hand that picks them up. **Here is what actually matters** when you pick the paper, the finish, and the run size.',
  articles: [
    {
      num: '01',
      title: 'Why door hangers still land when emails don\'t.',
      body: [
        `A door hanger is *unskippable in a way a flyer isn't*. A regular flyer joins a stack, gets swept off the bench, vanishes. A hanger is hooked onto the handle — to open the door you have to engage with it, even if "engage" just means sliding it off. That moment of unavoidable contact is the entire value proposition, and it's why property agents and F&B chains keep ordering them in thousands despite living in an all-digital marketing stack.`,
        `What this means for your design: **you have one glance, both sides**. The front has to carry a single claim or offer big enough to read at arm's length. The back is where the detail lives — menu, promo code, agent contact. Both sides print 4C here, so use the back properly. A blank reverse is a wasted 240×89mm of attention.`,
      ],
      side: {
        kind: 'pills',
        label: 'Who uses door hangers',
        items: [
          { text: 'Property agents', pop: true },
          { text: 'F&B delivery promos' },
          { text: 'Hotels + serviced residences' },
          { text: 'HDB estate campaigns' },
          { text: 'Gym + salon launches' },
          { text: 'Neighbourhood services' },
        ],
      },
    },
    {
      num: '02',
      title: '260gsm vs 310gsm — when the extra weight earns its price.',
      body: [
        `Both weights are proper art card — neither flops in the hand. **260gsm** is the default: sturdy, feels deliberate, prints colour beautifully, and lands at the lowest per-piece cost. For most F&B and property-launch jobs it's the right call. **310gsm** adds about 20% thickness and a noticeable density in the hand — the hanger registers before anyone even reads it.`,
        `The price gap is small at short runs and closes further at scale. At 5000 pieces the 310gsm + Matt Lam tier is only ~8% more per piece than 260gsm + Matt Lam, and unlike 260gsm it offers every quantity tier from 100 up to 10,000 in 1000-step increments — the cleanest ladder on the product. Pick 310gsm when the hanger is the brand, not an ad.`,
      ],
      side: {
        kind: 'list',
        label: 'At a glance',
        rows: [
          { text: '260gsm Art Card', time: 'default' },
          { text: '310gsm Art Card', time: '+20% thickness' },
          { text: '260gsm tiers', time: '9' },
          { text: '310gsm tiers', time: '15 full' },
        ],
      },
    },
    {
      num: '03',
      title: 'Matt lamination + spot UV — what they actually do.',
      body: [
        `Matt lamination is a thin plastic film bonded over the card after printing. It does three things: stops ink from smudging, resists moisture and finger oil, and gives the hanger a **soft, premium touch** that raw art card can't. Once a hanger has to survive distribution — being stuffed into a bag, rained on between blocks, touched by a hundred hands — lamination is the difference between "still looks new" and "curled and smeared."`,
        `Spot UV sits on top of matt lam as a localised glossy layer. It's the classic business-card trick: matt background, gloss logo. Picking **Single Sided** means one face gets the treatment (usually the front); **Double Sided** does both. Spot UV only ships on 260gsm + Matt Lam here because that's the stock the supplier plates can carry — the gloss doesn't adhere cleanly to bare card or heavier 310gsm without additional setup we don't currently offer.`,
      ],
      side: {
        kind: 'pills',
        label: 'What matt + spot UV fixes',
        items: [
          { text: 'Smudged ink on touch', pop: true },
          { text: 'Warping in humidity' },
          { text: 'Cheap-flyer feel' },
          { text: 'Logo lost in the layout' },
          { text: 'Weak tactile hierarchy' },
          { text: 'Dull look in corridor light' },
        ],
      },
    },
    {
      num: '04',
      title: 'Seven working days, and what that covers.',
      body: [
        `Seven working days is file-approved to ready-for-collection at Paya Lebar Square. Inside that: day 1 — preflight; day 2 — plate setup; days 3–5 — offset run on both faces; day 6 — lamination and/or spot UV; day 7 — die-cut the knob hole, bundle, quality check. Runs above 3000 pieces sometimes add a day for the cut stage; we flag that when you quote, not on the collection call.`,
        `Files we prefer: **print-ready PDF, CMYK, 300dpi, 3mm bleed, fonts outlined**. If the hanger uses spot UV, send a separate 1-bit mask layer for the UV areas (we'll explain the template when you order). Free preflight is part of the seven-day window, so if your file needs a fix you hear from us inside the first day — not on day six.`,
      ],
      side: {
        kind: 'list',
        label: 'Day-by-day',
        rows: [
          { text: 'Preflight + file check', time: 'Day 1' },
          { text: 'Plate setup', time: 'Day 2' },
          { text: 'Offset run, both sides', time: 'Days 3–5' },
          { text: 'Lam + spot UV', time: 'Day 6' },
          { text: 'Die-cut + bundle', time: 'Day 7' },
        ],
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '🖨️',
    title: 'Offset, both sides CMYK',
    desc: '4C + 4C offset on every hanger — full colour front and back, no flip-to-a-blank-side waste. Offset gives identical colour across the whole run, which matters when every hanger in a 5000-piece drop has to match.',
  },
  {
    icon_url: null,
    emoji: '🔪',
    title: 'Pre-cut knob hole, standard',
    desc: 'Every hanger ships with the door-handle hole already die-cut — no extra charge, no separate step. The 240 × 89mm DL size is the one that fits 90% of residential and hotel door handles.',
  },
  {
    icon_url: null,
    emoji: '✨',
    title: 'Matt lam + spot UV in-house',
    desc: 'Matt lamination for protection; spot UV for a raised glossy accent on logos or headlines. One- or two-side UV is a checkbox, not a custom-quote dance.',
  },
  {
    icon_url: null,
    emoji: '📦',
    title: 'Bundle-packed for distribution',
    desc: 'Bundles of 50 or 100 per shrink-wrap so your distribution team can grab-and-go by the block. No loose stacks, no bent corners from the print run to the door.',
  },
];

const faqs = [
  {
    question: 'What size are the door hangers?',
    answer: '240 × 89mm (DL proportion) with a pre-cut hole sized for a standard residential or hotel door handle. This is the only size we offer at the tier pricing on this page — the dies are set to this dimension. Custom sizes need a separate quote.',
  },
  {
    question: 'What is the difference between 260gsm and 310gsm art card?',
    answer: '260gsm is the default — solid, premium-feeling, takes colour beautifully. 310gsm is about 20% thicker and noticeably heavier in the hand — the hanger registers its own presence before anyone reads it. 310gsm also has the full 15-tier price ladder from 100 to 10,000 in 1000-piece steps; 260gsm has 9 tiers.',
  },
  {
    question: 'What is spot UV and why is it only available on 260gsm + Matt Lamination?',
    answer: 'Spot UV is a localised glossy coating applied on top of matt lamination — picture a matt background with a glossy logo that catches the light. The supplier press we use plates this finish only on 260gsm matt-laminated stock; bare card and 310gsm aren\'t on the spot-UV menu for this product. Pick Single Sided for UV on one face (usually the front), Double Sided for both.',
  },
  {
    question: 'Are the hangers single- or double-sided print?',
    answer: 'Always double-sided. Every hanger on this product is 4C + 4C — full CMYK on both faces, priced that way. The "Single Sided" / "Double Sided" option under Spot UV is about where the UV gloss goes, not the print — the colour prints on both sides regardless.',
  },
  {
    question: 'What is the minimum order?',
    answer: '100 pieces for most combinations (260gsm Art, 260gsm + Matt, 260gsm + Matt + 1-Side UV, 310gsm + Matt). Two combinations start at 200: 260gsm + Matt + 2-Side Spot UV, and 310gsm Art Card (no lam). The calculator only shows valid qty tiers for the paper + finish you\'ve picked.',
  },
  {
    question: 'Can I order a quantity between the tiers, like 250 or 1500 pieces?',
    answer: 'Yes — enter the number you want. The calculator snaps to the nearest supplier tier at or below your number, so 250 pcs prices at the 200 tier, 1500 pcs prices at the 1000 tier. You receive the full quantity you ordered; you only pay the lower-tier rate.',
  },
  {
    question: 'What is the lead time?',
    answer: '7 working days from file approval to ready-for-collection at Paya Lebar Square. Inside that window: preflight (day 1), plate setup (day 2), offset run (days 3–5), matt lamination and spot UV (day 6), die-cut and bundle (day 7). Runs above 3000 pieces may add a day for cutting — we flag it when quoting.',
  },
  {
    question: 'What artwork format do you need?',
    answer: 'Print-ready PDF, CMYK, 300 dpi, 3mm bleed on every edge, fonts outlined or embedded. Double-sided artwork as a two-page PDF (front + back). For spot UV, send a separate 1-bit mask layer marking the gloss areas — we\'ll share the template when you order. Free preflight inside 12 hours; if the file needs a fix you\'ll hear from us before plate setup begins.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Apply
// ────────────────────────────────────────────────────────────────────
try {
  const [prod] = await sql`select id from public.products where slug='door-hanger'`;
  if (!prod) throw new Error('door-hanger not found');

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

  // Drop any legacy 1-axis pricing matrix — pricing_table is the only
  // source of truth now.
  await sql`delete from public.product_pricing where product_id = ${prod.id}`;

  // Replace FAQs
  await sql`delete from public.product_faqs where product_id = ${prod.id}`;
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    await sql`
      insert into public.product_faqs (product_id, question, answer, display_order)
      values (${prod.id}, ${f.question}, ${f.answer}, ${i})
    `;
  }

  // Verify H1 untouched
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

  console.log('✓ door-hanger content rewritten');
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
