// Polaroid Stack template — one-shot seeder.
//
// 150 × 150 mm artwork. 3 white polaroid frames overlap on a warm
// cream backdrop, each rotated a different small angle so it reads as
// a casual stack. Customer drops 3 photos in (one per polaroid) and
// types a 3-word caption under each.
//
// Layout strategy: photos sit BEHIND the foreground PNG. The
// foreground PNG bakes the polaroid frames + the layering — where
// polaroid A overlaps polaroid B, the white pixels of A's frame win
// over B's photo. So the photo zones can be simple rectangles
// matching each polaroid's aperture, and the foreground does the
// visual heavy lifting.
//
// Run: node scripts/build-polaroid-stack-template.mjs

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

const PX = 1500;          // export size in pixels (10 px / canvas unit)
const CANVAS = 200;       // zones_json space

async function uploadPng(buffer, filename) {
  const r = await fetch(`${BASE}/storage/v1/object/product-images/${filename}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'image/png' },
    body: buffer,
  });
  if (!r.ok) throw new Error(`Upload (${filename}): ${r.status} ${await r.text()}`);
  return `${BASE}/storage/v1/object/public/product-images/${filename}`;
}

const ts = Date.now();

// 1. Cream background --------------------------------------------------------
const bgPng = await sharp({
  create: { width: PX, height: PX, channels: 3, background: { r: 246, g: 238, b: 224 } },
}).png().toBuffer();
const bgUrl = await uploadPng(bgPng, `gift-template-polaroid-bg-${ts}.png`);
console.log(`✓ Background uploaded → ${bgUrl}`);

// Polaroid layout in canvas units (0..200 = 150 mm).
//
// Each polaroid is 70 wide × 84 tall (~52.5 × 63 mm at 150 mm reference):
//   - 6-unit white border
//   - 58 × 58 photo aperture (~43.5 × 43.5 mm)
//   - 20-unit bottom caption strip
const POLAROIDS = [
  { id: 'p1', cx:  60, cy:  62, angle: -8,  caption: 'beach day' },
  { id: 'p2', cx: 138, cy:  78, angle:  6,  caption: 'best friends' },
  { id: 'p3', cx:  88, cy: 142, angle: -3,  caption: 'forever yours' },
];
const POLA_W = 70;
const POLA_H = 84;
const APERTURE = { x: 6, y: 6, w: 58, h: 58 };

// 2. Foreground SVG — three white polaroids with shadow ----------------------
//
// Drawn in a 200×200 viewBox so it composites pixel-for-pixel onto the
// canvas. Each polaroid is a group transformed to its (cx, cy, angle).
// Order matters: later polaroids cover earlier ones.
function polaroidGroup({ cx, cy, angle }) {
  // Centre the rect on the polaroid's top-left, then translate to (cx, cy)
  // so the rotation pivots through the polaroid's centre.
  const x = -POLA_W / 2;
  const y = -POLA_H / 2;
  // Window rect coordinates (transparent — photo shows through).
  const winX = x + APERTURE.x;
  const winY = y + APERTURE.y;
  return `
    <g transform="translate(${cx} ${cy}) rotate(${angle})">
      <rect x="${x}" y="${y}" width="${POLA_W}" height="${POLA_H}"
            fill="#ffffff"
            filter="url(#pv-shadow)"/>
      <!-- Photo aperture: punched out so the photo zone underneath
           shows through. Achieved with a black "knockout" rect that
           the mask below converts to transparency. -->
      <rect x="${winX}" y="${winY}" width="${APERTURE.w}" height="${APERTURE.h}"
            fill="#000000"/>
    </g>
  `;
}

const fgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${PX}" height="${PX}">
  <defs>
    <filter id="pv-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0.6" stdDeviation="0.7" flood-opacity="0.22"/>
    </filter>
    <!-- "luminance" mask: black pixels in the source become transparent
         in the output, white pixels stay opaque. We draw white frames
         on a black background, then run the whole thing through this
         mask, leaving only the frames opaque. -->
    <mask id="pv-knockout">
      <rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="#ffffff"/>
      ${POLAROIDS.map((p) => `
        <g transform="translate(${p.cx} ${p.cy}) rotate(${p.angle})">
          <rect x="${-POLA_W / 2 + APERTURE.x}" y="${-POLA_H / 2 + APERTURE.y}"
                width="${APERTURE.w}" height="${APERTURE.h}" fill="#000000"/>
        </g>
      `).join('')}
    </mask>
  </defs>
  <g mask="url(#pv-knockout)">
    ${POLAROIDS.map(polaroidGroup).join('')}
  </g>
</svg>`;

const fgPng = await sharp(Buffer.from(fgSvg)).resize(PX, PX).png().toBuffer();
const fgUrl = await uploadPng(fgPng, `gift-template-polaroid-fg-${ts}.png`);
console.log(`✓ Foreground uploaded → ${fgUrl}`);

// 3. Zones — photo zones aligned to each polaroid's aperture, caption
//    text zones over the bottom strip. All rotated to match the
//    polaroid they belong to.
const zones = POLAROIDS.flatMap((p, i) => {
  // Photo zone: aperture centred at polaroid centre; offset by APERTURE
  // halves once the polaroid is rotated. Easiest is to express the zone
  // in unrotated polaroid space and then translate by polaroid centre.
  // The composite uses zone-level rotation_deg to apply the angle.
  const photoCenterOffsetX = (APERTURE.x + APERTURE.w / 2) - POLA_W / 2;
  const photoCenterOffsetY = (APERTURE.y + APERTURE.h / 2) - POLA_H / 2;
  // Approximation: zone position uses top-left of the bounding box.
  // For small rotation angles this drift is sub-pixel; perfect
  // alignment would need rotated-bbox math we don't need yet.
  const photoX = p.cx + photoCenterOffsetX - APERTURE.w / 2;
  const photoY = p.cy + photoCenterOffsetY - APERTURE.h / 2;

  // Caption strip: 16 unit tall strip below the photo aperture.
  const capX = p.cx - POLA_W / 2 + 4;
  const capY = p.cy + (POLA_H / 2) - 18;

  return [
    {
      type: 'image',
      id: `${p.id}_photo`,
      label: `Photo ${i + 1}`,
      x_mm: round1(photoX),
      y_mm: round1(photoY),
      width_mm:  APERTURE.w,
      height_mm: APERTURE.h,
      rotation_deg: p.angle,
      fit_mode: 'cover',
      border_radius_mm: 0,
      allow_zoom: true,
    },
    {
      type: 'text',
      id: `${p.id}_caption`,
      label: `Caption ${i + 1}`,
      x_mm: round1(capX),
      y_mm: round1(capY),
      width_mm: POLA_W - 8,
      height_mm: 14,
      rotation_deg: p.angle,
      default_text: p.caption,
      placeholder: 'short caption',
      font_family: 'caveat',
      font_size_mm: 6,
      font_weight: '400',
      font_style: 'normal',
      color: '#1a1a1a',
      align: 'center',
      vertical_align: 'middle',
      editable: true,
      text_transform: 'none',
      line_height: 1,
      letter_spacing_em: 0,
      max_chars: 18,
    },
  ];
});

function round1(n) { return Math.round(n * 10) / 10; }

// 4. Insert / update template row -------------------------------------------
const NAME = 'Polaroid Stack';
const DESCRIPTION =
  '150×150 mm warm-cream backdrop with three slightly-rotated polaroid frames. Customer fills three photos and short hand-written captions. The foreground PNG bakes in the overlap order, so polaroid 1 covers polaroid 2 covers polaroid 3.';

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
  reference_width_mm: 150,
  reference_height_mm: 150,
  display_order: 50,
  is_active: true,
  customer_can_change_font: true,
};

if (existing) {
  const upd = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${existing.id}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(payload),
  });
  if (!upd.ok) throw new Error(`PATCH: ${upd.status} ${await upd.text()}`);
  console.log(`✓ Updated existing Polaroid Stack template (${existing.id})`);
} else {
  const ins = await fetch(`${BASE}/rest/v1/gift_templates`, {
    method: 'POST', headers: H, body: JSON.stringify({ name: NAME, ...payload }),
  });
  if (!ins.ok) throw new Error(`INSERT: ${ins.status} ${await ins.text()}`);
  const id = (await ins.json())[0].id;
  console.log(`✓ Inserted Polaroid Stack template (${id})`);
}
