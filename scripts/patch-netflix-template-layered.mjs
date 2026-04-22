// Netflix My Best Day template — redesigned as a proper LAYERED
// composite to match the reference movie-poster look.
//
// Layer stacking (array order, earliest = back, latest = front):
//   1. hero_photo          — full-bleed 0..200 on both axes (locked)
//   2. series_label        — overlaid on hero
//   3. main_title          — overlaid on hero
//   4. genre_tags          — overlaid on hero
//   5. scenes_heading      — overlaid on hero's bottom band
//   6. scene_1..scene_4    — overlaid on hero's bottom band
//
// The dark gradient behind the lower third (which makes the white
// text readable on light photos) lives on the template's
// foreground_url upload — admin drops in a 1:√2 PNG with a transparent
// top and a bottom-to-black gradient, and it layers between hero and
// text via the template renderer.
//
// hero_photo is locked by default so admins editing the scene strip
// or text on top can't accidentally bump the full-bleed background.

import fs from 'node:fs';

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

const TEMPLATE_ID = 'b1500449-789d-45ae-9d6e-6cd632e49fc2';

// All positions in 0..200 canvas units. A3 portrait reference means
// 200 units on X ≈ 297 mm, and 200 units on Y ≈ 420 mm when rendered.
const zones = [
  // 1. Hero — full canvas, locked so the admin can't nudge it.
  {
    type: 'image',
    id: 'hero_photo',
    label: 'Hero photo (full bleed)',
    x_mm: 0, y_mm: 0, width_mm: 200, height_mm: 200,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 0,
    allow_rotate: false,
    allow_zoom: true,
    locked: true,
  },

  // 2. SERIES/MOVIE label (overlaid on hero, roughly 60% down)
  {
    type: 'text',
    id: 'series_label',
    label: 'Series label',
    x_mm: 85, y_mm: 118, width_mm: 30, height_mm: 5,
    rotation_deg: 0,
    default_text: 'SERIES',
    placeholder: 'SERIES or MOVIE',
    font_family: 'inter',
    font_size_mm: 3,
    font_weight: '700',
    font_style: 'normal',
    color: '#E50914',
    align: 'center',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'uppercase',
    line_height: 1,
    letter_spacing_em: 0.2,
    max_chars: 10,
  },

  // 3. Main title (big script, overlaid just below the series label)
  {
    type: 'text',
    id: 'main_title',
    label: 'Main title',
    x_mm: 20, y_mm: 125, width_mm: 160, height_mm: 22,
    rotation_deg: 0,
    default_text: 'my best day',
    placeholder: 'Your series title',
    font_family: 'playfair',
    font_size_mm: 17,
    font_weight: '700',
    font_style: 'italic',
    color: '#ffffff',
    align: 'center',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1,
    letter_spacing_em: 0,
    max_chars: 40,
  },

  // 4. Genre tags (small line under the title)
  {
    type: 'text',
    id: 'genre_tags',
    label: 'Genre tags',
    x_mm: 25, y_mm: 148, width_mm: 150, height_mm: 4,
    rotation_deg: 0,
    default_text: 'Romantic • Lovely • Comedy • Exciting',
    placeholder: 'Tag 1 • Tag 2 • Tag 3 • Tag 4',
    font_family: 'inter',
    font_size_mm: 2.5,
    font_weight: '400',
    font_style: 'normal',
    color: '#ffffff',
    align: 'center',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1,
    letter_spacing_em: 0.04,
    max_chars: 80,
  },

  // 5. Scenes heading — white bold label above the thumb strip
  {
    type: 'text',
    id: 'scenes_heading',
    label: 'Scenes heading',
    x_mm: 8, y_mm: 158, width_mm: 100, height_mm: 4,
    rotation_deg: 0,
    default_text: 'Scenes From Content',
    placeholder: 'Scenes From Content',
    font_family: 'inter',
    font_size_mm: 3.5,
    font_weight: '700',
    font_style: 'normal',
    color: '#ffffff',
    align: 'left',
    vertical_align: 'middle',
    editable: true,
    text_transform: 'none',
    line_height: 1,
    letter_spacing_em: 0,
    max_chars: 40,
  },

  // 6. Scene thumbs — 4 × 44 wide, 30 tall, 8-margin 2-gutter, overlaid
  {
    type: 'image', id: 'scene_1', label: 'Scene 1',
    x_mm: 8, y_mm: 165, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image', id: 'scene_2', label: 'Scene 2',
    x_mm: 54, y_mm: 165, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image', id: 'scene_3', label: 'Scene 3',
    x_mm: 100, y_mm: 165, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image', id: 'scene_4', label: 'Scene 4',
    x_mm: 146, y_mm: 165, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
];

// Every zone must sit inside the 0..200 canvas.
for (const z of zones) {
  const r = z.x_mm + z.width_mm;
  const b = z.y_mm + z.height_mm;
  if (z.x_mm < 0 || z.y_mm < 0 || r > 200 || b > 200) {
    throw new Error(`Zone ${z.id} escapes canvas: x=${z.x_mm} y=${z.y_mm} r=${r} b=${b}`);
  }
}
console.log(`Sanity: all ${zones.length} zones fit the 0..200 canvas.`);
console.log(`Stacking order (back → front):`);
zones.forEach((z, i) => console.log(`  ${i + 1}. ${z.id.padEnd(16)} ${z.type}  ${z.locked ? '🔒' : ''}`));

const r = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${TEMPLATE_ID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ zones_json: zones }),
});
if (!r.ok) throw new Error(await r.text());
console.log('\n✓ Netflix template zones re-laid-out as layered composite.');
console.log('  Reload /admin/gifts/templates/' + TEMPLATE_ID);
