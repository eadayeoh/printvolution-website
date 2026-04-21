// Rewrites Books page content to match the current live configurator:
// Digital (3–300 saddle / 3–50 perfect, 100–350gsm paper, next working
// day) or Offset (50–5000 books, 128/157gsm content, self/260/310
// covers, Gloss/Matt Lam + optional Spot UV on perfect, 7 working
// days). Saddle 8–68pp, Perfect 32–200pp. A5 or A4 only.
//
// Drops the old references to Wire-O binding, Hardcover, 80gsm text,
// 157gsm silk, and the invented prices that don't match current combos.
// Also renames "Booklets" → "Books" in hero and H1 per user request
// (overrides the default skip-H1 rewrite rule — user gave an explicit
// name-change instruction).

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

const PRODUCT_ID = '3a5ed230-31e8-40df-845f-a250677914ca';

// ────────────────────────────────────────────────────────────────
// PRODUCT-LEVEL — name + tagline + description
// ────────────────────────────────────────────────────────────────

const productUpdate = {
  name: 'Books',
  tagline: 'Printed books that get kept, not recycled',
  description: "A professionally printed book carries your content with a weight no PDF will ever have. For catalogues, annual reports, lookbooks, and anything that needs to survive past the first email.",
};

// ────────────────────────────────────────────────────────────────
// EXTRAS — hero + H1 (renamed) + intro + SEO + matcher + magazine
// ────────────────────────────────────────────────────────────────

const hero_big = 'BOOKS';
const h1 = 'Book Printing Singapore';
const h1em = 'Your Story. Professionally Bound.';

const intro = `A PDF gets forwarded once and ignored. A printed book gets placed on a desk and flipped through. For product catalogues, company profiles, annual reports, lookbooks, event programmes, zines — physical print gives content a weight a screen can't match. We print saddle-stitch (stapled spine, 8–68 pages) and perfect bound (glued flat spine, 32–200 pages), in A5 or A4. Pick Digital for short runs from 3 books (next working day) or Offset for bulk runs from 50 books (7 working days). Covers up to 310gsm art card, Gloss or Matt lamination, and Matt Lam + Spot UV on perfect-bound offset runs.`;

const seo_title = 'Book Printing Singapore | Saddle Stitch & Perfect Bound';
const seo_desc = 'Custom book printing in Singapore — saddle stitch 8–68pp, perfect bound 32–200pp, A5 or A4. Digital short runs next-day, offset bulk runs 50–5000 books, 7 days. Covers up to 310gsm with Gloss/Matt lam or Spot UV.';

// 2-line keyword-intense per the SEO description feedback rule
const seo_body = `Book printing Singapore — saddle-stitch 8–68 pages and perfect-bound 32–200 pages, A5 or A4, colour inner pages 100/150/200/250/300/350gsm, 128/157gsm art paper offset, 260/310gsm lam covers, Matt Lam + Spot UV on perfect bound. Digital short runs from 3 books (next working day), offset bulk runs 50–5000 books (7 working days). Catalogues, annual reports, lookbooks, zines, event programmes, company profiles.`;

const matcher = {
  rows: [
    {
      need: "Annual report — 48 pages, *board meeting in two weeks*",
      pick_title: "Offset · A4 · Perfect Bound · 48pp · 260gsm Matt Lam",
      pick_detail: "From S$1,789 for 50 books (S$35.78/book) · flat-spine, shelf-ready · 7 working days",
    },
    {
      need: "Product catalogue — *clients flip through on a cafe table*",
      pick_title: "Offset · A5 · Saddle · 32pp · 128gsm · 260gsm Gloss Lam",
      pick_detail: "From S$1,313 for 300 books (S$4.38/book) · lies flat when opened · premium cover feel",
    },
    {
      need: "Pitch deck as a real object — *only 10 copies needed*",
      pick_title: "Digital · A4 · Perfect Bound · 32pp · 150gsm",
      pick_detail: "From S$1,390 for 10 books (S$139/book) · next working day · 3-50 book run",
    },
    {
      need: "Event programme or zine — *short, stapled, straight to the point*",
      pick_title: "Offset · A5 · Saddle · 16pp · 128gsm · Self-cover",
      pick_detail: "From S$644 for 100 books (S$6.44/book) · cheapest route to a bound book",
    },
    {
      need: "Quarterly magazine — *5,000 copies, premium finish*",
      pick_title: "Offset · A4 · Saddle · 48pp · 157gsm · 310gsm Gloss Lam",
      pick_detail: "From S$9,987 for 5000 books (S$2/book) · heaviest cover · per-piece economy kicks in hard at volume",
    },
  ],
  title: "Tell us the job,\nwe'll tell you",
  kicker: "Quick guide",
  title_em: "the pick.",
  right_note_body: "Saddle-stitched or perfect-bound, A5 or A4 — printed, bound, delivered.",
  right_note_title: "Four decisions stand between a PDF and a printed book.",
};

const seo_magazine = {
  lede: "A printed book is judged in the first three seconds — the weight in the hand, the crack of the spine, the way a page feels between fingers. Four production choices decide those three seconds: print method, binding style, paper weight, and cover finish. Pick each one on purpose and the book lands with the weight the content deserves.",
  title: "Everything worth knowing,",
  title_em: "before you hit order.",
  issue_label: "Issue №01 · Books",
  articles: [
    {
      num: "01",
      title: "Digital or offset — the run size decides.",
      body: [
        "**Digital** prints one-off sheets straight from file to paper. No plate setup, no minimum economics — economical from 3 books, capped at 300 for saddle stitch and 50 for perfect binding (the per-book binding cost climbs sharply past those). Turnaround: next working day.",
        "**Offset** mounts plates, inks them, and runs paper through at high speed. The setup is fixed, so the first book costs the most — but by book 500 the unit cost has collapsed, and by book 5,000 it's less than a coffee. Minimum 50 books for perfect, 100 for saddle. Turnaround: 7 working days. The break-even usually sits around 100–200 books; below that digital wins, above it offset wins by a comfortable margin.",
      ],
      side: {
        kind: "list",
        label: "Method by run size",
        rows: [
          { text: "Digital", time: "3–300 saddle · 3–50 perfect · next-day" },
          { text: "Offset", time: "100–5,000 saddle · 50–5,000 perfect · 7 days" },
        ],
      },
    },
    {
      num: "02",
      title: "Saddle stitch or perfect bound — the page count decides.",
      body: [
        "**Saddle stitch** — two staples through the spine — is the right call up to about 48 pages. Past that, the spine bulks, pages splay unevenly, and it starts to read as *stapled zine* rather than *book*. We offer 8 to 68 pages in multiples of 4 (saddle-stitched signatures have to fold as sheets), and the cover is either same-paper self-cover or a heavier 260/310gsm laminated wrap.",
        "**Perfect bound** glues a wrapped cover onto a trimmed text block — flat spine you can print on, shelves without creasing, clients receive without wondering if it's finished. Starts economically at 32 pages and handles up to 200. Cover is a 260gsm art card, lam finish on every copy — Gloss or Matt, or Matt + Spot UV if you want gloss highlights on specific artwork areas.",
      ],
      side: {
        kind: "list",
        label: "Binding by page count",
        rows: [
          { text: "8–48 pages", time: "Saddle Stitch · stapled spine" },
          { text: "32–48 pages", time: "Either works · saddle cheaper" },
          { text: "48–200 pages", time: "Perfect Bound · flat spine" },
          { text: "60–68 pages", time: "Saddle with 260/310 cover only" },
        ],
      },
    },
    {
      num: "03",
      title: "Paper gsm — the weight that decides how the book feels.",
      body: [
        "**Show-through** is when dark text on page 5 ghosts onto page 4. It's the mark of underweight paper, and it makes a book look cheap even when the content is world-class. For digital inner pages we offer 100 / 150 / 200 / 250 / 300 / 350gsm in colour; pick by weight-in-hand and image density.",
        "**100gsm** is standard text stock — right for text-heavy books, novels, reports. **150gsm** adds weight without bulk, our most common pick for catalogues with photography. **200–350gsm** is cover territory on digital, or premium inner-page weight for short-run lookbooks where every page should feel deliberate. On offset the content paper is 128gsm or 157gsm art paper — the tighter upstream selection because offset workflows fix the text stock per run.",
      ],
      side: {
        kind: "pills",
        label: "Pick by content",
        items: [
          { text: "100gsm · text-heavy", pop: true },
          { text: "150gsm · mixed", pop: true },
          { text: "200gsm · image-heavy" },
          { text: "250–350gsm · premium short-run" },
        ],
      },
    },
    {
      num: "04",
      title: "Cover and finish — where the book gets judged.",
      body: [
        "The cover is what decides whether the book gets opened. Self-cover (same paper as inner) is the lightest and cheapest option — right for zines, programmes, internal reports where the content matters more than the object. **260gsm art card** is the standard premium upgrade: thick enough to stand up on a shelf, smooth enough to take laminate without texture fighting the print. **310gsm** goes heavier still, the tactile weight you want for photography books, brand lookbooks, and anything meant to survive the first email.",
        "**Gloss Lam** pops colour and signals mass-market confidence — magazine territory. **Matt Lam** reads quieter, more considered — reports, editorial, anything where you want the content to speak first. **Matt Lam + Spot UV** (perfect-bound offset only) adds gloss accents on specific artwork areas — logos, titles, illustration — against a matt base. It's the most expensive finish and the one that makes a cover impossible to ignore.",
      ],
      side: {
        kind: "list",
        label: "Cover by effect",
        rows: [
          { text: "Self-cover", time: "Lightweight · same as inner" },
          { text: "260gsm Lam", time: "Premium standard · Gloss or Matt" },
          { text: "310gsm Lam", time: "Heaviest · saddle only" },
          { text: "260gsm + Spot UV", time: "Perfect-bound offset · statement finish" },
        ],
      },
    },
  ],
};

// ────────────────────────────────────────────────────────────────
// FAQs — rewritten to match the current configurator spec
// ────────────────────────────────────────────────────────────────

const faqs = [
  {
    question: "What binding styles do you offer?",
    answer: "Saddle stitch (stapled spine) for 8–68 pages, and perfect bound (glued flat spine) for 32–200 pages. Page counts are in multiples of 4 for saddle stitch because the sheets fold in signatures.",
  },
  {
    question: "What's the difference between digital and offset?",
    answer: "Digital is for short runs — 3 to 300 books saddle, 3 to 50 books perfect bound — with next-working-day turnaround. Offset is for bulk runs from 50 books, delivered in 7 working days. Below ~100 books digital is cheaper; above that offset usually wins on per-piece price.",
  },
  {
    question: "What sizes do you print?",
    answer: "A5 closed (148 × 210mm, opens to A4) and A4 closed (210 × 297mm, opens to A3). Both available on every binding and print method.",
  },
  {
    question: "What paper weights can I choose for inner pages?",
    answer: "Digital: 100, 150, 200, 250, 300, or 350gsm in full colour. Offset saddle stitch: 128gsm or 157gsm art paper. Offset perfect binding uses a standard book text stock included in the binding price.",
  },
  {
    question: "What cover options are available?",
    answer: "Saddle stitch: self-cover (same paper as inner), 260gsm art card, or 310gsm art card (offset only for 260/310). Perfect binding: 260gsm art card standard, with Matt Lam + Spot UV as an optional finish on offset runs.",
  },
  {
    question: "How much does book printing cost in Singapore?",
    answer: "Starts from about S$35.78 per book for a 50-copy offset perfect-bound A4 (48 pages, 260gsm Matt Lam cover), dropping to around S$2 per book at 5,000-copy offset saddle-stitch runs. Short-run digital starts at S$58 per book for 10 copies of an A5 16-page saddle stitch. Pick your exact combo on the configurator for a live quote.",
  },
  {
    question: "What file format do you need?",
    answer: "Print-ready PDF with 3mm bleed on all edges, embedded fonts, and CMYK colour. Set up pages as single pages (not reader spreads). Cover should be a separate file with front + back + spine for perfect bound.",
  },
  {
    question: "How long does production take?",
    answer: "Digital — next working day from approved digital proof. Offset — 7 working days. Proof approval is part of the timeline either way; we don't start printing until you sign off.",
  },
];

// ────────────────────────────────────────────────────────────────
// APPLY
// ────────────────────────────────────────────────────────────────

async function main() {
  // 1. Product row (name, tagline, description)
  const pRes = await fetch(`${URL}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(productUpdate),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/3] products name/tagline/description updated.');

  // 2. product_extras (hero_big, h1, h1em, intro, seo fields, matcher, magazine)
  const exRes = await fetch(`${URL}/rest/v1/product_extras?product_id=eq.${PRODUCT_ID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ hero_big, h1, h1em, seo_title, seo_desc, seo_body, intro, matcher, seo_magazine }),
  });
  if (!exRes.ok) throw new Error(`PATCH extras: ${exRes.status} ${await exRes.text()}`);
  console.log('[2/3] product_extras updated (hero → "BOOKS", H1 renamed, content rewritten).');

  // 3. FAQs — wipe + insert
  const delFaqs = await fetch(`${URL}/rest/v1/product_faqs?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delFaqs.ok) throw new Error(`DELETE faqs: ${delFaqs.status} ${await delFaqs.text()}`);
  const insFaqs = await fetch(`${URL}/rest/v1/product_faqs`, {
    method: 'POST', headers: H,
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
  console.log(`[3/3] Rewrote ${inserted.length} FAQs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
