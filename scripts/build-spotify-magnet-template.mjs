// Spotify-style fridge-magnet template — one-shot seeder.
//
// Generates the foreground PNG (player UI: heart, progress bar, time
// stamps, 5 control icons + black centre play disc), uploads it to
// product-images storage, then upserts a gift_templates row referencing
// it. The customer's photo lives in the editable hero_photo image
// zone; the song title + artist are editable text zones rendered on
// top of the foreground.
//
// Layer stack at render time (back → front):
//   1. hero_photo image zone  — full bleed, customer-supplied, locked
//   2. foreground_url PNG     — gradient + icons + progress bar
//   3. song_title + artist    — editable text on top of the gradient
//
// Run once:  node scripts/build-spotify-magnet-template.mjs
// Re-runs are idempotent: existing template row is PATCHed, new PNG
// is re-uploaded with a fresh filename so caches don't go stale.

import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// sharp lives in the main repo's node_modules (worktree shares it); use
// it for SVG → PNG since @resvg/resvg-js is in package.json but not
// actually installed.
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

// 100×100 mm magnet. Canvas in 0..200 units (matches the Netflix
// template convention: 1 mm = 2 units). Render to 1000×1000 px PNG so
// printers have ~10 px / mm headroom.
const W = 200;
const H_UNITS = 200;
const PX = 1000;

// Lucide icon paths (24×24 viewBox). Stroked white, no fill, except
// Play (filled white). Wrapped in <g transform> to position + scale.
const ICONS = {
  shuffle: `
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" x2="21" y1="20" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" x2="21" y1="15" y2="21" />
    <line x1="4" x2="9" y1="4" y2="9" />`,
  skipBack: `
    <polygon points="19 20 9 12 19 4 19 20" fill="white" stroke="none" />
    <line x1="5" x2="5" y1="19" y2="5" />`,
  play: `<polygon points="7 4 19 12 7 20 7 4" fill="white" stroke="white" stroke-linejoin="round" />`,
  skipForward: `
    <polygon points="5 4 15 12 5 20 5 4" fill="white" stroke="none" />
    <line x1="19" x2="19" y1="5" y2="19" />`,
  repeat: `
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />`,
  heart: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />`,
};

function icon(name, x, y, sizeUnits = 14, strokeWidth = 2) {
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
      <stop offset="0.45" stop-color="#000" stop-opacity="0.35" />
      <stop offset="1" stop-color="#000" stop-opacity="0.6" />
    </linearGradient>
  </defs>

  <!-- Bottom band gradient — keeps title / artist / icons readable
       on light photos. Spans the lower ~45% of the canvas. -->
  <rect x="0" y="110" width="${W}" height="${H_UNITS - 110}" fill="url(#bandGrad)" />

  <!-- Heart (top-right) -->
  ${icon('heart', 180, 18, 14, 1.8)}

  <!-- Time stamps -->
  <text x="10" y="166" font-family="Inter, system-ui, sans-serif" font-size="4" font-weight="500"
        fill="white" fill-opacity="0.85" text-anchor="start">0:01</text>
  <text x="190" y="166" font-family="Inter, system-ui, sans-serif" font-size="4" font-weight="500"
        fill="white" fill-opacity="0.85" text-anchor="end">-3:41</text>

  <!-- Progress bar: faint full track + bright filled head + dot -->
  <line x1="10" y1="171" x2="190" y2="171" stroke="white" stroke-opacity="0.35" stroke-width="0.8" stroke-linecap="round" />
  <line x1="10" y1="171" x2="14" y2="171" stroke="white" stroke-width="1.1" stroke-linecap="round" />
  <circle cx="14" cy="171" r="1.6" fill="white" />

  <!-- Bottom control row -->
  ${icon('shuffle', 22, 187, 11, 1.6)}
  ${icon('skipBack', 60, 187, 13, 1.6)}

  <!-- Centre play disc — solid black, thin white border, white play arrow -->
  <circle cx="100" cy="187" r="11" fill="#0a0a0a" stroke="white" stroke-width="1.2" />
  <g transform="translate(94.5, 181.5) scale(0.46)" fill="white" stroke="none">
    <polygon points="3 0 15 6 3 12" />
  </g>

  ${icon('skipForward', 140, 187, 13, 1.6)}
  ${icon('repeat', 178, 187, 11, 1.6)}
</svg>`;

const png = await sharp(Buffer.from(svg)).resize(PX, PX).png().toBuffer();
console.log(`✓ Rendered foreground PNG (${png.length.toLocaleString()} bytes)`);

// Upload to product-images bucket via Supabase storage REST.
const filename = `gift-template-spotify-magnet-fg-${Date.now()}.png`;
const upRes = await fetch(`${BASE}/storage/v1/object/product-images/${filename}`, {
  method: 'POST',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'image/png' },
  body: png,
});
if (!upRes.ok) throw new Error(`Storage upload: ${upRes.status} ${await upRes.text()}`);
const foregroundUrl = `${BASE}/storage/v1/object/public/product-images/${filename}`;
console.log(`✓ Uploaded → ${foregroundUrl}`);

// Editable zones. Hero photo locked + full-bleed; song / artist text
// rendered on top of the foreground gradient. mm == units in this
// template (reference dims 100×100, units in 0..200 = 50 mm? — no,
// reference_*_mm tells the renderer the canvas IS the product). Use
// 200 unit canvas == 100 mm canvas, i.e. 1 unit = 0.5 mm. So zone
// dimensions in *_mm halve.
const zones = [
  {
    type: 'image',
    id: 'hero_photo',
    label: 'Photo (full bleed)',
    x_mm: 0, y_mm: 0, width_mm: 100, height_mm: 100,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 4,
    allow_rotate: false,
    allow_zoom: true,
    locked: true,
  },
  {
    type: 'text',
    id: 'song_title',
    label: 'Song title',
    x_mm: 5, y_mm: 65, width_mm: 90, height_mm: 8,
    rotation_deg: 0,
    default_text: 'Beautiful',
    placeholder: 'Song title',
    font_family: 'inter',
    font_size_mm: 6,
    font_weight: '700',
    font_style: 'normal',
    color: '#FFFFFF',
    align: 'left',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1.05,
    letter_spacing_em: -0.01,
    max_chars: 28,
  },
  {
    type: 'text',
    id: 'artist',
    label: 'Artist',
    x_mm: 5, y_mm: 73, width_mm: 90, height_mm: 6,
    rotation_deg: 0,
    default_text: 'Giulio Cercato',
    placeholder: 'Artist name',
    font_family: 'inter',
    font_size_mm: 4,
    font_weight: '400',
    font_style: 'normal',
    color: '#FFFFFF',
    align: 'left',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1.1,
    letter_spacing_em: 0,
    max_chars: 30,
  },
];

const NAME = 'Spotify-style Music Magnet';
const DESCRIPTION =
  'Square 100×100 mm fridge magnet styled like a music-player card. Customer uploads a photo (fills the magnet) and types in a song title + artist. Static UI overlay (heart, progress bar, time stamps, 5 player controls + centre play disc) is baked into the foreground PNG.';

const existingRes = await fetch(
  `${BASE}/rest/v1/gift_templates?name=eq.${encodeURIComponent(NAME)}&select=id`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
);
const existing = (await existingRes.json())[0];

const payload = {
  description: DESCRIPTION,
  thumbnail_url: foregroundUrl,
  background_url: null,
  foreground_url: foregroundUrl,
  zones_json: zones,
  reference_width_mm: 100,
  reference_height_mm: 100,
  display_order: 20,
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
