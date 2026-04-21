// Rewrites Letterhead page content to match the current live config:
// 80gsm or 100gsm Woodsfree paper, A4, single-sided (4C+0C), 300 to
// 10,000 sheets, 5 working days offset production.
//
// Drops old copy that referenced 120gsm Letterhead Bond, Watermark,
// 80gsm Office Paper (three-weight config), 2-sided printing, and
// prices ($28/100, $45/250) that don't match the current 300-sheet
// minimum or the supplied price list. H1 and H1em left untouched per
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

const PRODUCT_ID = '82cc01ba-a489-40cd-bf68-29b209a9d81a';

// ────────────────────────────────────────────────────────────────
// Product-level
// ────────────────────────────────────────────────────────────────

const productUpdate = {
  tagline: 'Official correspondence that arrives with authority',
  description: "Brand every letter, invoice, and contract with a printed letterhead on 80gsm or 100gsm Woodsfree paper. A4, full-colour one side, from 300 sheets. The stationery that makes every document look like it came from a company that takes itself seriously.",
};

// ────────────────────────────────────────────────────────────────
// Extras
// ────────────────────────────────────────────────────────────────

const seo_title = 'Letterhead Printing Singapore | 80gsm & 100gsm Woodsfree A4';
const seo_desc = "Custom letterhead printing in Singapore — A4 Woodsfree paper in 80gsm or 100gsm, full-colour single-sided print. From S$59.50 for 300 sheets, 5 working days offset production.";

// 2-line keyword-intense per SEO body feedback rule
const seo_body = `Letterhead printing Singapore — A4 corporate letterhead on 80gsm or 100gsm Woodsfree (uncoated) paper, full-colour single-sided print (4C + 0C). Custom logo, branding, company registration details. 300 to 10,000 sheets, from S$59.50 per 300 sheets, 5 working days offset. Law firms, clinics, consultancies, SG-registered companies — matching envelope prints available on request.`;

const intro = `A letterhead turns a plain document into correspondence from an actual company. Printed on Woodsfree paper — uncoated stock that takes ballpoint, fountain, and laser ink cleanly — with your logo, address, registration numbers, and brand colour on the sheet before you type a word. We offer 80gsm for everyday internal correspondence and 100gsm for formal letters that should feel like a letter the moment it lands on a desk. A4 size, single-sided full-colour print, from 300 sheets to 10,000 per run. 5 working days from approved proof.`;

const matcher = {
  rows: [
    {
      need: "*Quarterly letter run* — small firm, 100–200 letters a month",
      pick_title: "A4 · 100gsm Woodsfree · 500 sheets",
      pick_detail: "S$65.10 ($0.13/sheet) · 5 working days · lasts ~3 months at moderate use",
    },
    {
      need: "Active practice — *formal letters weekly*, partners sign in ink",
      pick_title: "A4 · 100gsm Woodsfree · 1,000 sheets",
      pick_detail: "S$85.90 ($0.086/sheet) · heavier weight · fountain-pen friendly",
    },
    {
      need: "HR prints *offer letters in bulk* every quarter",
      pick_title: "A4 · 80gsm Woodsfree · 2,000 sheets",
      pick_detail: "S$121.70 ($0.06/sheet) · lighter stock · lower per-sheet cost at volume",
    },
    {
      need: "Corporate — *year-long supply* in one print run",
      pick_title: "A4 · 100gsm Woodsfree · 5,000 sheets",
      pick_detail: "S$211.40 ($0.042/sheet) · best mid-volume break · covers most SMEs for 12 months",
    },
    {
      need: "High-volume operation — *hotels, clinics, service firms*",
      pick_title: "A4 · 80gsm Woodsfree · 10,000 sheets",
      pick_detail: "S$391.60 ($0.039/sheet) · cheapest per-sheet · single annual run",
    },
  ],
  title: "Tell us the job,\nwe'll tell you",
  kicker: "Quick guide",
  title_em: "the pick.",
  right_note_body: "Short-grain stock, printed so it feeds clean through any office MFP.",
  right_note_title: "Every sheet lies flat.",
};

const seo_magazine = {
  lede: "A letterhead is judged in the three seconds it takes someone to unfold it on their desk. Weight in the hand, how the ink sits, whether the sheet feeds clean through an office printer — three details decide whether the letter reads as correspondence or internal memo. Pick the right paper and the right run size and the rest is just typing.",
  title: "Everything worth knowing,",
  title_em: "before the sheet hits the MFP.",
  issue_label: "Issue №01 · Letterhead",
  articles: [
    {
      num: "01",
      title: "80gsm or 100gsm — the weight decides the register.",
      body: [
        "**80gsm Woodsfree** is office-document weight. Same paper you'd find in any printer tray. It's right for internal memos, bulk HR letters, and anything where the letterhead is functional — the branding is on the sheet but the recipient isn't meant to treat it as a keepsake. Cheaper per sheet, stacks denser, feeds cleanly through every MFP in the building.",
        "**100gsm Woodsfree** is noticeably heavier the moment a recipient picks it up. That 20gsm step-up is what separates *internal* from *correspondence* — the weight signals the letter is from a company that takes itself seriously. Pick it for formal letters, offer letters, partner sign-offs, and any correspondence meant to live on a desk for more than an afternoon.",
      ],
      side: {
        kind: "list",
        label: "Pick by use",
        rows: [
          { text: "80gsm", time: "Internal memos · HR bulk · MFP-friendly" },
          { text: "100gsm", time: "Formal letters · signed correspondence · client-facing" },
        ],
      },
    },
    {
      num: "02",
      title: "Why Woodsfree (uncoated) and not gloss or silk.",
      body: [
        "Letterheads get typed on. That means ink from a laser printer, an inkjet, or a human signing at the bottom. **Woodsfree** — uncoated paper — takes all three. Laser toner fuses cleanly, inkjet ink absorbs without bleeding into the margins, and fountain-pen ink sits flat without feathering.",
        "**Gloss and silk papers** — the stocks used for brochures and catalogues — have a surface coating that looks great for photos but fights every kind of ink. Pens skip, toner flakes, fountain ink beads up and smears. That's why every letterhead we print uses Woodsfree regardless of which weight you pick — the writing surface has to work as well as the print.",
      ],
      side: {
        kind: "pills",
        label: "Ink behaviour",
        items: [
          { text: "Laser toner · fuses clean", pop: true },
          { text: "Inkjet · absorbs, no bleed" },
          { text: "Ballpoint · survives" },
          { text: "Fountain pen · sits flat", pop: true },
        ],
      },
    },
    {
      num: "03",
      title: "Volume pricing — when 5,000 beats 500.",
      body: [
        "The per-sheet price drops sharply as the run size grows. **300 sheets** lands at S$0.20 per sheet (S$59.50 total). **1,000 sheets** drops to S$0.086 per sheet. **5,000 sheets** falls to S$0.042 per sheet — less than half the per-piece cost of the 300-sheet run. At **10,000 sheets** you're paying S$0.039 per sheet, essentially commodity rate.",
        "The right run size depends on usage: if the firm types 50 letters a month, 500 sheets covers ten months. If it's 200 letters a month (common for clinics, active legal practices, service firms), a 5,000-sheet run covers two years with a 20% buffer and locks in the best mid-volume price. Order more than you need this quarter only if storage space isn't a constraint — Woodsfree stacks shelf-clean without yellowing.",
      ],
      side: {
        kind: "list",
        label: "Per-sheet economics",
        rows: [
          { text: "300 sheets", time: "$0.20 / sheet" },
          { text: "1,000 sheets", time: "$0.086 / sheet" },
          { text: "2,000 sheets", time: "$0.06 / sheet" },
          { text: "5,000 sheets", time: "$0.042 / sheet" },
          { text: "10,000 sheets", time: "$0.039 / sheet" },
        ],
      },
    },
    {
      num: "04",
      title: "What belongs on a Singapore letterhead.",
      body: [
        "A business-correspondence letterhead typically carries: **company name and logo**, **registered address**, **phone and email**, **company registration number (UEN)**, and **GST registration number** if the entity is GST-registered. Partnerships list the partners' names; regulated professions (legal, medical) list the licence or registration body. None of this is mandated by Singapore law in every case, but omitting it makes the letter read as informal.",
        "Layout-wise: keep the top 40mm for branding (logo + company name), leave 20mm margins on both sides, and reserve the bottom 25mm for a footer with the address and registration details. That leaves roughly 180mm of vertical writing space on the page — enough for a one-page letter without crowding. Set up the file at A4 with 3mm bleed on all sides and send us the print-ready PDF.",
      ],
      side: {
        kind: "list",
        label: "What to include",
        rows: [
          { text: "Company name + logo", time: "Top of page" },
          { text: "Registered address", time: "Header or footer" },
          { text: "Phone, email, web", time: "Header or footer" },
          { text: "UEN number", time: "Footer" },
          { text: "GST number", time: "Footer · if applicable" },
        ],
      },
    },
  ],
};

// ────────────────────────────────────────────────────────────────
// FAQs
// ────────────────────────────────────────────────────────────────

const faqs = [
  {
    question: "What paper weight do you offer?",
    answer: "80gsm Woodsfree (office-document weight) and 100gsm Woodsfree (heavier, for formal correspondence). Both are uncoated — they take laser toner, inkjet, ballpoint, and fountain-pen ink cleanly without bleeding or skipping.",
  },
  {
    question: "What is Woodsfree paper?",
    answer: "Woodsfree (also called Simili in some catalogues) is uncoated paper made without residual wood lignin — the same family as premium writing paper. Stays white longer, holds ink cleanly, and doesn't yellow around the edges like cheap office stock.",
  },
  {
    question: "What size do you print?",
    answer: "A4 (210 × 297mm) — the standard size for Singapore business correspondence and office printer trays.",
  },
  {
    question: "Is the letterhead printed on one side or two?",
    answer: "Single-sided (4C + 0C) — full colour on the front, blank on the reverse. Contact us if you need a double-sided layout as a custom order.",
  },
  {
    question: "What should be included on a letterhead?",
    answer: "Typically: company name and logo, registered address, phone and email, company registration number (UEN), and GST registration number if applicable. Partnerships list partners' names; regulated professions list the relevant licensing body. Layout convention: branding at the top, address block in the footer.",
  },
  {
    question: "How much does letterhead printing cost in Singapore?",
    answer: "From S$59.50 for 300 sheets (A4, 80gsm or 100gsm Woodsfree, full-colour single-sided). Volume tiers: 1,000 sheets at S$85.90, 5,000 at S$211.40, 10,000 at S$391.60 — per-sheet cost drops from $0.20 at 300 sheets to $0.039 at 10,000. Same price on 80gsm and 100gsm.",
  },
  {
    question: "What's the minimum quantity?",
    answer: "300 sheets minimum. Bulk tiers run 300 / 500 / 1,000 / 2,000 / 3,000 / 4,000 / 5,000 / 6,000 / 7,000 / 8,000 / 9,000 / 10,000 in a single order.",
  },
  {
    question: "How long does letterhead printing take?",
    answer: "5 working days from approved digital proof. Offset production — the per-sheet economics are why the minimum is 300, not 100.",
  },
  {
    question: "What file format do I need?",
    answer: "Print-ready PDF at A4 dimensions (210 × 297mm) with 3mm bleed on all edges, embedded fonts, CMYK colour. Keep logos and text inside the 15mm safe margin from every edge. We proof-check the file before printing.",
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
  console.log('[1/3] products tagline + description updated.');

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
