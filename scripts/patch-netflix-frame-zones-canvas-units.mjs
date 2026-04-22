// Netflix Photo Frame — rewrite zones in the 0–200 canvas-unit system
// the editor actually uses. The `_mm` suffix on zone fields is a
// naming holdover; the editor renders zones on a fixed 0–200 canvas
// and the product's real mm dims come in at render time.
//
// Hero-photo-only preview was the clue: with A3 mm coords (297×420)
// all other zones fell outside the 0–200 canvas and weren't drawn.
//
// Layout, at A3-portrait aspect but expressed in 0–200 canvas units:
//
//   Hero photo          0, 0                  → 200 × 135    (top 67%)
//   SERIES label        x=85  y=137           → 30 × 4
//   Main title          x=20  y=141           → 160 × 13     (playfair italic)
//   Genre tags          x=25  y=155           → 150 × 4
//   Scenes heading      x=8   y=161           → 100 × 4
//   Scene thumbs (×4)   y=166, w=44, h=30, margins 8, gutters 2
//     scene_1  x=8     scene_2  x=54
//     scene_3  x=100   scene_4  x=146
//
// Font sizes also expressed in canvas units. At A3 render (420 mm
// tall) a font_size of 11 canvas units = 11/200 × 420 = ~23 mm — the
// same intent as the original 24 mm draft.

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

const zones = [
  {
    type: 'image',
    id: 'hero_photo',
    label: 'Hero photo (top)',
    x_mm: 0, y_mm: 0, width_mm: 200, height_mm: 135,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 0,
    allow_rotate: false,
    allow_zoom: true,
  },
  {
    type: 'text',
    id: 'series_label',
    label: 'Series label',
    x_mm: 85, y_mm: 137, width_mm: 30, height_mm: 4,
    rotation_deg: 0,
    default_text: 'SERIES',
    placeholder: 'SERIES or MOVIE',
    font_family: 'inter',
    font_size_mm: 2.5,
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
  {
    type: 'text',
    id: 'main_title',
    label: 'Main title',
    x_mm: 20, y_mm: 141, width_mm: 160, height_mm: 13,
    rotation_deg: 0,
    default_text: 'my best day',
    placeholder: 'Your series title',
    font_family: 'playfair',
    font_size_mm: 11,
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
  {
    type: 'text',
    id: 'genre_tags',
    label: 'Genre tags',
    x_mm: 25, y_mm: 155, width_mm: 150, height_mm: 4,
    rotation_deg: 0,
    default_text: 'Romantic • Lovely • Comedy • Exciting',
    placeholder: 'Tag 1 • Tag 2 • Tag 3 • Tag 4',
    font_family: 'inter',
    font_size_mm: 2.2,
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
  {
    type: 'text',
    id: 'scenes_heading',
    label: 'Scenes heading',
    x_mm: 8, y_mm: 161, width_mm: 100, height_mm: 4,
    rotation_deg: 0,
    default_text: 'Scenes From Content',
    placeholder: 'Scenes From Content',
    font_family: 'inter',
    font_size_mm: 2.5,
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
  {
    type: 'image',
    id: 'scene_1',
    label: 'Scene 1',
    x_mm: 8, y_mm: 166, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image',
    id: 'scene_2',
    label: 'Scene 2',
    x_mm: 54, y_mm: 166, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image',
    id: 'scene_3',
    label: 'Scene 3',
    x_mm: 100, y_mm: 166, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image',
    id: 'scene_4',
    label: 'Scene 4',
    x_mm: 146, y_mm: 166, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
];

// Sanity: all zones must sit inside 0..200 on both axes.
for (const z of zones) {
  const r = z.x_mm + z.width_mm;
  const b = z.y_mm + z.height_mm;
  if (z.x_mm < 0 || z.y_mm < 0 || r > 200 || b > 200) {
    throw new Error(`Zone "${z.id}" escapes canvas: x=${z.x_mm}, y=${z.y_mm}, right=${r}, bottom=${b}`);
  }
}
console.log(`Sanity check: all ${zones.length} zones fit inside 0–200 canvas`);

const r = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${TEMPLATE_ID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ zones_json: zones }),
});
if (!r.ok) throw new Error(`PATCH: ${r.status} ${await r.text()}`);
console.log('✓ My Best Day zones rewritten in 0–200 canvas units');
console.log('  Reload /admin/gifts/templates/' + TEMPLATE_ID + ' — all 9 zones should show.');
