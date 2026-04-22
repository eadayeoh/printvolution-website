// My Best Day — redo the vertical rhythm so it doesn't feel squashed
// on A3 portrait. Previous layout packed 4 text zones into a 15%
// strip between hero and thumbs; this version gives the title room
// to breathe and the thumbs room to look like thumbs.
//
// Canvas layout (0–200, A3 portrait reference):
//   Hero photo     0 .. 120   (60% of canvas — matches the ref image)
//   Title band     122 .. 152 (15% — SERIES + main title + tags)
//   Scenes band    152 .. 200 (25% — heading + 4 thumbs)
//
// Thumb size 44 × 30 (aspect ~1.47 — closer to Netflix cover ratio),
// 8-unit side margins, 2-unit gutters; total width 198 (2 slack).

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
  // --- Hero ---
  {
    type: 'image',
    id: 'hero_photo',
    label: 'Hero photo (top)',
    x_mm: 0, y_mm: 0, width_mm: 200, height_mm: 120,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 0,
    allow_rotate: false,
    allow_zoom: true,
  },

  // --- Title band (mid) ---
  {
    type: 'text',
    id: 'series_label',
    label: 'Series label',
    x_mm: 85, y_mm: 124, width_mm: 30, height_mm: 5,
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
  {
    type: 'text',
    id: 'main_title',
    label: 'Main title',
    x_mm: 20, y_mm: 130, width_mm: 160, height_mm: 20,
    rotation_deg: 0,
    default_text: 'my best day',
    placeholder: 'Your series title',
    font_family: 'playfair',
    font_size_mm: 16,
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
    x_mm: 25, y_mm: 151, width_mm: 150, height_mm: 4,
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

  // --- Scenes band (bottom) ---
  {
    type: 'text',
    id: 'scenes_heading',
    label: 'Scenes heading',
    x_mm: 8, y_mm: 157, width_mm: 100, height_mm: 4,
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
  {
    type: 'image', id: 'scene_1', label: 'Scene 1',
    x_mm: 8, y_mm: 164, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image', id: 'scene_2', label: 'Scene 2',
    x_mm: 54, y_mm: 164, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image', id: 'scene_3', label: 'Scene 3',
    x_mm: 100, y_mm: 164, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image', id: 'scene_4', label: 'Scene 4',
    x_mm: 146, y_mm: 164, width_mm: 44, height_mm: 30,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 2,
    allow_rotate: false, allow_zoom: true,
  },
];

for (const z of zones) {
  const r = z.x_mm + z.width_mm;
  const b = z.y_mm + z.height_mm;
  if (z.x_mm < 0 || z.y_mm < 0 || r > 200 || b > 200) {
    throw new Error(`Zone ${z.id} escapes canvas: x=${z.x_mm} y=${z.y_mm} r=${r} b=${b}`);
  }
}
console.log(`Sanity: all ${zones.length} zones fit 0..200 on both axes.`);
const bandHero    = '0 .. 120';
const bandTitle   = `${zones[1].y_mm} .. ${zones[3].y_mm + zones[3].height_mm}`;
const bandScenes  = `${zones[4].y_mm} .. ${zones[5].y_mm + zones[5].height_mm}`;
console.log(`  hero band:   ${bandHero}  (60%)`);
console.log(`  title band:  ${bandTitle}`);
console.log(`  scenes band: ${bandScenes}`);

const r = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${TEMPLATE_ID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ zones_json: zones }),
});
if (!r.ok) throw new Error(await r.text());
console.log('✓ zones updated — reload the editor.');
