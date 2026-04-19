// Rewrites artist-canvas page content. Keyword: "Artist Canvas Singapore".
//
// Current pricing config:
//   Material — Artist Canvas + Frame (single option)
//              Formula: 40 + (width + height) / 20  per piece
//              (mm inputs; = $20 + 0.5 × cm per dimension, summed)
//   Width (mm), Height (mm), Quantity — no finishing, no volume ladder.
//
// Writes ONLY to product_extras + product_faqs. Configurator untouched.

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

const h1 = 'Artist Canvas Singapore';
const h1em = 'stretched + framed, ready to hang.';

const tagline =
  'Artist canvas printing in Singapore — your artwork stretched on a wooden frame, priced by the dimension. From 20 × 20 cm ($60) to 100 × 100 cm ($140), ready to hang.';

const description =
  'Custom-printed artist canvas in Singapore — personal photos, artwork reproductions, fine-art prints, wedding portraits, event photography, pet portraits and interior wall pieces. Canvas is stretched on a wooden frame, wraps around the edges, and ships ready to hang. Price is per dimension (S$20 base + S$0.50 per cm), summed for width and height — so a 20 × 30 cm canvas is $30 + $35 = $65 per piece.';

const intro =
  'Artist canvas is a gallery-ready print — your photo or artwork on cotton canvas, stretched over a wooden stretcher-bar frame, gallery-wrapped so the image continues around the 35 mm deep edges. Ships with a hanging wire already mounted on the back, so it goes straight onto the wall with a single nail or picture hook. Pricing is additive across dimensions — every centimetre of width and every centimetre of height adds S$0.50, on top of a S$20 base per dimension. That means a square 50 × 50 cm canvas is $45 + $45 = $90, and a 60 × 90 cm canvas is $50 + $65 = $115. Enter width and height in millimetres on the calculator — 500 = 50cm, 900 = 90cm.';

// SEO attributes: use-cases + location + outcome. No print specs.
const seo_title = 'Artist Canvas Printing Singapore | Framed Canvas Prints for Home, Gift & Gallery';
const seo_desc =
  'Artist canvas printing Singapore — framed, ready-to-hang canvas prints for personal photos, artwork, wedding portraits, pet pictures and interior décor. Priced by dimension, from $60.';

const seo_body =
  'Artist canvas printing Singapore — personal photo canvases, artwork reproductions, wedding portrait prints, family-photo gifts, pet portraits, baby-photo keepsakes, fine-art limited editions, interior-décor wall pieces, corporate-gift canvases, commemorative event prints. ' +
  'Canvas stretched on a wooden frame, gallery-wrapped edges, hanging wire pre-mounted — custom sizes from 20 cm per dimension, priced additively at S$20 base + S$0.50/cm on each side, collected at Paya Lebar Square or delivered island-wide free over S$150.';

function pp(w_mm, h_mm) { return 40 + (w_mm + h_mm) / 20; }

const matcher = {
  kicker: 'Quick guide',
  title: "Tell us the wall,\nwe'll tell you",
  title_em: 'the pick.',
  right_note_title: 'Framed, wrapped, wired.',
  right_note_body:
    'Canvas stretched on a wooden frame, image wraps around the 35 mm depth, hanging wire pre-mounted — one nail, done.',
  rows: [
    {
      need: '*Tabletop or small shelf* — a personal photo on a compact canvas',
      pick_title: 'Artist Canvas · 200 × 300 mm (20 × 30 cm)',
      pick_detail: `The user-spec example: $30 (20cm side) + $35 (30cm side) = S$${pp(200, 300).toFixed(2)} per piece. Fits a bedside shelf, desk corner, or a small gallery wall cluster.`,
      apply: { material: 'framed', width: 200, height: 300, qty: 1 },
    },
    {
      need: '*Wedding portrait* — landscape photo for the lounge wall',
      pick_title: 'Artist Canvas · 600 × 400 mm (60 × 40 cm)',
      pick_detail: `Reads properly across a living-room wall without overpowering nearby furniture. $50 (60cm) + $40 (40cm) = S$${pp(600, 400).toFixed(2)}.`,
      apply: { material: 'framed', width: 600, height: 400, qty: 1 },
    },
    {
      need: '*Square format* — 50 × 50 cm of album artwork for the hallway',
      pick_title: 'Artist Canvas · 500 × 500 mm (50 × 50 cm)',
      pick_detail: `Square format for symmetric display or grouped hangings. $45 + $45 = S$${pp(500, 500).toFixed(2)}.`,
      apply: { material: 'framed', width: 500, height: 500, qty: 1 },
    },
    {
      need: '*Large feature piece* — 80 × 100 cm above the sofa',
      pick_title: 'Artist Canvas · 800 × 1000 mm (80 × 100 cm)',
      pick_detail: `Feature-wall scale. $60 (80cm) + $70 (100cm) = S$${pp(800, 1000).toFixed(2)}. Still ships with pre-mounted hanging wire — one anchor, goes up in minutes.`,
      apply: { material: 'framed', width: 800, height: 1000, qty: 1 },
    },
    {
      need: '*Small corporate-gift run* — 5 matching A3-ish canvases',
      pick_title: 'Artist Canvas · 300 × 400 mm (30 × 40 cm) · 5 pcs',
      pick_detail: `30 × 40 cm is a popular gift size. $35 + $40 = S$${pp(300, 400).toFixed(2)}/pc × 5 = S$${(pp(300, 400) * 5).toFixed(2)}. Tell us upstream if the 5 are going to different recipients and we can label the packing.`,
      apply: { material: 'framed', width: 300, height: 400, qty: 5 },
    },
  ],
};

const seo_magazine = {
  issue_label: 'Issue · Artist Canvas Printing',
  title: 'Everything worth knowing,',
  title_em: 'before the frame goes up.',
  lede:
    'Artist canvas is the gallery-ready format — photo or artwork on cotton canvas, stretched on a wooden frame, gallery-wrapped around the edges, wire pre-mounted. Four things decide whether the finished piece looks proper on the wall: **size, aspect ratio, file prep, and what "gallery wrap" actually means for your image**. Here is what matters on each one.',
  articles: [
    {
      num: '01',
      title: 'How the additive-dimension pricing works.',
      body: [
        'Every dimension (width and height) carries its own price — S$20 base + S$0.50 per centimetre. The 20 cm minimum side lands at $30, a 30 cm side is $35, 50 cm is $45, 100 cm is $70. Total per canvas is the sum of both sides. So a 20 × 30 cm is $30 + $35 = $65; a 50 × 70 cm is $45 + $55 = $100; a 100 × 100 cm is $70 + $70 = $140.',
        'This shape of pricing keeps small portrait-format canvases affordable while scaling smoothly up to large feature-wall pieces. A 60 × 90 cm portrait is $50 + $65 = $115 — roughly the same price as a much-smaller premium framed print from a standard retail chain.',
      ],
      side: {
        kind: 'list',
        label: 'Sample prices',
        rows: [
          { text: '20 × 30 cm', time: '$65' },
          { text: '50 × 50 cm', time: '$90' },
          { text: '60 × 90 cm', time: '$115' },
          { text: '100 × 100 cm', time: '$140' },
        ],
      },
    },
    {
      num: '02',
      title: 'Pick the aspect ratio before you pick the size.',
      body: [
        '**Portrait** (taller than wide) suits single-subject photos — a portrait, a wedding photo, a single object. **Landscape** (wider than tall) suits scenery, group shots, wide panoramas, cityscapes. **Square** (1:1) suits album art, Instagram-native photos, symmetric display in a grid of canvases. Pick the aspect ratio first, then scale the dimensions; the additive pricing means a 20 × 30 cm and a 30 × 20 cm are the same price ($65).',
        'Match the canvas aspect to the image\'s native aspect — do not force a 3:4 photo into a 1:1 canvas crop unless you are happy to lose head / feet / horizon. If the image ratio is awkward, order a slightly larger canvas to keep the crop generous, or ask us to contact you about a custom crop at file-check.',
      ],
      side: {
        kind: 'pills',
        label: 'Aspect cheat sheet',
        items: [
          { text: 'Portrait — single subject', pop: true },
          { text: 'Landscape — scenery / group' },
          { text: 'Square — album / IG native' },
          { text: 'Panoramic — cityscape / wide' },
        ],
      },
    },
    {
      num: '03',
      title: 'What gallery-wrap does to the edges of your image.',
      body: [
        'Gallery-wrap means the canvas continues around the 35 mm depth of the wooden frame — the image does not stop at a printed edge. That means the **outer 35 mm of your file on every side will wrap around the frame edge** and be visible from the side of the canvas (though not from the front).',
        'Practical implication: keep **critical subjects** (faces, logos, focal points) at least **50 mm away from every edge of the file**. If the photo has a tight crop where the subject touches the edge, add some blur-fill on the wrap zone (we can do this at file-check for you) so the wrapped edges do not show a sharp cut-off. For solid-colour backgrounds this does not matter — the colour wraps cleanly.',
      ],
      side: {
        kind: 'stat',
        label: 'Gallery wrap depth',
        num: '35 mm',
        caption: 'on every side — keep subjects 50mm in',
      },
    },
    {
      num: '04',
      title: 'Files, resolution, and what you receive.',
      body: [
        'Send an **image file** — JPEG, PNG, TIFF, or a print-ready PDF — at **300 dpi at the final canvas size**. So a 60 × 90 cm canvas needs a file of roughly 7,000 × 10,500 pixels to print crisp. Phone photos from recent iPhones / high-end Androids usually hit this at medium-to-large canvas sizes; older or heavily-cropped phone photos may be too small — we will tell you at file-check if the image cannot hold up at your chosen size.',
        'Each canvas ships individually wrapped, with the hanging wire already mounted on the back. Hang with a single picture hook or a nail; the wire is centred and the canvas will sit level if the wall fixing is level. We include a small brand sticker on the back — let us know if you need it removed (e.g. for gift-giving).',
      ],
      side: {
        kind: 'stat',
        label: 'File resolution',
        num: '300 dpi',
        caption: 'at final size — we check at upload',
      },
    },
  ],
};

const how_we_print = [
  {
    icon_url: null,
    emoji: '🖼️',
    title: 'Stretched on a wooden frame',
    desc: 'Cotton canvas pulled taut over a 35 mm deep stretcher-bar frame, gallery-wrapped around the edges. Ships ready to hang — one nail, one hook.',
  },
  {
    icon_url: null,
    emoji: '📐',
    title: 'Priced by the dimension',
    desc: 'S$20 base + S$0.50 per centimetre, summed across width and height. 20 × 30 cm is $65, 50 × 50 cm is $90, 100 × 100 cm is $140.',
  },
  {
    icon_url: null,
    emoji: '🔌',
    title: 'Pre-mounted hanging wire',
    desc: 'Wire fixed to the back of the frame before shipping. Hangs level off a single picture hook; no assembly needed at the wall.',
  },
  {
    icon_url: null,
    emoji: '🎯',
    title: 'File check in 12 hours',
    desc: 'Resolution, colour space and gallery-wrap safe zone all pre-checked. If the file is too small at your chosen size, we flag it before printing.',
  },
];

const faqs = [
  {
    question: 'How is the price calculated?',
    answer:
      'Price is additive across width and height. Each dimension costs S$20 base + S$0.50 per centimetre. A 20 cm side is $30 ($20 + $10); a 30 cm side is $35 ($20 + $15); a 100 cm side is $70 ($20 + $50). Per-canvas total is the sum of both sides: 20 × 30 cm = $30 + $35 = $65; 50 × 50 cm = $45 + $45 = $90; 100 × 100 cm = $70 + $70 = $140. The calculator asks for width and height in millimetres (so 500 = 50 cm, 900 = 90 cm).',
  },
  {
    question: 'What is the minimum and maximum size?',
    answer:
      'Minimum 20 × 20 cm (200 × 200 mm) — below that the stretcher frame hardware becomes proportionally unwieldy. Maximum 100 × 100 cm (1000 × 1000 mm) per piece on standard production; larger sizes are available on custom quote since they need a reinforced frame and specialist stretching. For larger feature-wall pieces contact us for the custom route.',
  },
  {
    question: 'What does "gallery wrap" mean for my image?',
    answer:
      'The canvas continues around the 35 mm depth of the wooden frame — the image does not stop at a printed edge and there is no blank border. The outer 35 mm of your file on every side will wrap around the frame edge. Practical implication: keep critical subjects (faces, logos, focal points) at least 50 mm away from every edge of the file. For solid or soft-gradient backgrounds this wraps cleanly; for images with a tight subject crop, we can add a blur-fill on the wrap zone at file-check — just ask.',
  },
  {
    question: 'Does the canvas come ready to hang?',
    answer:
      'Yes — every canvas ships with a hanging wire already mounted on the back of the wooden frame. Hang with a single picture hook or nail on the wall; the wire is centred so the canvas sits level if the wall fixing is level. No assembly, no extra hardware. For very large canvases (over 80 cm per side) we recommend two anchors spaced to match the wire width for added security.',
  },
  {
    question: 'What file format and resolution do you need?',
    answer:
      'JPEG, PNG, TIFF or a print-ready PDF — at 300 dpi at your final canvas size. For a 60 × 90 cm canvas that works out to roughly 7,000 × 10,500 pixels; for a 30 × 40 cm canvas, roughly 3,500 × 4,700 pixels. Recent iPhone / high-end Android photos hit 300 dpi at up to ~50 cm canvases; older phones or heavily-cropped images may be too small. We pre-check and flag at upload — if the image is too small at your chosen size, we tell you before printing and suggest a smaller size that still looks crisp.',
  },
  {
    question: 'Is the colour on the canvas the same as on my screen?',
    answer:
      'Very close but not exact. Monitors emit light, canvas reflects light, so pure saturation drops 5–10% on most colours in the printing process. Skin tones, warm yellows, and mid-reds are the most reliably matched. Cyan-blue and fluorescent-green tend to shift slightly on print. Send an sRGB file (phone photos are sRGB by default) — we convert to CMYK at file-check. If exact brand-colour match matters (corporate gifting, matched-set production), tell us at order so we can run a paid proof before the main piece.',
  },
  {
    question: 'How long does it take and how is it delivered?',
    answer:
      'Three working days from artwork approval to ready-for-collection at Paya Lebar Square — that covers print, lamination, stretching on the frame, wire-mounting, and packing. Large canvases over 80 cm per side may add one extra day for the stretch cycle. Free delivery within Singapore on orders over S$150; otherwise collected for free at Paya Lebar Square any working day, or paid delivery for single canvases.',
  },
  {
    question: 'Can I order multiple canvases at once?',
    answer:
      'Yes — the calculator lets you order any quantity at the same size. Each canvas is priced individually at the per-piece rate (no quantity discount on artist canvas), and all pieces in the order print with matched colour and stretch-consistency across the batch. For multi-piece grid hangings (same image split across 2 or 3 canvases) or for 2+ different sizes in one order, contact us — we can co-ordinate the set at packing.',
  },
];

function mergeHowWePrintIcons(newCards, existingCards) {
  if (!Array.isArray(existingCards) || existingCards.length === 0) return newCards;
  const byTitle = new Map();
  existingCards.forEach((c, i) => {
    if (c?.title) byTitle.set(c.title, { icon_url: c.icon_url ?? null, index: i });
  });
  return newCards.map((card, i) => {
    const titleMatch = card.title ? byTitle.get(card.title) : null;
    const existingIconByIndex = existingCards[i]?.icon_url ?? null;
    const preservedIcon = titleMatch?.icon_url ?? existingIconByIndex ?? null;
    return preservedIcon ? { ...card, icon_url: preservedIcon } : card;
  });
}

try {
  const [prod] = await sql`select id from public.products where slug='artist-canvas'`;
  if (!prod) throw new Error('artist-canvas not found');

  const [existingExtras] = await sql`
    select how_we_print from public.product_extras where product_id = ${prod.id}
  `;
  const mergedHowWePrint = mergeHowWePrintIcons(how_we_print, existingExtras?.how_we_print);

  await sql`update public.products set tagline = ${tagline}, description = ${description} where id = ${prod.id}`;
  await sql`
    insert into public.product_extras (product_id, seo_title, seo_desc, seo_body, h1, h1em, intro, matcher, seo_magazine, how_we_print)
    values (${prod.id}, ${seo_title}, ${seo_desc}, ${seo_body}, ${h1}, ${h1em}, ${intro}, ${sql.json(matcher)}, ${sql.json(seo_magazine)}, ${sql.json(mergedHowWePrint)})
    on conflict (product_id) do update
      set seo_title = excluded.seo_title, seo_desc = excluded.seo_desc, seo_body = excluded.seo_body,
          h1 = excluded.h1, h1em = excluded.h1em, intro = excluded.intro,
          matcher = excluded.matcher, seo_magazine = excluded.seo_magazine, how_we_print = excluded.how_we_print
  `;
  await sql`delete from public.product_faqs where product_id = ${prod.id}`;
  for (let i = 0; i < faqs.length; i++) {
    await sql`insert into public.product_faqs (product_id, question, answer, display_order)
              values (${prod.id}, ${faqs[i].question}, ${faqs[i].answer}, ${i})`;
  }
  console.log('✓ artist-canvas content rewritten');
  console.log('  h1:', h1, '·', h1em);
} finally {
  await sql.end();
}
