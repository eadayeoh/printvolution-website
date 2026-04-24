// Per-product Who's-it-for? + How-it-works copy for LED Photo Lamp Base.
// Stripped of invented operational facts (no workshop location, no S$150
// free-delivery line, no promised hour counts the product data doesn't back).
// Only things anchored in the product config: next-day turnaround,
// laser-engraved acrylic panel, three bases, two sizes, two engraving styles,
// live free preview before payment.

import { openSql } from './_lib-merge-gift-group.mjs';

const PATCH = {
  occasions: [
    {
      icon: '♡',
      title: 'Anniversary',
      tip: 'A photo from <b>before the routine set in</b> — holidays, early dates, the wedding morning. Engraved detail picks up faces better than you\'d expect.',
      suggested: 'Realistic · A4',
    },
    {
      icon: '♛',
      title: 'Parents / Grandparents',
      tip: 'A <b>clear family portrait</b> reads well across a room. Line art is forgiving on older photos; realistic holds up on newer ones.',
      suggested: 'Line art · Wood Circle',
    },
    {
      icon: '☾',
      title: 'Nursery / bedside',
      tip: 'Warm light, quiet glow — the Wood Rectangle is <b>USB-only warm white</b>, no colour-change distractions. Easy to leave on all night.',
      suggested: 'Wood Rectangle · A5',
    },
    {
      icon: '✦',
      title: 'Memorial / remembrance',
      tip: 'A gentle tribute — a pet, a loved one. <b>Line art keeps things soft</b> rather than photographic. Engraving is permanent.',
      suggested: 'Line art · Wood base',
    },
    {
      icon: '★',
      title: 'Wedding / engagement gift',
      tip: 'The couple\'s <b>favourite photo together</b>, engraved at A4 for a statement piece. Looks right on a sideboard or console table.',
      suggested: 'Realistic · A4 · Black',
    },
    {
      icon: '♪',
      title: 'Just-because gift',
      tip: 'The Black base adds a <b>Bluetooth speaker + 7-colour LED</b>. Turns a photo lamp into something people actually switch on every evening.',
      suggested: 'Black base · A5',
    },
  ],
  process_steps: [
    {
      title: 'Upload & style',
      time: 'Free preview',
      desc: 'Upload any clear photo. Flip between Line Art and Realistic Imagery to see both engraving styles live. No payment until you\'re happy with the preview.',
    },
    {
      title: 'Pick base & size',
      time: 'From S$40',
      desc: 'Choose Black (Bluetooth speaker + 7-colour LED), Wood Circle (remote + 7-colour LED) or Wood Rectangle (warm light). A5 bedside size or A4 statement size.',
    },
    {
      title: 'We engrave the acrylic',
      time: 'Next working day',
      desc: 'Laser-engraved into the acrylic panel — not printed, not a sticker. Won\'t fade or scratch off. Every piece inspected before it ships.',
    },
    {
      title: 'Collect or delivery',
      time: 'Next day · SG',
      desc: 'Ready the next working day. Opt for islandwide delivery or collection — pick your preference at checkout.',
    },
  ],
};

const sql = await openSql();
try {
  const [before] = await sql`
    select slug, name,
           jsonb_array_length(coalesce(occasions, '[]'::jsonb)) as occ_count,
           jsonb_array_length(coalesce(process_steps, '[]'::jsonb)) as step_count
      from gift_products
     where slug = 'led-bases'
  `;
  if (!before) { console.log('LED Bases not found'); process.exit(1); }
  console.log('Before:');
  console.log('  name:', before.name);
  console.log('  occasions:', before.occ_count, 'entries');
  console.log('  process_steps:', before.step_count, 'entries');

  await sql`
    update gift_products
       set occasions = ${sql.json(PATCH.occasions)},
           process_steps = ${sql.json(PATCH.process_steps)},
           updated_at = now()
     where slug = 'led-bases'
  `;

  const [after] = await sql`
    select name,
           jsonb_array_length(coalesce(occasions, '[]'::jsonb)) as occ_count,
           jsonb_array_length(coalesce(process_steps, '[]'::jsonb)) as step_count
      from gift_products
     where slug = 'led-bases'
  `;
  console.log('\nAfter:');
  console.log('  name:', after.name);
  console.log('  occasions:', after.occ_count, 'entries');
  console.log('  process_steps:', after.step_count, 'entries');
} finally {
  await sql.end();
}
