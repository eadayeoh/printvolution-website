// Full product-page rewrite for LED Frame (slug: led-frame).
// Product facts anchored in DB:
//   - mode = laser (acrylic panel laser-engraved, NOT UV-printed)
//   - dims = 148×210 mm (A5 portrait)
//   - lead_time_days = 1 (next working day)
//   - base_price_cents = 4800 (S$48)
//   - no variants, no size overrides
// H1 (name) + H1em (tagline) are kept — rewrite rule says don't touch
// the headline. Everything else gets rebuilt from the actual product
// config — no invented workshop locations, no cure times, no "UV"
// copy (that was a stale WP-import paragraph).

import { openSql } from './_lib-merge-gift-group.mjs';

const PATCH = {
  seo_title: 'LED Photo Frame Singapore · Laser-Engraved Acrylic from S$48',
  seo_desc: 'Personalised LED photo frame in Singapore. Laser-engraved A5 acrylic panel sits inside a lit frame — swap the insert anytime. From S$48, next-day turnaround.',
  seo_body: 'LED photo frame Singapore — A5 (148×210mm) laser-engraved acrylic insert, warm LED edge-lit, slot-in design for easy swap. Line art or realistic engraving, next-working-day turnaround from S$48. Anniversary, wedding, memorial, parents, nursery.',
  description: "A lit frame with a laser-engraved acrylic panel that slots in and out. Upload any photo — we engrave it into the A5 panel, drop it into the frame, and the LEDs light it from behind. Swap the panel any time for a new photo. Two engraving styles: **Line Art** gives clean, graphic outlines that read well across a room, and **Realistic Imagery** holds the full tonal range of the original photo with photo-like depth. Both glow clear at night. Next working day from order to ready.",

  faqs: [
    {
      question: 'How does the photo get onto the frame?',
      answer: 'The photo is laser-engraved into a clear A5 acrylic panel (148×210mm). The panel slots into the lit frame from the top. Laser engraving physically etches the acrylic — it is not printed, not a sticker, not a coating. Reads as frosted marks by day, glows bright when the LED is on.',
    },
    {
      question: 'How long does it take to make?',
      answer: 'Next working day. Order today, ready for collection or delivery the next working day. Weekends are skipped automatically.',
    },
    {
      question: 'Line Art or Realistic Imagery — which do I pick?',
      answer: '**Line Art** — clean black-and-white outlines, graphic and minimal. Keeps faces recognisable without fuss, forgiving on average phone photos.\n\n**Realistic Imagery** — tonal greyscale engraving, photo-like depth. Preserves skin tones and soft shadows. Best for family portraits where you want the full range to show.\n\nBoth preview for free before you pay.',
    },
    {
      question: 'Can I change the photo later?',
      answer: 'Yes — the acrylic panel slots in and out of the frame. Order a replacement panel any time (single panel, no frame), upload a new photo, we engrave it, slot it into the same frame. Makes the frame a gift that keeps going: anniversary this year, baby photo next.',
    },
    {
      question: 'What photos work best?',
      answer: 'Clear subject, good lighting, not too much going on in the background. Family portraits, couples, pet portraits, and landscapes all engrave nicely. Very dark shots or crowded group photos with small faces can come out muddy. The AI cleans up so-so photos but can\'t invent detail the original never had.',
    },
    {
      question: 'Does the engraving fade?',
      answer: 'No. The laser etches the acrylic surface physically, so the marks are permanent. They will not fade in sunlight, wash away, or scratch off with normal handling.',
    },
    {
      question: 'How is the frame powered?',
      answer: 'USB. Plug it into any USB charger or a USB port on a laptop, power bank, or plug adapter. No batteries to change.',
    },
    {
      question: 'Can I change my mind after ordering?',
      answer: 'Before production starts — yes, full refund. Once engraving begins (usually within a few hours of preview approval), we can\'t reverse it because every panel is custom. You always see the preview before we start.',
    },
  ],

  occasions: [
    {
      icon: '♡',
      title: 'Anniversary',
      tip: 'A photo from <b>before the routine set in</b> — holidays, early dates, the wedding morning. The engraving holds faces better than a framed print would.',
      suggested: 'Realistic · slot the panel, warm LED',
    },
    {
      icon: '♛',
      title: 'Parents / Grandparents',
      tip: 'A <b>clear family portrait</b> reads well from across a room. Line art is forgiving on older photos; realistic holds up on newer ones.',
      suggested: 'Line art · everyday bedside glow',
    },
    {
      icon: '☾',
      title: 'Nursery / bedside',
      tip: '<b>Warm LED, USB-powered</b>, no colour distractions. Easy to leave on through the night, easy to unplug when it\'s time to travel.',
      suggested: 'Line art · soft night glow',
    },
    {
      icon: '✦',
      title: 'Memorial / remembrance',
      tip: 'A gentle tribute — a person, a pet. <b>Line art keeps things soft</b> rather than photographic. Engraving is permanent, no pigment to fade.',
      suggested: 'Line art · quiet daily presence',
    },
    {
      icon: '★',
      title: 'Wedding / engagement',
      tip: 'The couple\'s <b>favourite photo together</b>, engraved for a piece that lives on the sideboard. Panel swaps mean it keeps earning its spot as new photos replace the old.',
      suggested: 'Realistic · display year one and beyond',
    },
    {
      icon: '♪',
      title: 'Just-because gift',
      tip: '<b>Panel is interchangeable.</b> Gift the frame with one photo now; order a replacement panel later for a birthday, promotion, new baby. One frame, many moments.',
      suggested: 'Start with any style · swap later',
    },
  ],

  process_steps: [
    {
      title: 'Upload & style',
      time: 'Free preview',
      desc: 'Upload any clear photo. Flip between Line Art and Realistic Imagery to see both engraving styles live. No payment until you\'re happy.',
    },
    {
      title: 'Pick a style',
      time: 'From S$48',
      desc: 'Choose the engraving style that suits the photo — Line Art for graphic, clean reads; Realistic Imagery for tonal, photo-like depth.',
    },
    {
      title: 'We engrave the panel',
      time: 'Next working day',
      desc: 'Laser-engraved into the A5 acrylic panel — permanent, not printed. Every panel inspected before it slots into the frame.',
    },
    {
      title: 'Collect or delivery',
      time: 'Next day · SG',
      desc: 'Ready the next working day. Opt for islandwide delivery or collection — pick your preference at checkout.',
    },
  ],

  seo_magazine: {
    issue_label: 'LED Photo Frame · Issue 01',
    title: 'Light-up photo frame,',
    title_em: 'built so the photo can change.',
    lede: 'The LED photo frame is one of the most ordered personalised gifts in Singapore for a reason — it is quiet, warm, and easy to live with. Here is what separates a good one from a cheap stick-on version, and how to pick a photo that actually engraves well.',
    articles: [
      {
        num: '01',
        title: 'Engraved, not printed — and why that matters.',
        body: [
          'Cheap LED frames use a printed sticker on the panel. The sticker lifts at the edges within months, the print fades in direct sun, and the light passes through unevenly — bright where the ink is thin, muddy where it is thick.',
          '**Laser engraving etches the acrylic itself.** No ink, no sticker, no layer to peel. The LED lights up the engraved grooves from behind and the photo reads crisp, whether the light is on or off. You can scratch the panel and the photo stays put. The engraving outlasts the frame.',
        ],
        side: {
          kind: 'list',
          label: 'Engrave vs sticker',
          rows: [
            { text: 'Permanent — never fades', time: 'Laser' },
            { text: 'Scratch-proof face', time: 'Laser' },
            { text: 'Lifts after months', time: 'Sticker' },
          ],
        },
      },
      {
        num: '02',
        title: 'Line Art vs Realistic — it is not just taste.',
        body: [
          '**Line Art** strips the photo to pure black-and-white outlines. No greys, no shading. Reads clean on the panel by day and glows crisp at night. Forgiving — even a mediocre phone photo can look like commissioned art once stripped to lines.',
          '**Realistic Imagery** keeps the full tonal range — skin tones, shadows, fabric texture. The laser etches at varied depths so the panel reads like a photograph in frosted glass. Needs a sharper source photo to shine.',
          'Both styles preview live and free before you pay. If you cannot decide, upload once and flip between them — takes about ten seconds.',
        ],
        side: {
          kind: 'quote',
          text: '"Preview is free. Order only when the engraving looks like the person."',
          author: 'Printvolution · how we build gifts',
        },
      },
      {
        num: '03',
        title: 'The panel slots out — which is the whole point.',
        body: [
          'The A5 acrylic panel lifts out of the frame. Order a fresh panel later, engrave a different photo, drop it into the same frame. Anniversary gift this year, new baby photo next, a memorial panel further on.',
          'One frame, many moments — worth telling the recipient so they don\'t assume it is a one-photo piece. Most people do not realise it until they need to change it.',
        ],
        side: {
          kind: 'list',
          label: 'Slot-in sizes',
          rows: [
            { text: 'A5 panel · 148×210mm', time: 'Standard' },
            { text: 'Panel only · no frame', time: 'Reorder' },
          ],
        },
      },
    ],
  },
};

const sql = await openSql();
try {
  const [before] = await sql`select slug, name, seo_title, jsonb_array_length(coalesce(faqs,'[]'::jsonb)) as faqs_n, jsonb_array_length(coalesce(occasions,'[]'::jsonb)) as occ_n, jsonb_array_length(coalesce(process_steps,'[]'::jsonb)) as steps_n from gift_products where slug = 'led-frame'`;
  if (!before) { console.log('LED Frame not found'); process.exit(1); }
  console.log('Before:');
  console.log('  name:', before.name);
  console.log('  seo_title:', before.seo_title);
  console.log('  faqs:', before.faqs_n, '| occasions:', before.occ_n, '| process_steps:', before.steps_n);

  await sql`
    update gift_products
       set seo_title    = ${PATCH.seo_title},
           seo_desc     = ${PATCH.seo_desc},
           seo_body     = ${PATCH.seo_body},
           description  = ${PATCH.description},
           faqs         = ${sql.json(PATCH.faqs)},
           occasions    = ${sql.json(PATCH.occasions)},
           process_steps= ${sql.json(PATCH.process_steps)},
           seo_magazine = ${sql.json(PATCH.seo_magazine)},
           updated_at   = now()
     where slug = 'led-frame'
  `;

  const [after] = await sql`select name, seo_title, jsonb_array_length(coalesce(faqs,'[]'::jsonb)) as faqs_n, jsonb_array_length(coalesce(occasions,'[]'::jsonb)) as occ_n, jsonb_array_length(coalesce(process_steps,'[]'::jsonb)) as steps_n, seo_magazine->>'title' as mag_title from gift_products where slug='led-frame'`;
  console.log('\nAfter:');
  console.log('  name:', after.name);
  console.log('  seo_title:', after.seo_title);
  console.log('  faqs:', after.faqs_n, '| occasions:', after.occ_n, '| process_steps:', after.steps_n);
  console.log('  magazine title:', after.mag_title);
} finally {
  await sql.end();
}
