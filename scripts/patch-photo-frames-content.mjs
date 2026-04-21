// Rewrites Photo Frames customer-facing copy to match the current live
// configurator: A6 / A5 / A4 / A3 inkjet print, Black/White/Wood/Gold
// frame colours (Wood limited to A6-A4; Gold only A5-A3 with size-based
// upcharge), table stand built into A6-A4, next-day production,
// personalised text free.
//
// Skips H1 and H1em per the project "rewrite the page" feedback rule.
// Drops the old magazine/matcher/FAQ copy that referenced imperial sizes
// (4×6 / 5×7 / 8×10), mat boards, UV acrylic, and multi-material frame
// options — none of which are in the current product spec.

import fs from 'node:fs';

const env = fs.readFileSync(
  '/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local',
  'utf8',
);
const kv = Object.fromEntries(
  env
    .trim()
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
    }),
);
const URL = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

const PRODUCT_ID = 'd5097eb0-4615-4976-8cc7-f957e2f2229c';

// ------------------------------------------------------------------
// EXTRAS — intro / seo_desc / seo_body / matcher / seo_magazine
// ------------------------------------------------------------------

const intro = `A photo in a camera roll is a photo nobody looks at. Printed, framed, and sitting on a desk, it becomes something you see every morning. We print A6 through A3 on inkjet — crisp detail, deep blacks, colour that holds up in daylight — pair it with a Black, White, Wood, or Gold frame, and ship A6/A5/A4 with a table stand built in so it's ready the moment the box opens. Personalised text overlay (name, date, short message) is free. Next-day production, single pieces up to runs of twenty.`;

const seo_desc = `Custom photo frame printing in Singapore. A6 to A3 sizes in Black, White, Wood, or Gold frames. Inkjet print, personalised text overlay, next-day production, table stand on A6-A4.`;

// 2-line keyword-intense per the SEO description feedback rule
const seo_body = `Photo frame printing Singapore — A6 / A5 / A4 / A3 inkjet prints in Black, White, Wood or Gold frames, table stand included on A6-A4, personalised text overlay, single piece to 20 pcs. From $12/pc, next-day production. Anniversary gifts, corporate desk portraits, milestone prints, wall-ready A3 statement pieces.`;

const matcher = {
  rows: [
    {
      need: "You just want it *printed, framed, done* — gift by the weekend",
      pick_title: "A6 · Black frame · table stand included",
      pick_detail: "From S$12/pc · next-day production · stands on a desk the moment you open it",
    },
    {
      need: "A proper desk portrait — sits next to a laptop without crowding it",
      pick_title: "A5 · White or Wood frame",
      pick_detail: "From S$14/pc · 14.8 × 21 cm · table stand built in · personalised text free",
    },
    {
      need: "Anniversary gift — needs to feel *deliberate*",
      pick_title: "A5 · Gold frame · personalised date",
      pick_detail: "From S$17/pc · gold adds $3 over basic · name + year overlaid on the print",
    },
    {
      need: "Retirement run — *20 matching frames* for the office",
      pick_title: "A5 · Black frame · personalised plaque",
      pick_detail: "S$280 for 20pcs · uniform look · individual name on each print",
    },
    {
      need: "Wall statement — *the photo IS the decor*",
      pick_title: "A3 · Gold frame",
      pick_detail: "S$28/pc · 29.7 × 42 cm · biggest size, gold profile pulls focus across the room",
    },
  ],
  title: "Tell us the job,\nwe'll tell you",
  kicker: "Quick guide",
  title_em: "the pick.",
  right_note_body: "One shop, one brief, one delivery — no chasing a framer on the side.",
  right_note_title: "Print, frame, personalise — all here.",
};

const seo_magazine = {
  lede: "A framed photo is a small pile of decisions — which size, which frame colour, what goes on the text line, whether it lands on a desk or a wall. Ten minutes of choices turns a camera roll shot into something you see every morning.",
  title: "Everything worth knowing,",
  title_em: "before you hit order.",
  issue_label: "Issue №01 · Photo Frames",
  articles: [
    {
      num: "01",
      title: "Size decides where the frame lives.",
      body: [
        "**A6** (10.5 × 14.8 cm) is the gift size — postcard footprint, light, cheap enough to order a dozen for the office. **A5** (14.8 × 21 cm) is the desk standard — sits next to a monitor without crowding the keyboard, shows one portrait clearly. **A4** (21 × 29.7 cm) stops being a desk piece and starts being a shelf or low-wall piece. **A3** (29.7 × 42 cm) is a proper wall size — a focal point, the kind of frame someone notices from across the room.",
        "A6, A5, and A4 ship with a fold-out table stand built into the back, so there's no separate step to *how do I stand this up*. A3 is frame-only — at that size, it's going on a wall, not a desk, and a kickstand wouldn't hold it steady anyway.",
      ],
      side: {
        kind: "list",
        label: "Size by use",
        rows: [
          { text: "A6", time: "Small gift · 10.5 × 14.8 cm" },
          { text: "A5", time: "Desk portrait · 14.8 × 21 cm" },
          { text: "A4", time: "Shelf or low-wall · 21 × 29.7 cm" },
          { text: "A3", time: "Wall focal · 29.7 × 42 cm" },
        ],
      },
    },
    {
      num: "02",
      title: "Black, White, Wood, Gold — pick the one that disappears.",
      body: [
        "The job of a frame colour is usually to **not** compete with the photo. **Black** disappears on a pale wall and pulls focus straight to the image — it's the safest neutral and the default most customers pick. **White** does the opposite: disappears on a dark or colourful wall, gives the print breathing room in a minimalist space. **Wood** warms everything up, reads *home* instead of *gallery*, and pairs well with kids' portraits, outdoor scenes, or photos you want to feel lived-in.",
        "**Gold** is the exception to *don't compete*. It's loud on purpose — for anniversary photos, milestone certificates, the kind of shot where the frame is meant to say *this matters*. We only offer gold on A5 and up; at A6 the profile is too thin to carry the effect. The upgrade is $3 on A5, $5 on A4, $8 on A3.",
      ],
      side: {
        kind: "list",
        label: "Colour availability",
        rows: [
          { text: "Black", time: "Every size" },
          { text: "White", time: "Every size" },
          { text: "Wood", time: "A6 · A5 · A4" },
          { text: "Gold", time: "A5 (+$3) · A4 (+$5) · A3 (+$8)" },
        ],
      },
    },
    {
      num: "03",
      title: "Why inkjet matters for photos you'll keep looking at.",
      body: [
        "Inkjet lays ink into the paper fibres rather than fusing it to the surface — that's why you get better detail in the darker parts of a photo, cleaner skin tones, and colour that doesn't shift the first summer the frame sits on a sunny windowsill. For anything you actually want to look at every day for years, it's the printing method worth paying for.",
        "You don't need a retouched studio file — a clean smartphone photo at full resolution prints fine at A5 and still looks sharp at A3 for most recent phones. If the source is too small or too soft to print sharp at the size you picked, we'll flag it before running the job instead of just printing a muddy version.",
      ],
      side: {
        kind: "list",
        label: "What you can send us",
        rows: [
          { text: "Clean phone photo", time: "Sharp at A3 (recent phones)" },
          { text: "Older phone / low-res", time: "Safe up to A5" },
          { text: "Screenshot / web image", time: "A6 only, if at all" },
          { text: "Retouched JPG / PNG", time: "All sizes" },
        ],
      },
    },
    {
      num: "04",
      title: "Text overlay and a table stand built in.",
      body: [
        "Personalisation is a name, a date, or a one-liner — *To Lynn, 2026* · *Happy 70th, Dad* · *The day we moved in*. We overlay the text on the print itself (not on a separate plaque) so it reads as part of the image, not a sticker tacked on. You type it into the configurator, we typeset it in a neutral weight and position, you approve before we print. No extra charge.",
        "A6, A5, and A4 all ship with a fold-out kickstand on the back, which means the frame stands itself up the moment you open the box — no trip to a hardware store, no assembly. A3 is frame-only because at that size the stand bracket is too flimsy to carry the weight; A3 orders assume you'll hang it on a wall.",
      ],
      side: {
        kind: "pills",
        label: "Example text lines",
        items: [
          { text: "\"Happy 70th, Dad\"", pop: true },
          { text: "\"To Lynn, 2026\"" },
          { text: "\"Five years in\"" },
          { text: "\"The day we moved in\"" },
        ],
      },
    },
  ],
};

// ------------------------------------------------------------------
// FAQs — full rewrite to match current pricing/colour/size spec
// ------------------------------------------------------------------

const faqs = [
  {
    question: "What frame colours are available?",
    answer: "Black, White, Wood, and Gold. Black and White fit every size. Wood is offered on A6, A5, and A4. Gold is only on A5, A4, and A3 — it's a $3 to $8 upgrade over Black/White/Wood depending on size.",
  },
  {
    question: "What sizes do you print?",
    answer: "A6 (10.5 × 14.8 cm), A5 (14.8 × 21 cm), A4 (21 × 29.7 cm), and A3 (29.7 × 42 cm). A6, A5, and A4 include a built-in fold-out table stand. A3 is frame-only — most A3 orders go on a wall.",
  },
  {
    question: "How much does a personalised photo frame cost in Singapore?",
    answer: "A6 from S$12. A5 from S$14 (or $17 with Gold). A4 from S$16 (or $21 with Gold). A3 from S$20 (or $28 with Gold). Personalised text overlay is free on every size.",
  },
  {
    question: "Can I add custom text to the photo?",
    answer: "Yes — names, dates, and short messages can be overlaid on the print as part of the design. No extra charge. You type it into the configurator; we typeset and position it; you approve the layout before we print.",
  },
  {
    question: "Can I display the frame on a desk or hang it on a wall?",
    answer: "A6, A5, and A4 come with a table stand built into the back, so they're ready to stand on a desk or shelf the moment you open the box. A3 is frame-only — at that size, most customers hang it on a wall.",
  },
  {
    question: "How long does production take?",
    answer: "Next working day for standard orders. Larger runs (10-20 pieces) may take a day longer — the configurator shows the exact ready-by date based on your size and quantity.",
  },
  {
    question: "What image resolution do I need?",
    answer: "A clean smartphone photo at full resolution prints fine at A5 and stays sharp at A3 for most recent phones. If the file is too small or too soft to print sharp at the size you picked, we'll flag it before running the job — so you won't get a muddy print without warning.",
  },
  {
    question: "Can I order in bulk for corporate gifting?",
    answer: "Yes. The configurator handles 1 to 20 pieces out of the box. Pricing is per piece (same rate at any quantity), so 20 × A5 Black = S$280. For larger runs or a matching personalised set across 50+ pieces, drop us a note and we'll quote you directly.",
  },
];

// ------------------------------------------------------------------
// Apply
// ------------------------------------------------------------------

async function main() {
  // 1. Update product_extras (preserve h1 / h1em / hero_big / seo_title /
  //    how_we_print / chooser / image_url — skip-H1 rule).
  const ex = await fetch(
    `${URL}/rest/v1/product_extras?product_id=eq.${PRODUCT_ID}`,
    {
      method: 'PATCH',
      headers: H,
      body: JSON.stringify({
        intro,
        seo_desc,
        seo_body,
        matcher,
        seo_magazine,
      }),
    },
  );
  if (!ex.ok) throw new Error(`PATCH extras: ${ex.status} ${await ex.text()}`);
  console.log('[1/2] Updated intro / seo_desc / seo_body / matcher / seo_magazine.');

  // 2. Replace FAQ rows (delete + insert, order preserved by display_order).
  const delFaqs = await fetch(
    `${URL}/rest/v1/product_faqs?product_id=eq.${PRODUCT_ID}`,
    { method: 'DELETE', headers: H },
  );
  if (!delFaqs.ok) throw new Error(`DELETE faqs: ${delFaqs.status} ${await delFaqs.text()}`);

  const insFaqs = await fetch(`${URL}/rest/v1/product_faqs`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify(
      faqs.map((f, i) => ({
        product_id: PRODUCT_ID,
        question: f.question,
        answer: f.answer,
        display_order: i,
      })),
    ),
  });
  if (!insFaqs.ok) throw new Error(`INSERT faqs: ${insFaqs.status} ${await insFaqs.text()}`);
  const inserted = await insFaqs.json();
  console.log(`[2/2] Rewrote ${inserted.length} FAQs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
