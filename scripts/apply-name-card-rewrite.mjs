// Rewrite name-card in the new voice (matches the other 37 services).
// Replaces the old essay-style seo_body + empty magazine skeleton.

import fs from 'node:fs/promises';
import postgres from 'postgres';

const env = await fs.readFile(new URL('../.env.local', import.meta.url), 'utf8');
for (const raw of env.split('\n')) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('='); if (eq < 0) continue;
  const k = line.slice(0, eq).trim();
  const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[k]) process.env[k] = v;
}

const sql = postgres(process.env.SUPABASE_DB_URL, { prepare: false });

const seo_body =
  'Name card printing Singapore — business cards, corporate cards, premium paper, matt & gloss lamination, rounded corners. 310gsm Art Card, Maple, Pearlux, Shiruku Ivory, Grandeur stocks. Same-day pickup, islandwide delivery.';

const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the job,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'Hand-checked before press.',
  right_note_body: 'Every file preflighted for colour, bleed, and font integrity.',
  rows: [
    {
      need: 'You need cards before *tomorrow morning*',
      pick_title: '260gsm Art Card, Standard, No Lam',
      pick_detail: 'From S$24 · same-day pickup if before 4pm · the meeting-saver run',
    },
    {
      need: "You're ordering *500+* and brand colour has to land",
      pick_title: '310gsm Art Card, Matt Lam, Square',
      pick_detail: 'From S$28/100pcs · volume break kicks in · CMYK + Pantone hinted',
    },
    {
      need: 'The card has to *survive six months* in a wallet',
      pick_title: '310gsm Art + Matt Lamination, R4 Corner',
      pick_detail: "From S$36/100pcs · fingerprint-resistant · won't fray at the edges",
    },
    {
      need: 'First impression *has to feel expensive*',
      pick_title: '350gsm Grandeur White, R3 Corner',
      pick_detail: 'From S$35/100pcs · cotton-feel stock · heavier than people expect',
    },
    {
      need: "You're a freelancer and it's *your first run*",
      pick_title: '260gsm Art Card, Standard, Square',
      pick_detail: "From S$24/100pcs · clean baseline · you can upgrade next reorder",
    },
  ],
};

const seo_magazine = {
  issue_label: 'Issue №01 · Name Card',
  title: 'Everything worth knowing,',
  title_em: 'before you print the run.',
  lede:
    'Singapore still runs on name cards. A well-specced card costs less than a coffee per impression but signals more than any LinkedIn invite. Paper weight, lamination, finish, and corner cut each do a job — here\'s how to pick them without overthinking.',
  articles: [
    {
      num: '01',
      title: 'Why 310gsm is the quiet sweet spot.',
      body: [
        "Pick up a cheap name card and it bends in your hand. Pick up a **260gsm Art Card** and it feels acceptable but not memorable. Pick up **310gsm** and something changes — the weight registers before the design does. That extra 50 grams is why it's our best-selling stock and why corporate clients default to it without realising they're being cued by hand-feel.",
        "Beyond 310, the returns taper. **350gsm Grandeur** and **300gsm Pearlux / Shiruku** shift into textured and specialty-feel territory — worth it for creative or luxury brands, overkill for a sales manager's first reorder. If you don't know which to start with, start at 310 and upgrade only when the brand asks for it.",
      ],
      side: {
        kind: 'pills',
        label: 'Our top stocks',
        items: [
          { text: '260gsm Art Card' },
          { text: '310gsm Art Card', pop: true },
          { text: '300gsm Maple' },
          { text: '300gsm Pearlux' },
          { text: '300gsm Shiruku' },
          { text: '350gsm Grandeur' },
        ],
      },
    },
    {
      num: '02',
      title: "Matt lamination earns back its S$8 on day one.",
      body: [
        "Unlaminated 310gsm cards look good out of the box. Two weeks of shuffling in a wallet and the corners scuff, ink lifts on heavy-coverage colour, and fingerprints stop wiping off. **Matt lamination** adds a sealed micron-thin polymer layer that turns the card into a handle-resistant object — fingerprints wipe, corners stop fraying, dark inks don't marble.",
        "**Gloss lamination** gives the same protection with a mirror sheen — divisive. Sales-y brands like it, designers usually don't. **No lamination** is right for heavyweight specialty stocks (Grandeur, Pearlux) where the paper texture itself is the point and lamination would kill it.",
      ],
      side: {
        kind: 'stat',
        label: 'Order rate',
        num: '64',
        suffix: '%',
        caption: 'of SG corporate orders add matt lamination',
      },
    },
    {
      num: '03',
      title: 'Rounded corners signal a design decision.',
      body: [
        "Square corners are the default. **R3 rounding** (3mm radius) is barely perceptible but softens the card's whole feel — people register it without consciously noticing. **R5–R8** is a visible design choice — reads as friendly, creative, or consumer-facing.",
        "If you're a fintech, law firm, or property agency, stay square — the rectangle signals stability. If you're a designer, F&B brand, wellness studio, or DTC product, R5 quietly tells buyers you care about detail. Don't combine rounded corners with heavy foil or emboss — the eye processes it as inconsistent.",
      ],
      side: {
        kind: 'list',
        label: 'Corner by industry',
        rows: [
          { text: 'Law / finance / consulting', time: 'Square' },
          { text: 'Tech / sales / corporate', time: 'R3' },
          { text: 'Design / F&B / DTC', time: 'R5' },
          { text: 'Wellness / kids / creative', time: 'R8' },
        ],
      },
    },
    {
      num: '04',
      title: "The 9×5.4cm standard exists for a reason — don't break it.",
      body: [
        "Name cards are **9cm × 5.4cm** worldwide. That's not arbitrary — it fits every card holder, wallet slot, Rolodex (yes, they still exist), and business-card scanner app trained on exactly that aspect ratio. Custom sizes look creative in Illustrator and invisible in real life, because recipients can't store them.",
        "If you *really* want a square card or a mini-card, know you're trading recognition for memorability — some brands pull it off, most don't. **Double-sided printing** at the standard size usually gives more impact than a custom shape, and costs the same.",
      ],
      side: {
        kind: 'quote',
        text: "Went custom-sized for my first batch, regretted it by card 50. Nothing fits the holder. Reordered standard, never thought about it again.",
        attr: 'Founder, SG design studio',
      },
    },
  ],
};

const how_we_print = [
  { icon_url: null, emoji: '🎯', title: 'Real paper, not shop-floor sub', desc: 'Stock arrives in sealed bales from the mill — you get the GSM and finish you picked, not the nearest thing.' },
  { icon_url: null, emoji: '🔍', title: 'Hand-checked preflight', desc: 'Every card file reviewed by a real person before plates run. CMYK, bleed, font embeds — flagged before printing.' },
  { icon_url: null, emoji: '📐', title: 'Rounded corners, consistent radius', desc: 'Die-cut with matched tooling — R3 means R3 across 500 cards, not drifting to R4 by the back of the stack.' },
  { icon_url: null, emoji: '⚡', title: 'Same-day rush available', desc: 'Digital run before 4pm = pickup same evening at Paya Lebar Square. For the 6pm meeting you forgot about.' },
];

const [prod] = await sql`select id from products where slug = 'name-card'`;
await sql`
  insert into product_extras (product_id, matcher, seo_body, seo_magazine, how_we_print)
  values (${prod.id}, ${sql.json(matcher)}, ${seo_body}, ${sql.json(seo_magazine)}, ${sql.json(how_we_print)})
  on conflict (product_id) do update
    set matcher = excluded.matcher,
        seo_body = excluded.seo_body,
        seo_magazine = excluded.seo_magazine,
        how_we_print = excluded.how_we_print
`;
console.log('✓ name-card rewritten');
await sql.end();
