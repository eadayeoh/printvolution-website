// Netflix Photo Frame — re-anchor to A3 (297 × 420 mm) so the product
// sits naturally in the A-series size ladder. A-series aspect ratio is
// 1:√2, so A3 → A4 → A5 → A6 all scale uniformly; the composite
// engine can just multiply zone coords by (variant_dim / 297) on X
// and (variant_dim / 420) on Y with no distortion.
//
// What changes:
//   • products.width_mm  200 → 297
//   • products.height_mm 250 → 420
//   • zones_json re-laid-out for the taller A3 canvas (my earlier
//     200×250 zone coords would've mis-placed on A-series because
//     the aspect ratios differ — 4:5 vs 1:√2)
//
// Note: this is authoring-side only. The customer size picker and
// composite engine to render at A4 / A5 / A6 are still separate work.

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

const NETFLIX_FRAME_PRODUCT_ID = '14a2fd6c-c43b-4848-b6f7-da93b6e8c10d';
const TEMPLATE_ID              = 'b1500449-789d-45ae-9d6e-6cd632e49fc2';

// -----------------------------------------------------------------------------
// 1. Product reference dims → A3
// -----------------------------------------------------------------------------
{
  const r = await fetch(`${BASE}/rest/v1/gift_products?id=eq.${NETFLIX_FRAME_PRODUCT_ID}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ width_mm: 297, height_mm: 420 }),
  });
  if (!r.ok) throw new Error(`PATCH product: ${r.status} ${await r.text()}`);
  console.log('✓ Netflix Photo Frame dims → 297 × 420 mm (A3)');
}

// -----------------------------------------------------------------------------
// 2. Re-laid-out zones for A3 portrait (297 × 420)
//    Layout plan, origin top-left in mm:
//      Hero photo          : 0, 0            → 297 × 280   (top 67% of canvas)
//      SERIES label        : centred, y=287  → 40 × 7
//      Main title          : centred, y=296  → 237 × 28
//      Genre tags          : centred, y=328  → 217 × 7
//      Scenes heading      : left,    y=342  → 160 × 7     (left of thumb strip)
//      Scene thumbs (×4)   : y=352   → 62 × 47 each, 6 mm gutter, 15 mm margins
// -----------------------------------------------------------------------------
const zones = [
  {
    type: 'image',
    id: 'hero_photo',
    label: 'Hero photo (top)',
    x_mm: 0, y_mm: 0, width_mm: 297, height_mm: 280,
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
    x_mm: 128, y_mm: 287, width_mm: 40, height_mm: 7,
    rotation_deg: 0,
    default_text: 'SERIES',
    placeholder: 'SERIES or MOVIE',
    font_family: 'inter',
    font_size_mm: 5,
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
    x_mm: 30, y_mm: 296, width_mm: 237, height_mm: 28,
    rotation_deg: 0,
    default_text: 'my best day',
    placeholder: 'Your series title',
    font_family: 'playfair',
    font_size_mm: 24,
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
    x_mm: 40, y_mm: 328, width_mm: 217, height_mm: 7,
    rotation_deg: 0,
    default_text: 'Romantic • Lovely • Comedy • Exciting',
    placeholder: 'Tag 1 • Tag 2 • Tag 3 • Tag 4',
    font_family: 'inter',
    font_size_mm: 4.5,
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
    x_mm: 15, y_mm: 342, width_mm: 160, height_mm: 7,
    rotation_deg: 0,
    default_text: 'Scenes From Content',
    placeholder: 'Scenes From Content',
    font_family: 'inter',
    font_size_mm: 5,
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
    x_mm: 15, y_mm: 352, width_mm: 62, height_mm: 47,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 3,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image',
    id: 'scene_2',
    label: 'Scene 2',
    x_mm: 83, y_mm: 352, width_mm: 62, height_mm: 47,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 3,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image',
    id: 'scene_3',
    label: 'Scene 3',
    x_mm: 151, y_mm: 352, width_mm: 62, height_mm: 47,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 3,
    allow_rotate: false, allow_zoom: true,
  },
  {
    type: 'image',
    id: 'scene_4',
    label: 'Scene 4',
    x_mm: 219, y_mm: 352, width_mm: 62, height_mm: 47,
    rotation_deg: 0, fit_mode: 'cover', border_radius_mm: 3,
    allow_rotate: false, allow_zoom: true,
  },
];

// Sanity check: the thumb strip must fit inside 297 mm
//   left margin 15 + 4×62 + 3×6 gutters + right margin 15 = 296 → fits with 1 mm slack
const thumbExtent = 15 + 4 * 62 + 3 * 6 + 15;
console.log(`  thumb-strip extent: ${thumbExtent} mm (canvas 297)`);
if (thumbExtent > 297) throw new Error('Thumb strip overflow');

{
  const r = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${TEMPLATE_ID}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ zones_json: zones }),
  });
  if (!r.ok) throw new Error(`PATCH template: ${r.status} ${await r.text()}`);
  console.log('✓ My Best Day template zones re-anchored to A3');
}

console.log('\nDone. Customer size picker + composite engine for A4/A5/A6 output still pending.');
