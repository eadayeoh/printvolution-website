// Calendar fridge-magnet template — one-shot seeder.
//
// Square 100×100 mm magnet. Same player-UI chrome as the music magnet
// (so customers recognise the family), but the layout above the
// chrome is photo + names + month-grid:
//
//   ┌──────────────────────────┐
//   │     Ethan ❤ Sunny        │ ← names text zone (script font)
//   │  ┌──────┐  October 2024  │ ← header_layout='above' on the
//   │  │      │  S M T W T F S │   calendar zone
//   │  │ PHOTO│  ...           │
//   │  │      │  ...           │
//   │  └──────┘                │
//   │     [player UI chrome]   │ ← foreground_url (shuffle / prev /
//   └──────────────────────────┘   play disc / next / repeat + bar)
//
// Customer: uploads photo, types two names, picks month/year/day.
// Calendar zone uses heart-shape highlight so the picked date pops.
// The "❤" in the names is just a typed glyph for v1; a separate
// static heart asset is a polish pass.
//
// Run: node scripts/build-calendar-magnet-template.mjs
// Re-runs are idempotent (PATCHes the matching template by name).

import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('/Users/eadayeoh/Desktop/PrintVolution-Tools/node_modules/sharp');

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(
  env.trim().split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }),
);
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL;
const KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=representation',
};

// Player-UI chrome, painted into the bottom 30% of the canvas via a
// transparent foreground PNG. Same icon set + black centre disc as the
// music magnet (modulo a slightly higher placement so the calendar
// fits above).
const W = 200;
const H_UNITS = 200;
const PX = 1000;

const ICONS = {
  shuffle: `<polyline points="16 3 21 3 21 8" /><line x1="4" x2="21" y1="20" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" x2="21" y1="15" y2="21" /><line x1="4" x2="9" y1="4" y2="9" />`,
  skipBack: `<polygon points="19 20 9 12 19 4 19 20" fill="white" stroke="none" /><line x1="5" x2="5" y1="19" y2="5" />`,
  skipForward: `<polygon points="5 4 15 12 5 20 5 4" fill="white" stroke="none" /><line x1="19" x2="19" y1="5" y2="19" />`,
  repeat: `<path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />`,
};

function icon(name, x, y, sizeUnits = 11, strokeWidth = 1.6) {
  const scale = sizeUnits / 24;
  return `
    <g transform="translate(${x - sizeUnits / 2}, ${y - sizeUnits / 2}) scale(${scale})"
       stroke="white" stroke-width="${strokeWidth}" fill="none"
       stroke-linecap="round" stroke-linejoin="round">
      ${ICONS[name]}
    </g>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PX}" height="${PX}" viewBox="0 0 ${W} ${H_UNITS}">
  <defs>
    <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0" />
      <stop offset="0.55" stop-color="#000" stop-opacity="0.55" />
      <stop offset="1" stop-color="#000" stop-opacity="0.85" />
    </linearGradient>
  </defs>

  <!-- Lower band gradient — keeps the player chrome readable on any
       photo / colour underneath. -->
  <rect x="0" y="140" width="${W}" height="${H_UNITS - 140}" fill="url(#bandGrad)" />

  <!-- Progress bar -->
  <line x1="20" y1="172" x2="180" y2="172" stroke="white" stroke-opacity="0.35" stroke-width="0.8" stroke-linecap="round" />
  <circle cx="100" cy="172" r="1.6" fill="white" />

  <!-- Bottom control row -->
  ${icon('shuffle', 30, 188, 11, 1.6)}
  ${icon('skipBack', 65, 188, 13, 1.6)}

  <!-- Centre play disc -->
  <circle cx="100" cy="188" r="11" fill="#0a0a0a" stroke="white" stroke-width="1.2" />
  <g transform="translate(94.5, 182.5) scale(0.46)" fill="white" stroke="none">
    <polygon points="3 0 15 6 3 12" />
  </g>

  ${icon('skipForward', 135, 188, 13, 1.6)}
  ${icon('repeat', 170, 188, 11, 1.6)}
</svg>`;

const png = await sharp(Buffer.from(svg)).resize(PX, PX).png().toBuffer();
console.log(`✓ Rendered foreground PNG (${png.length.toLocaleString()} bytes)`);

const filename = `gift-template-calendar-magnet-fg-${Date.now()}.png`;
const upRes = await fetch(`${BASE}/storage/v1/object/product-images/${filename}`, {
  method: 'POST',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'image/png' },
  body: png,
});
if (!upRes.ok) throw new Error(`Storage upload: ${upRes.status} ${await upRes.text()}`);
const foregroundUrl = `${BASE}/storage/v1/object/public/product-images/${filename}`;
console.log(`✓ Uploaded → ${foregroundUrl}`);

// Layout in 0..200 canvas units (= 100 mm magnet).
// Names header: full width across the top.
// Photo: left ~46% × 90 units tall, sits below the header.
// Calendar: right ~46% × 90 units tall, sits below the header.
// Player chrome: bottom 30% (foreground PNG).
const zones = [
  // 1. Photo (image zone, square, top-left).
  {
    type: 'image',
    id: 'hero_photo',
    label: 'Upload image here',
    x_mm: 8, y_mm: 30, width_mm: 88, height_mm: 90,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 4,
    allow_rotate: false,
    allow_zoom: true,
    locked: false,
    default_image_url: null,
  },
  // 2. Names header — single text zone, customer types "Name ❤ Name".
  {
    type: 'text',
    id: 'names',
    label: 'Names',
    x_mm: 8, y_mm: 10, width_mm: 184, height_mm: 16,
    rotation_deg: 0,
    default_text: 'Ethan \u2665 Sunny',
    placeholder: 'Name \u2665 Name',
    font_family: 'caveat',
    font_size_mm: 10,
    font_weight: '600',
    font_style: 'normal',
    color: '#ffffff',
    align: 'center',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1.0,
    letter_spacing_em: 0,
    max_chars: 32,
  },
  // 3. Calendar — top-right block. Header above grid; heart highlight
  //    on the picked date.
  {
    type: 'calendar',
    id: 'anniversary_calendar',
    label: 'Anniversary calendar',
    x_mm: 100, y_mm: 30, width_mm: 92, height_mm: 90,
    rotation_deg: 0,
    locked: false,
    header_layout: 'above',
    header_font_family: 'inter',
    header_font_size_mm: 5,
    header_font_weight: '700',
    header_color: '#ffffff',
    grid_font_family: 'inter',
    grid_font_size_mm: 4,
    grid_color: '#ffffff',
    week_start: 'sunday',
    highlight_shape: 'heart',
    highlight_fill: '#E91E8C',
    highlight_text_color: '#ffffff',
    default_month: null,       // current month at render time
    default_year: null,
    default_highlighted_day: null,
  },
];

const NAME = 'Calendar Magnet — Anniversary';
const DESCRIPTION =
  'Square 100×100 mm fridge magnet. Customer uploads a photo, types two names with a heart between, and picks a month + day to mark on the auto-generated calendar grid. Same player-UI chrome as the Spotify-style magnet so they read as a family. Heart-shape highlight on the customer-picked date.';

const existingRes = await fetch(
  `${BASE}/rest/v1/gift_templates?name=eq.${encodeURIComponent(NAME)}&select=id`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
);
const existing = (await existingRes.json())[0];

const payload = {
  description: DESCRIPTION,
  thumbnail_url: null,
  background_url: null,
  foreground_url: foregroundUrl,
  zones_json: zones,
  reference_width_mm: 100,
  reference_height_mm: 100,
  display_order: 30,
  is_active: true,
};

let templateId;
if (existing) {
  templateId = existing.id;
  const upd = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${templateId}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(payload),
  });
  if (!upd.ok) throw new Error(`PATCH template: ${upd.status} ${await upd.text()}`);
  console.log(`✓ Updated existing gift_templates row  (${templateId})`);
} else {
  const ins = await fetch(`${BASE}/rest/v1/gift_templates`, {
    method: 'POST', headers: H, body: JSON.stringify({ name: NAME, ...payload }),
  });
  if (!ins.ok) throw new Error(`INSERT template: ${ins.status} ${await ins.text()}`);
  templateId = (await ins.json())[0].id;
  console.log(`✓ Inserted gift_templates row  (${templateId})`);
}

console.log(`\nDone. Assign this template to your fridge-magnet product at`);
console.log(`  /admin/gifts/<product-id>  →  Templates section`);
console.log(`  Template id: ${templateId}`);
