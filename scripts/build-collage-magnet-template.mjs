// 4-photo collage music-magnet template — one-shot seeder.
//
// Square 100×100 mm magnet. Black background, white frame around a
// 2×2 photo collage where the bottom-right tile is heart-masked, then
// names, date, song title, artist + the same player-UI chrome family
// as the music + calendar magnet templates. Spotify scannable code +
// brand logo from the reference are intentionally NOT seeded — admin
// asked for the layout without them.
//
// Three assets generated and uploaded:
//   - background PNG: solid black 200×200 (sits below the photos)
//   - heart-mask PNG: white heart on transparent (mask_url for the
//     bottom-right photo zone)
//   - foreground PNG: white frame border + heart icon + time stamps
//     + progress bar + 5 player icons (sits above the photos, below
//     the text zones)
//
// Run: node scripts/build-collage-magnet-template.mjs

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

const W = 200;
const H_UNITS = 200;
const PX = 1000;

async function uploadPng(buffer, filename) {
  const r = await fetch(`${BASE}/storage/v1/object/product-images/${filename}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'image/png' },
    body: buffer,
  });
  if (!r.ok) throw new Error(`Storage upload (${filename}): ${r.status} ${await r.text()}`);
  return `${BASE}/storage/v1/object/public/product-images/${filename}`;
}

// 1. Black background -------------------------------------------------------
const blackPng = await sharp({
  create: { width: PX, height: PX, channels: 3, background: { r: 0, g: 0, b: 0 } },
}).png().toBuffer();
const ts = Date.now();
const bgUrl = await uploadPng(blackPng, `gift-template-collage-magnet-bg-${ts}.png`);
console.log(`✓ Background uploaded → ${bgUrl}`);

// 2. Heart mask -------------------------------------------------------------
//    White heart on transparent. The composite renderer treats this as a
//    mask: photo only shows where the mask is white. Path is centred in
//    a 100×100 viewBox.
const heartMaskSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PX}" height="${PX}" viewBox="0 0 100 100">
  <path d="M 50 92
           C 25 75, 4 55, 4 32
           C 4 12, 22 4, 36 16
           C 42 21, 47 27, 50 32
           C 53 27, 58 21, 64 16
           C 78 4, 96 12, 96 32
           C 96 55, 75 75, 50 92 Z"
        fill="white" />
</svg>`;
const heartMaskPng = await sharp(Buffer.from(heartMaskSvg)).resize(PX, PX).png().toBuffer();
const heartMaskUrl = await uploadPng(heartMaskPng, `gift-template-collage-magnet-heart-${ts}.png`);
console.log(`✓ Heart mask uploaded → ${heartMaskUrl}`);

// 3. Foreground (frame + player UI) ----------------------------------------
//
// Foreground sits ABOVE the photos. Draws:
//   - thin white frame outline around the 4-photo collage
//   - red filled heart icon (the "favourited" indicator, bottom-left)
//   - time stamps "0:01" / "-3:07"
//   - progress bar (white line + dot at the start)
//   - 5 player control icons + centre play disc
//
// Everything else is transparent so photos + text zones underneath
// stay visible.

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

// White frame outline. The actual photos sit inside this rectangle —
// the frame just adds a single-stroke border so the collage reads as a
// "polaroid grid" framed inside the magnet.
const frameSvg = `
  <rect x="14" y="22" width="124" height="118" fill="none"
        stroke="white" stroke-width="0.6" />
`;

// Filled red heart icon (bottom-left, "favourite" glyph).
const heartIconSvg = `
  <g transform="translate(15, 162) scale(0.42)" fill="#ef4444" stroke="none">
    <path d="M 12 21
             C 5.5 16, 0 11, 0 6
             C 0 2, 3 0, 6 1
             C 8 1.5, 10 3, 12 5
             C 14 3, 16 1.5, 18 1
             C 21 0, 24 2, 24 6
             C 24 11, 18.5 16, 12 21 Z" />
  </g>
`;

const fgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PX}" height="${PX}" viewBox="0 0 ${W} ${H_UNITS}">
  ${frameSvg}
  ${heartIconSvg}

  <!-- Time stamps -->
  <text x="10" y="178" font-family="Inter, system-ui, sans-serif" font-size="3.5" font-weight="500"
        fill="white" fill-opacity="0.85" text-anchor="start">0:01</text>
  <text x="190" y="178" font-family="Inter, system-ui, sans-serif" font-size="3.5" font-weight="500"
        fill="white" fill-opacity="0.85" text-anchor="end">-3:07</text>

  <!-- Progress bar: faint full track + bright filled head + dot at the start -->
  <line x1="10" y1="182" x2="190" y2="182" stroke="white" stroke-opacity="0.35" stroke-width="0.7" stroke-linecap="round" />
  <circle cx="10" cy="182" r="1.4" fill="white" />

  <!-- Bottom control row -->
  ${icon('shuffle', 25, 192, 9, 1.4)}
  ${icon('skipBack', 60, 192, 11, 1.4)}

  <!-- Centre play disc — white outline + black fill + white play arrow -->
  <circle cx="100" cy="192" r="9" fill="#000" stroke="white" stroke-width="1.4" />
  <g transform="translate(95.5, 187.5) scale(0.38)" fill="white" stroke="none">
    <polygon points="3 0 15 6 3 12" />
  </g>

  ${icon('skipForward', 140, 192, 11, 1.4)}
  ${icon('repeat', 175, 192, 9, 1.4)}
</svg>`;

const fgPng = await sharp(Buffer.from(fgSvg)).resize(PX, PX).png().toBuffer();
const fgUrl = await uploadPng(fgPng, `gift-template-collage-magnet-fg-${ts}.png`);
console.log(`✓ Foreground uploaded → ${fgUrl}`);

// 4. Zones ------------------------------------------------------------------
//
// 4 image zones (2×2 grid of photos), 4 text zones (names, date, song
// title, artist). Bottom-right photo zone carries the heart mask_url.
const zones = [
  // Names header (script font, top of magnet)
  {
    type: 'text',
    id: 'names',
    label: 'Names',
    x_mm: 10, y_mm: 8, width_mm: 180, height_mm: 14,
    rotation_deg: 0,
    default_text: 'Romeo & Juliet',
    placeholder: 'Name & Name',
    font_family: 'caveat',
    font_size_mm: 9,
    font_weight: '600',
    font_style: 'normal',
    color: '#ffffff',
    align: 'center',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1,
    letter_spacing_em: 0,
    max_chars: 32,
  },

  // Photo collage — 2×2, bottom-right is heart-masked
  {
    type: 'image',
    id: 'photo_top_left',
    label: 'Upload image here',
    x_mm: 18, y_mm: 26, width_mm: 56, height_mm: 54,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 1,
    allow_rotate: false,
    allow_zoom: true,
    locked: false,
    default_image_url: null,
  },
  {
    type: 'image',
    id: 'photo_top_right',
    label: 'Upload image here',
    x_mm: 78, y_mm: 26, width_mm: 56, height_mm: 54,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 1,
    allow_rotate: false,
    allow_zoom: true,
    locked: false,
    default_image_url: null,
  },
  {
    type: 'image',
    id: 'photo_bottom_left',
    label: 'Upload image here',
    x_mm: 18, y_mm: 84, width_mm: 56, height_mm: 54,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 1,
    allow_rotate: false,
    allow_zoom: true,
    locked: false,
    default_image_url: null,
  },
  {
    type: 'image',
    id: 'photo_bottom_right_heart',
    label: 'Upload image here (heart)',
    x_mm: 78, y_mm: 84, width_mm: 56, height_mm: 54,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 0,
    allow_rotate: false,
    allow_zoom: true,
    locked: false,
    default_image_url: null,
    mask_url: heartMaskUrl,
  },

  // Date — sits between the photo collage and the song title
  {
    type: 'text',
    id: 'date',
    label: 'Date',
    x_mm: 10, y_mm: 142, width_mm: 180, height_mm: 8,
    rotation_deg: 0,
    default_text: '05.20.2024',
    placeholder: 'MM.DD.YYYY',
    font_family: 'inter',
    font_size_mm: 4,
    font_weight: '400',
    font_style: 'normal',
    color: '#ffffff',
    align: 'center',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1,
    letter_spacing_em: 0.04,
    max_chars: 24,
  },

  // Song title (bold, centred)
  {
    type: 'text',
    id: 'song_title',
    label: 'Song title',
    x_mm: 10, y_mm: 152, width_mm: 180, height_mm: 12,
    rotation_deg: 0,
    default_text: 'Moonlight',
    placeholder: 'Song title',
    font_family: 'inter',
    font_size_mm: 6,
    font_weight: '700',
    font_style: 'normal',
    color: '#ffffff',
    align: 'center',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1,
    letter_spacing_em: -0.01,
    max_chars: 28,
  },

  // Artist (lighter, centred)
  {
    type: 'text',
    id: 'artist',
    label: 'Artist',
    x_mm: 10, y_mm: 164, width_mm: 180, height_mm: 8,
    rotation_deg: 0,
    default_text: 'Kali Uchis',
    placeholder: 'Artist name',
    font_family: 'inter',
    font_size_mm: 4,
    font_weight: '400',
    font_style: 'normal',
    color: '#ffffff',
    align: 'center',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1,
    letter_spacing_em: 0,
    max_chars: 30,
  },
];

const NAME = 'Music Collage Magnet — 4 Photos';
const DESCRIPTION =
  'Square 100×100 mm fridge magnet. 4-photo collage where the bottom-right tile is heart-masked, with names, anniversary date, song title, and artist over the same Spotify-style player-UI chrome as the other music magnet templates. Spotify scannable code intentionally omitted.';

const existingRes = await fetch(
  `${BASE}/rest/v1/gift_templates?name=eq.${encodeURIComponent(NAME)}&select=id`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
);
const existing = (await existingRes.json())[0];

const payload = {
  description: DESCRIPTION,
  thumbnail_url: null,
  background_url: bgUrl,
  foreground_url: fgUrl,
  zones_json: zones,
  reference_width_mm: 100,
  reference_height_mm: 100,
  display_order: 40,
  is_active: true,
  customer_can_recolor: true,
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

// 5. Auto-assign to bluetooth-spotify-magnet --------------------------------
const PRODUCT_ID = '3481c424-8a50-42de-aa80-b9365cf775a9';
const link = await fetch(`${BASE}/rest/v1/gift_product_templates`, {
  method: 'POST',
  headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify({ gift_product_id: PRODUCT_ID, template_id: templateId, display_order: 2 }),
});
console.log(`✓ Linked to bluetooth-spotify-magnet  (${link.status})`);

console.log(`\nDone. Template id: ${templateId}`);
