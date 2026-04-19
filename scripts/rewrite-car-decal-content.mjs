// Rewrites car-decal page content to match the actual pricing_table:
//   Sizes: 90×54mm · 115×120mm · 130×170mm · 90×420mm
//   View types: Face In / Face Out (4C + White Base) — Both Side (4C + White Base + 4C)
//   Qty: 200 → 5000 tiered
//   Print: Offset · Lead time: 7 working days
//
// Replaces: seo_title, seo_desc, seo_body, h1, h1em, intro, matcher,
// seo_magazine, tagline, description, faqs.

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

const tagline = 'Offset-printed car decals for Singapore fleets, dealers and promo runs. Four fixed sizes, single- or double-sided, opaque white base for tinted glass. Priced in tiers from 200 pieces, seven-working-day turnaround.';

const description = 'Bulk offset-printed car decals in four sizes (90×54mm, 115×120mm, 130×170mm, 90×420mm), with single- or double-sided visibility. Priced per qty tier from 200 pieces. Seven working days production.';

const h1 = 'Car decals,';
const h1em = 'by the box.';

const intro = 'Fleet-scale window and body decals in four fixed sizes, printed offset with an opaque white base so the colours stay true on tinted glass. Runs start at 200 pieces, land in seven working days.';

const seo_title = 'Car Decal Printing Singapore | Offset Bulk Window Stickers';
const seo_desc = 'Offset-printed car decals in four sizes, single- or double-sided. Bulk runs from 200 pieces. Live tier pricing, 7-working-day lead time. Quote instantly.';

const seo_body = `Offset-printed car decals in four fixed sizes, single- or double-sided, with an opaque white base so colours read bright on tinted glass. Priced by qty tier from 200 pieces up; lead time seven working days after file approval.`;

const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the job,\nwe'll point you at",
  title_em: 'the right spec.',
  right_note_title: 'Every decal is outdoor-graded.',
  right_note_body: 'Offset-printed on weatherproof adhesive film with an opaque white base. Reads bright on tinted or dark glass, survives SG sun and carpark cycles.',
  rows: [
    {
      need: 'Vehicle-ID tab or a small *contact-info* sticker on the side panel',
      pick_title: '90 × 54mm · Face In / Face Out · 200 pcs',
      pick_detail: 'From S$49.50 for the whole run (≈ S$0.25/pc at 1000 pcs). The name-card footprint fits a quiet corner without crowding the panel.',
      apply: { size: '90x54', view: 'face', qty: 200 },
    },
    {
      need: 'Square *door or bumper* sticker — shop logo, campaign badge',
      pick_title: '115 × 120mm · Face In / Face Out · 500 pcs',
      pick_detail: 'From S$364.30 for 500 pcs (≈ S$0.73 each). Good visibility without needing a wrap-grade install.',
      apply: { size: '115x120', view: 'face', qty: 500 },
    },
    {
      need: 'Standard *door-panel logo* for a delivery or service vehicle fleet',
      pick_title: '130 × 170mm · Face In / Face Out · 1000 pcs',
      pick_detail: 'From S$822.30 for 1000 pcs (≈ S$0.82 each). Scales to full-fleet rollouts at five-thousand-piece tier.',
      apply: { size: '130x170', view: 'face', qty: 1000 },
    },
    {
      need: 'Long *windscreen sunstrip* or side-body stripe',
      pick_title: '90 × 420mm · Face In / Face Out · 200 pcs',
      pick_detail: 'From S$318.80 for 200 pcs. The 420mm length gives room for a URL plus a phone number across the top of the glass.',
      apply: { size: '90x420', view: 'face', qty: 200 },
    },
    {
      need: "Decal sits on a *rear windscreen* and must read from both sides (ride-hail, courier ID)",
      pick_title: '130 × 170mm · Both Side View (4C + White Base + 4C)',
      pick_detail: 'Reverse print on the inside face, forward print on the outside. Drivers see it right-way-round from the cabin, the road sees it from behind. Roughly 1.5–2× the Face-only tier price.',
      apply: { size: '130x170', view: 'both', qty: 500 },
    },
  ],
};

const seo_magazine = {
  articles: [
    {
      num: '01',
      title: 'Why offset for a car-decal run.',
      body: [
        `Digital prints are perfect for *under two hundred pieces* — no setup cost, fast turnaround, great for one-off designs. The second you cross into fleet quantities, offset flips the maths. The press plate is a one-time setup, but once it's running every additional sticker is pennies. That's why the 5000-piece tier lands at roughly one-fifth the per-piece cost of the 200 tier — the plate cost amortises across the whole run.`,
        `The other reason offset wins for vehicle use is **colour consistency**. A fleet of two hundred vans with the same logo sticker needs every decal in the same exact colour. Digital can drift across a long run; offset does not — the ink mix is set once and laid down identically on every sheet.`,
      ],
      side: 'ink',
    },
    {
      num: '02',
      title: 'The white base is the whole trick.',
      body: [
        `Car windows are **tinted**. Body panels are usually a dark colour. Regular CMYK ink is semi-transparent — lay it straight on dark glass and your logo dulls into the tint. That's why every size on the spec sheet says "4C + White Base": we print a solid white rectangle *underneath* the colour, so the colours read as bright on a tinted rear screen as they would on white paper.`,
        `If you pick **Both Side View (4C + White Base + 4C)**, we sandwich the white layer between two colour passes — the driver sees the design right-way-round from the cabin, the road sees it from the back. It's a menu option here, priced on the same tier sheet as the one-sided version; no custom quote dance.`,
      ],
      side: 'offset',
    },
    {
      num: '03',
      title: 'Picking a size that actually fits.',
      body: [
        `The four sizes on this page are the ones our press is plated for — going off-menu means a custom plate quote. **90 × 54mm** is a name-card — it fits a vehicle-ID tab or a QR-only sticker. **115 × 120mm** is a square that suits badges, door-stickers, bumper campaigns. **130 × 170mm** is the standard door-panel rectangle; this is what most fleet jobs pick. **90 × 420mm** is the long strip — if you've ever seen a taxi windscreen header with URL + phone, that's this size.`,
        `For Both-Side applications the size choice matters more: the design has to read backwards from the *inside* face. Keep the text large and left-aligned on the original artwork — we'll flip the inside pass for you, but tiny reversed type gets illegible against road glare.`,
      ],
      side: 'sizes',
    },
    {
      num: '04',
      title: 'Seven working days, and what that covers.',
      body: [
        `Seven working days is file-approved to ready-for-collection. Inside that: day 1 — file check and preflight; day 2 — plate setup; days 3–5 — print run; days 6–7 — cut, inspect, pack. Fleet runs of three thousand or more sometimes extend to nine days because the cutting stage is slow, but we'll flag that up front when you quote.`,
        `Files we prefer: **print-ready PDF, CMYK, 300dpi, 3mm bleed, fonts outlined**. If you're sending a JPG or a PowerPoint export, we'll bounce it before plate setup — the offset plates are too expensive to run on weak artwork. Free preflight is part of the lead time, so if your file needs a fix you hear from us within twelve hours, not the last Friday afternoon.`,
      ],
      side: 'timeline',
    },
  ],
};

// "How we print" — 4 cards under the fold. Replaces the old gloss/vinyl/
// calendared-film narrative with offset + white-base + bulk-run truth.
const how_we_print = [
  {
    icon_url: null,
    emoji: '🖨️',
    title: 'Offset with white base',
    desc: 'CMYK over an opaque white layer so the colours read bright on tinted or dark glass — not the washed-out look you get from a digital print straight onto clear film.',
  },
  {
    icon_url: null,
    emoji: '🪟',
    title: 'Both-side-view on menu',
    desc: '4C · white · 4C sandwich for rear-window decals that need to read correctly from the road AND from the driver\'s seat.',
  },
  {
    icon_url: null,
    emoji: '📦',
    title: 'Bulk-run economics',
    desc: 'Offset plates are a one-time setup. Price per piece drops sharply from the 200 tier to the 5000 tier — the bigger the fleet, the lower the unit cost.',
  },
  {
    icon_url: null,
    emoji: '🔍',
    title: 'File check inside 12 hours',
    desc: 'Every PDF is reviewed by a human before plate setup. CMYK conversion, 3mm bleed, 300dpi and font embedding are checked; you hear back the same business day.',
  },
];

const faqs = [
  {
    question: 'What is the minimum order for car decals?',
    answer: '200 pieces per design. Below that our offset plate setup stops making sense — for one-off prototype stickers we can run a short digital job on a different product line, ask in the WhatsApp chat.',
  },
  {
    question: 'What is the difference between "Face In / Face Out" and "Both Side View"?',
    answer: 'Face In / Face Out is a single-sided decal — the design is printed once, you stick it on the inside or outside of the glass. Both Side View is a two-sided print with a white layer in between: the decal is legible in the correct orientation from BOTH sides of a rear windscreen — road sees it going forward, driver sees it going forward from inside.',
  },
  {
    question: 'What does "4C + White Base" mean?',
    answer: '4C = four-colour process (CMYK). White Base = a solid white ink layer printed under the colour so the design reads bright on tinted or dark glass. Without the white base, colours would look washed out or disappear against dark backgrounds.',
  },
  {
    question: 'Can I order a quantity between the tiers, like 250 or 750 pieces?',
    answer: 'Yes — just enter the number you want. The calculator snaps to the nearest supplier tier at or below your number, so 250 pcs prices at the 200 tier, 750 pcs prices at the 700 tier. You receive the full quantity you ordered.',
  },
  {
    question: 'How long do the decals last outdoors?',
    answer: 'The adhesive film we use with offset ink is rated for 3–5 years of outdoor exposure under Singapore conditions. Edge lifting and fading are the usual failure modes; daily high-pressure car washes accelerate both. For long-term fleet branding budget a reorder cycle every 2 years to keep the colours fresh.',
  },
  {
    question: 'What artwork format do you need?',
    answer: 'Print-ready PDF, CMYK colour space, 300 dpi minimum, 3 mm bleed on every edge, fonts outlined or embedded. We also accept AI and PSD if the file is packaged with linked assets. We preflight every file within 12 hours — if there is an issue you will hear from us before the job enters plate setup.',
  },
  {
    question: 'Do you install the decals on the vehicles?',
    answer: 'We supply the decals ready for self-install — peel, align, press. For full fleet rollouts across many vehicles we can point you to application partners in the Paya Lebar / Ubi area; that quote is separate from the print quote.',
  },
  {
    question: 'What is the turnaround time?',
    answer: '7 working days from file approval to ready for collection at Paya Lebar Square. Runs above 3000 pieces may add 1-2 days for cutting. Express turnaround is not available for offset runs — the plates cure overnight.',
  },
];

// ────────────────────────────────────────────────────────────────────
// Apply
// ────────────────────────────────────────────────────────────────────
try {
  const [prod] = await sql`select id from public.products where slug='car-decal'`;
  if (!prod) throw new Error('car-decal not found');

  await sql`
    update public.products
    set name = 'Car Decal',
        tagline = ${tagline},
        description = ${description}
    where id = ${prod.id}
  `;

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

  // Drop the legacy 1-axis product_pricing matrix — pricing_table is
  // the source of truth now, and leaving the old rows around lets the
  // homepage tiles show a stale "from" price.
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

  console.log('✓ car-decal content rewritten');
  console.log('  seo_title:', seo_title);
  console.log('  h1:', h1, h1em);
  console.log('  matcher rows:', matcher.rows.length);
  console.log('  magazine articles:', seo_magazine.articles.length);
  console.log('  faqs:', faqs.length);
} finally {
  await sql.end();
}
