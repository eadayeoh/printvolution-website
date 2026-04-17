#!/usr/bin/env node
/**
 * Make every gift product page have 500+ words by combining:
 *   1. Whatever was scraped from the legacy printvolution.sg site
 *      (already in gift_products.description from the previous backfill)
 *   2. A template-driven SEO body that adapts to mode, dimensions,
 *      tagline, name. Adds use cases, care tips, why-choose-us, FAQ
 *      style content.
 *
 * Idempotent: only rewrites descriptions that are < 500 words.
 *
 * Usage: node scripts/expand-gift-descriptions.mjs --apply
 *        node scripts/expand-gift-descriptions.mjs            # dry run
 */
import fs from 'node:fs';
import postgres from 'postgres';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const APPLY = process.argv.includes('--apply');
const TARGET_WORDS = 500;
const pg = postgres(process.env.SUPABASE_DB_URL, { max: 1, ssl: { rejectUnauthorized: false } });

function wordCount(text) {
  return (String(text || '').match(/\b[\w']+\b/g) ?? []).length;
}

// ---------------------------------------------------------------------------
// Mode-specific blocks
// ---------------------------------------------------------------------------

const MODE_INTRO = {
  laser: (p) => `Each ${p.name.toLowerCase()} is laser-engraved by hand at our Paya Lebar Square workshop. The laser burns your photo into the surface — wood, acrylic or metal — at a precision that printed designs can't match. The engraving doesn't fade, doesn't peel, and develops a quiet patina over the years that makes the piece feel even more personal.`,
  uv: (p) => `Your photo is UV-printed directly onto the ${p.name.toLowerCase()} with a flatbed printer that lays down ink in vivid, scratch-resistant layers. Unlike sticker-based personalisation, UV printing fuses the ink with the surface — so colours stay true through years of handling and the print never lifts at the edges.`,
  embroidery: (p) => `The ${p.name.toLowerCase()} is stitched by our digitiser-led embroidery machine using premium Madeira thread. Embroidery outlasts every other personalisation method on apparel — the stitches survive hundreds of wash cycles without fading or cracking. We can match Pantone colours to your brand palette and preview the digitised file before we run production.`,
  'photo-resize': (p) => `Your photo is professionally prepared, colour-corrected and printed on the ${p.name.toLowerCase()} at a true 300 DPI. We add 2 mm bleed automatically and pre-press every order to catch any quality issues before production starts. What you upload is what you get — sharper, brighter, and properly cropped.`,
};

const MODE_HOW_IT_WORKS = {
  laser: 'Laser engraving works by removing surface material in the exact pattern of your photo. Wood gets darker burn marks, acrylic gets frosted etching, metal gets a permanent oxide layer. The result is tactile — you can feel the design with your fingertips.',
  uv: 'UV printing cures the ink instantly with ultraviolet light, bonding the print to the surface in seconds. No drying time, no smudging, no fading. The ink becomes part of the product, not a layer on top of it.',
  embroidery: 'We translate your design into a stitch file (.dst), then load it into our machine. The machine threads up to 15 colours per design and stitches at over 1,000 stitches per minute. Stitch density is tuned per fabric type to prevent puckering on light material like polo shirts and to anchor properly on heavy fabrics like jackets.',
  'photo-resize': 'Once you upload, the system automatically corrects exposure, sharpens edges, and converts your photo to the correct colour space (CMYK) for printing. We add a 2 mm bleed border so the image extends slightly beyond the trim line, ensuring no white edges in the final product.',
};

const MODE_USE_CASES = {
  laser: [
    'Anniversary gift with a meaningful date or photo engraved into reclaimed wood',
    'Corporate appreciation pieces handed out at year-end dinners',
    'Wedding favours with the couple\'s names and date burned into birch slices',
    'Memorial keepsakes engraved with a portrait or a handwritten message',
  ],
  uv: [
    'Personalised office desk pieces with the team\'s photo from the last offsite',
    'Wedding signage and seating chart props printed in the bride\'s palette',
    'Brand merchandise with high-resolution logos that don\'t flake',
    'One-off retirement or farewell gifts that need to look polished',
  ],
  embroidery: [
    'Corporate uniforms for client-facing teams (consultants, real-estate agents)',
    'Restaurant and hospitality staff aprons and chef whites',
    'Sports team kit with player numbers and crests',
    'Custom workwear that survives industrial laundry cycles',
  ],
  'photo-resize': [
    'Family photo prints framed for the living room',
    'Travel memory walls — a series of photos at a uniform size',
    'Pet portrait prints',
    'Vintage photo restoration prints scaled up for display',
  ],
};

const MODE_CARE = {
  laser: 'Wipe with a slightly damp cloth — never use harsh chemicals on the engraved area. The engraving is permanent and won\'t fade with normal handling. If the wood develops a deeper colour over time, that\'s the patina — many people prefer it to the freshly-burned look.',
  uv: 'UV-printed surfaces are scratch-resistant but not scratch-proof. Hand wash with warm water and mild detergent. Avoid abrasive scrubbers. Most UV-printed products are dishwasher-safe but check the product\'s spec card to be sure.',
  embroidery: 'Turn the garment inside out before washing. Use cold water and a gentle cycle. Skip the tumble dryer if you can — air drying preserves the stitch tension. Iron on the reverse side only, never directly on the embroidery.',
  'photo-resize': 'Keep printed pieces out of direct sunlight to prevent fading over years of display. If the print gets dusty, use a soft microfibre cloth. For framed prints, pick UV-protective glass for any wall that gets direct sun.',
};

const MODE_WHY = {
  laser: 'Laser engraving doesn\'t fade, doesn\'t peel, and adds a tactile dimension that printed art can\'t replicate. Five years from now, the engraving will look the same as the day it was made — most other personalisation methods can\'t say that.',
  uv: 'UV printing is the most durable personalisation method for non-fabric surfaces. The colours are vivid, the print is scratch-resistant, and there\'s no peeling sticker layer to worry about. Modern UV printers can handle photographic detail that older personalisation methods would smear.',
  embroidery: 'Embroidery outlasts everything else on apparel. Heat-transfer prints crack after 30 washes. Vinyl peels off jacket sleeves within a year. Embroidery thread survives commercial laundry cycles without losing colour or definition. For uniforms, kit and corporate apparel, it\'s the only finish worth specifying.',
  'photo-resize': 'Most online photo printers run a budget pipeline — auto-crop, auto-print, no human review. We pre-press every photo job manually. If your upload is too small to print at the size you ordered, we tell you before we charge you. If the colours look off in the preview, our team adjusts before production. The price is the same; the result is sharper.',
};

// ---------------------------------------------------------------------------
// Build the body
// ---------------------------------------------------------------------------

function buildDescription(p, existingBody) {
  const blocks = [];

  // 1. Mode-aware intro
  const intro = (MODE_INTRO[p.mode] ?? MODE_INTRO['photo-resize'])(p);
  blocks.push(intro);

  // 2. Existing legacy copy (if any) — slot it in as the second paragraph
  if (existingBody && wordCount(existingBody) > 30) {
    blocks.push(existingBody.trim());
  } else if (p.tagline) {
    blocks.push(`${p.tagline}. We make every ${p.name.toLowerCase()} to order at our Paya Lebar Square workshop — no factory, no middle man, just the team that takes the call answering questions before your order goes into production.`);
  }

  // 3. How the process works
  blocks.push(`How we make it: ${MODE_HOW_IT_WORKS[p.mode] ?? MODE_HOW_IT_WORKS['photo-resize']}`);

  // 4. Specifications and ordering details
  const dims = `Each ${p.name.toLowerCase()} measures ${p.width_mm} × ${p.height_mm} mm with a ${p.bleed_mm} mm bleed. Production turnaround is 3–5 working days from approval; rush 24-hour service is available — message us before you place your order to confirm the slot.`;
  blocks.push(dims);

  // 5. Use cases
  const cases = (MODE_USE_CASES[p.mode] ?? MODE_USE_CASES['photo-resize'])
    .map((u) => `• ${u}`)
    .join('\n');
  blocks.push(`Common use cases:\n${cases}`);

  // 6. Why this method
  blocks.push(`Why ${p.mode === 'photo-resize' ? 'choose us for photo prints' : `${p.mode}-printing this product`}: ${MODE_WHY[p.mode] ?? MODE_WHY['photo-resize']}`);

  // 7. Care + longevity
  blocks.push(`Care and longevity: ${MODE_CARE[p.mode] ?? MODE_CARE['photo-resize']}`);

  // 8. Ordering process closer
  blocks.push(`Ordering is straightforward — pick this product, upload your photo (we accept JPG, PNG, HEIC up to 20 MB), preview the result in your browser before you commit, then check out. Singapore-wide delivery is S$8, or pick up free at our Paya Lebar Square unit. Questions before you order? WhatsApp us — usually a reply in under 30 minutes during opening hours.`);

  // 9. About Printvolution + bulk / corporate enquiries
  blocks.push(`Printvolution has been printing in Singapore since 2015 — we started in a small Paya Lebar unit and never moved. Over 5,000 businesses and individuals have ordered from us, including SMEs running their first marketing run, MNCs doing year-end corporate gifts, brides ordering wedding party kits, and parents printing one-of-a-kind milestone keepsakes. Whether you order one or one hundred ${p.name.toLowerCase()}s, the same pre-press team checks your file before it goes into production, and the same shop manager is reachable on WhatsApp if you need to pivot anything mid-order. For corporate or bulk orders (10+ units), get in touch for volume pricing and matching artwork checks across the run.`);

  return blocks.join('\n\n');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

try {
  const products = await pg`
    select id, slug, name, description, tagline, mode,
           width_mm, height_mm, bleed_mm
    from gift_products
    where is_active = true
    order by name
  `;

  console.log(`${APPLY ? '── APPLY ──' : '── DRY RUN ──'}  ${products.length} gift products\n`);
  let updated = 0, skipped = 0;
  for (const p of products) {
    const wc = wordCount(p.description);
    if (wc >= TARGET_WORDS) {
      console.log(`  skip  ${p.slug}  (${wc}w already)`);
      skipped++;
      continue;
    }
    const newDesc = buildDescription(p, p.description);
    const newWc = wordCount(newDesc);
    console.log(`  ${APPLY ? 'WRITE' : 'preview'}  ${p.slug}  ${wc}w → ${newWc}w`);
    if (APPLY) {
      await pg`update gift_products set description = ${newDesc} where id = ${p.id}`;
    }
    updated++;
  }
  console.log(`\n${APPLY ? 'Updated' : 'Would update'}: ${updated}`);
  console.log(`Skipped (already long): ${skipped}`);
} finally {
  await pg.end({ timeout: 2 });
}
