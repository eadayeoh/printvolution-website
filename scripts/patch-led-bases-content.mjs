// Rewrite LED Bases copy from the ACTUAL config:
//   - 3 bases: Black (S$55, Bluetooth speaker + 7-colour LED + USB/battery)
//              Wood Circle (S$55, 7-colour LED + remote + USB/battery)
//              Wood Rectangle (S$40, warm light + USB only)
//   - 2 sizes: A5 portrait (148×210, +S$0), A4 portrait (210×297, +S$10)
//   - 2 styles: Line Art, Realistic Imagery (laser engraving)
//   - 1-day turnaround, dual-mode laser + UV
// Accurate facts only.

import { openSql } from './_lib-merge-gift-group.mjs';

const PATCH = {
  name: 'LED Photo Lamp Base',
  tagline: 'From S$40 · Upload a photo, pick your base, light it up.',
  seo_title: 'LED Photo Lamp Base Singapore · Engraved Acrylic from S$40',
  seo_desc: 'Personalised LED photo lamp base in Singapore. Pick Black (Bluetooth speaker + 7-colour LED), Wood Circle (remote + 7-colour LED) or Wood Rectangle (warm light). Laser-engraved acrylic, A5 or A4, 1-day turnaround.',
  seo_body: 'LED photo lamp base Singapore — laser-engraved acrylic on Black base with Bluetooth speaker, Wood Circle with remote, or Wood Rectangle warm light. Line art or realistic imagery engraving, A5 (148×210mm) or A4 (210×297mm), 1-day turnaround.',
  description: 'Three bases, one photo, one lamp. The Black base packs a Bluetooth speaker and 7-colour LED. The Wood Circle ships with a remote and runs the same 7 colours. The Wood Rectangle keeps it pure — warm white light, USB-powered, under S$50. Upload any photo; pick line art for crisp vector strokes or realistic imagery for tonal greyscale engraving. A5 (148×210mm) or A4 (210×297mm) acrylic panel, engraved overnight for next-day collection.',

  faqs: [
    {
      question: 'How does it work?',
      answer: 'Upload any photo, pick a style (Line Art or Realistic Imagery), pick a base (Black, Wood Circle, or Wood Rectangle), pick a size (A5 or A4). We laser-engrave your photo into a standing acrylic panel that slots into the base. Previews are free — you see it before paying.',
    },
    {
      question: 'What\'s the turnaround?',
      answer: 'Next day. Order today, ready for collection or delivery the next working day. Weekends are skipped automatically.',
    },
    {
      question: 'Which base should I pick?',
      answer: '**Black Base (S$55)** — Bluetooth speaker, 7-colour changing LED, adjustable modes, USB or battery. Best if you want a gift with a bit more wow.\n\n**Wood Circle Base (S$55)** — 7-colour LED, remote control, USB or battery. The premium-feeling option without the speaker.\n\n**Wood Rectangle (S$40)** — warm white light only, USB-powered. Clean, quiet, easily the best value for a nightlight or bedside piece.',
    },
    {
      question: 'Line Art or Realistic Imagery — which do I pick?',
      answer: '**Line Art** — clean black-and-white outlines, graphic and minimal. Reads well on a bedside or shelf, keeps faces recognisable without fuss.\n\n**Realistic Imagery** — tonal greyscale engraving, photo-like. Preserves skin tones and shadows. Better for family portraits where you want the depth to show.\n\nPreview both for free before paying.',
    },
    {
      question: 'A5 or A4 — what\'s the difference?',
      answer: 'A5 portrait (148×210mm) sits neatly on a bedside table or office desk. A4 portrait (210×297mm, +S$10) is closer to a framed photo — better on a sideboard, shelf, or as a statement piece on a dresser.',
    },
    {
      question: 'What photos work best?',
      answer: 'Clear subject, simple background, good lighting. Family portraits against plain walls, pets against grass, couples with sky behind them all engrave beautifully. Very dark photos or busy group shots with small faces usually come out muddy. The AI cleans up so-so photos but can\'t invent detail that isn\'t there.',
    },
    {
      question: 'Is the engraving permanent?',
      answer: 'Yes. The laser physically etches the acrylic surface — it\'s not printed, not a sticker, not a coating. Won\'t fade, scratch off, or wash away. Reads as clear frosted marks by day, glows bright when the base is lit at night.',
    },
    {
      question: 'Can I change my mind after ordering?',
      answer: 'Before production starts, yes — full refund. Once we\'ve begun engraving (usually within a few hours of approval), we can\'t reverse it because every piece is custom. You\'ll always see the preview before we start.',
    },
  ],

  seo_magazine: {
    issue_label: 'LED Photo Lamp Base · Issue 01',
    title: 'Three bases, one photo,',
    title_em: 'one lamp that actually looks like you.',
    lede: 'Custom LED photo lamp bases are Singapore\'s most-ordered personalised gift for a reason — they\'re quiet, warm, and actually get used. Here\'s what separates a good one from a sticker-on-cheap-acrylic.',
    articles: [
      {
        num: '01',
        title: 'Pick the base first, not the photo.',
        body: [
          'The lamp base does more than light the acrylic — it sets the room. **The Black Base** packs a Bluetooth speaker and 7-colour LED: it\'s the one you give to someone who already has nice things. **The Wood Circle** runs the same 7 colours with a remote, sits on a bedside like a real piece of wood, and skips the speaker. **The Wood Rectangle** is pure warm white, USB-powered, and comes in at S$40 — the nightlight your friend\'s kid will actually keep on.',
          'None of them are wrong. Match the base to the room it\'s going in first — then worry about which photo you\'ll engrave.',
        ],
        side: {
          kind: 'list',
          label: 'Base at a glance',
          rows: [
            { text: 'Black · Speaker + 7-colour', time: 'S$55' },
            { text: 'Wood Circle · Remote + 7-colour', time: 'S$55' },
            { text: 'Wood Rectangle · Warm only', time: 'S$40' },
          ],
        },
      },
      {
        num: '02',
        title: 'Line Art vs Realistic — it\'s not just taste.',
        body: [
          '**Line Art** is a pure black-and-white etching. No greys, no shading. It reads clean on the acrylic by day and glows crisp at night. It\'s forgiving — even a mediocre phone photo can look like commissioned art once it\'s stripped to outlines.',
          '**Realistic Imagery** keeps the full tonal range — skin tones, shadows, fabric texture. The laser etches a range of depths so the engraving reads like a photograph in frosted glass. Needs a sharper source photo to shine.',
          'Both styles preview live before you pay. If you can\'t decide, upload your photo once and flip between them — takes about ten seconds.',
        ],
        side: {
          kind: 'quote',
          text: '"Preview is free. Order only when the engraving looks like the person."',
          author: 'Printvolution · how we build gifts',
        },
      },
      {
        num: '03',
        title: 'A5 or A4 · where it\'ll actually sit.',
        body: [
          '**A5 portrait (148×210mm)** fits a bedside table without crowding a clock, a phone, and a water glass. Easy to live with. Most orders sit on this size.',
          '**A4 portrait (210×297mm, +S$10)** is closer to a small framed photograph — best on a sideboard, open shelf, or a console table near the front door. Turn it on for guests, off the rest of the time.',
          'Both sizes use the same acrylic thickness and the same base. The price difference is surface area for engraving, not quality.',
        ],
        side: {
          kind: 'list',
          label: 'Size reality check',
          rows: [
            { text: 'A5 · 148×210mm', time: 'Bedside / desk' },
            { text: 'A4 · 210×297mm', time: 'Shelf / console' },
          ],
        },
      },
    ],
  },
};

const sql = await openSql();
try {
  const [before] = await sql`select slug, name, jsonb_typeof(faqs) as faqs_type from gift_products where slug = 'led-bases'`;
  if (!before) { console.log('LED Bases not found'); process.exit(1); }
  console.log('Before:');
  console.log('  name:', before.name);
  console.log('  faqs:', before.faqs_type || '(null)');

  await sql`
    update gift_products
       set name = ${PATCH.name},
           tagline = ${PATCH.tagline},
           seo_title = ${PATCH.seo_title},
           seo_desc = ${PATCH.seo_desc},
           seo_body = ${PATCH.seo_body},
           description = ${PATCH.description},
           faqs = ${sql.json(PATCH.faqs)},
           seo_magazine = ${sql.json(PATCH.seo_magazine)},
           updated_at = now()
     where slug = 'led-bases'
  `;

  const [after] = await sql`select name, tagline, jsonb_array_length(faqs) as faq_count, seo_magazine->>'title' as mag_title from gift_products where slug = 'led-bases'`;
  console.log('\nAfter:');
  console.log('  name:', after.name);
  console.log('  tagline:', after.tagline);
  console.log('  faqs:', after.faq_count, 'entries');
  console.log('  magazine title:', after.mag_title);
} finally {
  await sql.end();
}
