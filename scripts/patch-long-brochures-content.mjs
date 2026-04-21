// Rewrites Long Brochures page content to match the current
// configurator: Type A (A4×3, 630×297mm) / Type B (A4×4, 840×297mm),
// 128/157/260gsm paper, five fold types (Half / Tri / Z / Gate / Roll),
// Matt or Gloss lamination × single or double sided, 300-10,000 qty,
// 7 working days offset.
//
// Drops old copy that referenced "A3 base / A4 base", "bi-fold"
// (renamed to Half Fold per upstream), and prices that no longer
// match the current pricing_table. H1 and H1em left untouched per
// skip-H1 rewrite rule.

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

const PRODUCT_ID = 'c24c1419-42eb-4c19-9d3f-5c95cf1caeaa';

// ────────────────────────────────────────────────────────────────
// Product-level
// ────────────────────────────────────────────────────────────────

const productUpdate = {
  tagline: 'The brochure that fits a pocket and makes a full argument',
  description: "Compact enough to carry, substantial enough to sell. A long brochure holds more content than a flyer without demanding the time of a booklet — folded so it fits a display rack, a handbag, a hotel desk.",
};

// ────────────────────────────────────────────────────────────────
// Extras — intro / SEO / matcher / magazine
// ────────────────────────────────────────────────────────────────

const seo_title = 'Long Brochure Printing Singapore | Half, Tri, Z, Gate & Roll Folds';
const seo_desc = "Long brochure printing in Singapore — Type A (A4×3) or Type B (A4×4) flat sheet, 128/157/260gsm paper, Half / Tri / Z / Gate / Roll folds, Matt or Gloss lamination. 300 to 10,000 copies, 7 working days.";

// 2-line keyword-intense per SEO body feedback rule
const seo_body = `Long brochure printing Singapore — Type A 630×297mm or Type B 840×297mm flat sheets, 128gsm / 157gsm art paper or 260gsm art card, five fold types (Half, Tri, Z, Gate, Roll), Matt or Gloss lamination single or double-sided, 300 to 10,000 copies. 7 working days offset production. Property launches, clinic menus, event programmes, hotel in-room guides, retail lookbooks, mailer inserts.`;

const intro = `A long brochure holds a real sales argument in a format that fits a pocket, a display rack, a hotel lobby. We print on Type A (A4×3 · 630×297mm flat) for standard tri-fold DL brochures or Type B (A4×4 · 840×297mm flat) when the story needs an extra panel to unfold. Paper runs 128gsm or 157gsm art paper for everyday brochures, 260gsm art card when the piece has to stand up on a shelf. Five fold types cover the full range: Half Fold for a clean two-panel spread, Tri or Z for the classic six-panel reveal, Gate or Roll for launches and lookbooks where the unfold itself is part of the pitch. Optional Matt or Gloss lamination, single or double-sided. Minimum 300 copies, bulk pricing scales to 10,000. 7 working days from approved proof.`;

const matcher = {
  rows: [
    {
      need: "*Property launch* in three weeks — handout for site visits",
      pick_title: "Type A · 157gsm · Tri Fold · 500 copies",
      pick_detail: "S$492 ($0.98/pc) · classic DL-panel reveal · 7 working days",
    },
    {
      need: "Clinic or café *service menu* for waiting-area racks",
      pick_title: "Type A · 128gsm · Half Fold · 1,000 copies",
      pick_detail: "S$496 ($0.50/pc) · clean 2-panel spread · fits standard rack slots",
    },
    {
      need: "*Event programme* with a long schedule to unfold",
      pick_title: "Type B · 157gsm · Z-Fold · Matt Lam single-sided · 2,000 copies",
      pick_detail: "S$1,154 ($0.58/pc) · 4-panel accordion · lays flat on a table",
    },
    {
      need: "*Premium brand lookbook* — a lift-to-reveal moment",
      pick_title: "Type B · 260gsm · Gate Fold · Gloss Lam double-sided · 500 copies",
      pick_detail: "S$867 ($1.73/pc) · heaviest stock · glossy finish inside and out",
    },
    {
      need: "*Volume DL mailer* insert — budget-first",
      pick_title: "Type A · 128gsm · Half Fold · 3,000 copies",
      pick_detail: "S$781 ($0.26/pc) · cheapest per-piece at volume · mailbox-ready DL format",
    },
  ],
  title: "Tell us the job,\nwe'll tell you",
  kicker: "Quick guide",
  title_em: "the pick.",
  right_note_body: "Score lines crease clean — no cracked ink, no fraying edge at the gutter.",
  right_note_title: "Every fold is scored first.",
};

const seo_magazine = {
  lede: "A long brochure lives or dies at the fold. Pick the wrong fold for the content, the wrong paper weight for the format, or the wrong lamination for the use case, and the whole piece reads as amateur even with great art direction. Four decisions do the heavy lifting — sheet type, paper, fold mechanics, and cover finish.",
  title: "Everything worth knowing,",
  title_em: "before the press runs.",
  issue_label: "Issue №01 · Long Brochures",
  articles: [
    {
      num: "01",
      title: "Type A or Type B — pick the sheet by how it unfolds.",
      body: [
        "**Type A (A4×3 · 630×297mm flat)** is the standard long-brochure sheet. Three A4-width panels wide, folded down to DL (99 × 210mm) in the typical tri-fold. Every display rack, hotel lobby, and property launch kit is sized around this footprint.",
        "**Type B (A4×4 · 840×297mm flat)** adds a fourth panel. Folded roll-style or gate-folded, it gives you a bigger reveal — right for event timelines, service comparison matrices, and premium brand lookbooks where the extra panel is where the real content lands. Roughly 10–15% more expensive than Type A at the same qty, since it's a bigger sheet through the press.",
      ],
      side: {
        kind: "list",
        label: "Sheet by content",
        rows: [
          { text: "Type A · 630×297mm", time: "3-panel DL tri-fold · the default" },
          { text: "Type B · 840×297mm", time: "4-panel roll or gate · premium reveals" },
        ],
      },
    },
    {
      num: "02",
      title: "Half, Tri, Z, Gate, Roll — the fold decides the reading order.",
      body: [
        "**Half Fold** gives two panels and a clean double-page spread. Best for clinic menus, product one-sheets, and anything where the content wants to breathe. **Tri Fold** gives six panels in a sequential reveal with a front flap that hides the inside — ideal for a property brochure or a service list where the reader works panel by panel.",
        "**Z-Fold** also gives six panels but in an accordion — each panel reveals the next, no front flap hiding content. It's the right fold for an event schedule, a timeline, or a map that unfolds flat on a table. **Gate Fold** opens like doors — two outer panels fold inward over a central spread, perfect for launches where the reveal *is* the pitch. **Roll Fold** rolls three panels inward onto a fourth — the unfolding sequence itself is part of the brand experience.",
      ],
      side: {
        kind: "list",
        label: "Fold by content",
        rows: [
          { text: "Half Fold", time: "Menu, one-sheet" },
          { text: "Tri Fold", time: "Property, service list" },
          { text: "Z-Fold", time: "Schedule, timeline, map" },
          { text: "Gate Fold", time: "Launch reveal, lookbook" },
          { text: "Roll Fold", time: "Brand story sequence" },
        ],
      },
    },
    {
      num: "03",
      title: "128gsm, 157gsm, 260gsm — the paper decides how it feels.",
      body: [
        "**128gsm art paper** is the standard mailer weight — light enough to stack a thousand in a display rack without the rack sagging, heavy enough to print full-bleed colour without show-through. Works for almost every brochure use case where cost matters and the piece will be read once and filed.",
        "**157gsm art paper** steps up the perceived quality — noticeably heavier in hand, which translates directly into *this brand takes itself seriously*. Our pick for property brochures, corporate capability statements, and anything meant to survive on a desk for a week. **260gsm art card** is cover-weight stock — used when the brochure has to stand unsupported in a display or open without flopping. Heaviest option, most premium feel, pairs naturally with Gloss or Matt lamination.",
      ],
      side: {
        kind: "pills",
        label: "Paper by use",
        items: [
          { text: "128gsm · mailer standard", pop: true },
          { text: "157gsm · property / corporate", pop: true },
          { text: "260gsm · display-ready" },
        ],
      },
    },
    {
      num: "04",
      title: "Matt or Gloss, single or double — lamination decides the handshake.",
      body: [
        "**Gloss Lam** pops colour, signals mass-market confidence — the magazine-rack feel. **Matt Lam** reads quieter and more considered — soft-touch, fingerprint-resistant, the finish for corporate reports and premium lookbooks. Pick Matt when you want the content to speak first; pick Gloss when you want the brochure itself to grab attention from across a rack.",
        "**Single-sided** laminates only the front face — costs less, common on brochures where the back is a single tear-off or simple colophon. **Double-sided** laminates both faces — the standard for brochures that get handled repeatedly (display racks, event giveaways, direct mail that competes with other pieces in the mailbox). Laminated covers also hold up better through folding, especially on 260gsm stock where the crease does more work.",
      ],
      side: {
        kind: "list",
        label: "Lamination pick",
        rows: [
          { text: "None", time: "One-read mailers · cheapest" },
          { text: "Matt · single", time: "Corporate, editorial" },
          { text: "Matt · double", time: "Premium, handled often" },
          { text: "Gloss · single", time: "Retail, rack-facing" },
          { text: "Gloss · double", time: "Lookbooks, launches" },
        ],
      },
    },
  ],
};

// ────────────────────────────────────────────────────────────────
// FAQs — match current configurator spec
// ────────────────────────────────────────────────────────────────

const faqs = [
  {
    question: "What's the difference between Type A and Type B?",
    answer: "Type A is an A4×3 flat sheet (630 × 297mm) — the standard long-brochure size, folds to DL (99 × 210mm) in tri-fold. Type B is an A4×4 flat sheet (840 × 297mm) — one extra panel, for roll-fold or gate-fold brochures where the reveal matters. Type B runs about 10-15% more at the same qty because of the larger sheet.",
  },
  {
    question: "What fold types do you offer?",
    answer: "Five: Half Fold (2 panels), Tri Fold (3 panels, letter-style), Z-Fold (3 panels, accordion), Gate Fold (outer panels fold inward), and Roll Fold (3 panels rolled inward, 4-panel finished). Tri and Z are the most common for DL; Gate and Roll are premium reveals.",
  },
  {
    question: "What paper options are available?",
    answer: "128gsm art paper (mailer standard), 157gsm art paper (property / corporate), and 260gsm art card (display-ready premium). All three available on either Type A or Type B.",
  },
  {
    question: "Can I add lamination?",
    answer: "Yes — Matt Lam or Gloss Lam, single-sided (front face only) or double-sided (both faces). Matt is soft-touch and fingerprint-resistant; Gloss pops colour and catches light. Pick single-sided for cheaper one-read pieces, double-sided for brochures that get handled repeatedly.",
  },
  {
    question: "How much does long brochure printing cost?",
    answer: "Starts from about S$492 for 500 copies of a Type A 157gsm tri-fold (no lam, $0.98/pc) — lower per-piece at larger runs. Type A 128gsm half fold × 3,000 copies lands at S$781 ($0.26/pc). Premium Type B 260gsm gate fold with Gloss Lam × 500 copies: S$867 ($1.73/pc). Use the configurator on the page for a live quote on your exact combo.",
  },
  {
    question: "What file format do I need?",
    answer: "Print-ready PDF with 3mm bleed on all edges, embedded fonts, CMYK colour. Set up as a flat (unfolded) sheet at Type A or Type B dimensions — mark fold lines as guides, not as printed elements. We check fold alignment and grain direction before printing.",
  },
  {
    question: "How long does production take?",
    answer: "7 working days from approved digital proof. Folding, scoring, and lamination are included in the production timeline — no extra days added for finishing.",
  },
  {
    question: "What's the minimum quantity?",
    answer: "300 copies minimum. Bulk tiers run 300 / 500 / 1,000 / 2,000 / 3,000 / 4,000 / 5,000 / 6,000 / 7,000 / 8,000 / 9,000 / 10,000 — per-piece pricing drops significantly at 1,000+ and again at 3,000+.",
  },
];

// ────────────────────────────────────────────────────────────────
// APPLY
// ────────────────────────────────────────────────────────────────

async function main() {
  const pRes = await fetch(`${URL}/rest/v1/products?id=eq.${PRODUCT_ID}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(productUpdate),
  });
  if (!pRes.ok) throw new Error(`PATCH products: ${pRes.status} ${await pRes.text()}`);
  console.log('[1/3] products tagline/description updated.');

  const exRes = await fetch(`${URL}/rest/v1/product_extras?product_id=eq.${PRODUCT_ID}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ seo_title, seo_desc, seo_body, intro, matcher, seo_magazine }),
  });
  if (!exRes.ok) throw new Error(`PATCH extras: ${exRes.status} ${await exRes.text()}`);
  console.log('[2/3] product_extras updated (H1 / H1em left intact).');

  const delFaqs = await fetch(`${URL}/rest/v1/product_faqs?product_id=eq.${PRODUCT_ID}`, {
    method: 'DELETE', headers: H,
  });
  if (!delFaqs.ok) throw new Error(`DELETE faqs: ${delFaqs.status} ${await delFaqs.text()}`);
  const insFaqs = await fetch(`${URL}/rest/v1/product_faqs`, {
    method: 'POST', headers: H,
    body: JSON.stringify(
      faqs.map((f, i) => ({
        product_id: PRODUCT_ID, question: f.question, answer: f.answer, display_order: i,
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
