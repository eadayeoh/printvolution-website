// Netflix Photo Frame — add the "My Best Day" template.
//
//   Frame size     : 200 × 250 mm (portrait)
//   Layout model   : Netflix-series cover UI mimic — big hero photo
//                    on the top two-thirds, a dark "Scenes From
//                    Content" band along the bottom with four
//                    thumbnail photos, Netflix chrome (N logo + nav)
//                    baked into the foreground overlay.
//
// Customer inputs (nothing is AI-generated):
//   • 5 photos     : hero + 4 scene thumbnails
//   • 4 text slots : SERIES/MOVIE label, main title, genre tags,
//                    "Scenes From Content" heading
//
// The Netflix red-N logo and the TV Shows / Movies / My List nav line
// are not customer-editable — they live in background_url +
// foreground_url (the admin uploads a rendered PNG of those chrome
// elements later). Until a chrome PNG is uploaded, the layout works
// but the brand elements are missing; that's a one-time designer task.
//
// Fonts are defaults — user said they'll pick fonts later. All zones
// are admin-tweakable via /admin/gifts/templates/[id].

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

// -----------------------------------------------------------------------------
// Zones (mm) — designed against a 200 × 250 canvas
// -----------------------------------------------------------------------------

const zones = [
  // Hero photo — fills top two-thirds of canvas
  {
    type: 'image',
    id: 'hero_photo',
    label: 'Hero photo (top)',
    x_mm: 0,
    y_mm: 0,
    width_mm: 200,
    height_mm: 170,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 0,
    allow_rotate: false,
    allow_zoom: true,
  },

  // SERIES / MOVIE label (small, red, centered above main title)
  {
    type: 'text',
    id: 'series_label',
    label: 'Series label',
    x_mm: 80,
    y_mm: 172,
    width_mm: 40,
    height_mm: 6,
    rotation_deg: 0,
    default_text: 'SERIES',
    placeholder: 'SERIES or MOVIE',
    font_family: 'inter',
    font_size_mm: 4,
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

  // Main title — the big script-style "my best day"
  {
    type: 'text',
    id: 'main_title',
    label: 'Main title',
    x_mm: 20,
    y_mm: 179,
    width_mm: 160,
    height_mm: 22,
    rotation_deg: 0,
    default_text: 'my best day',
    placeholder: 'Your series title',
    font_family: 'playfair',
    font_size_mm: 18,
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

  // Genre tags — the little "Romantic · Lovely · Comedy · Exciting" line
  {
    type: 'text',
    id: 'genre_tags',
    label: 'Genre tags',
    x_mm: 20,
    y_mm: 202,
    width_mm: 160,
    height_mm: 5,
    rotation_deg: 0,
    default_text: 'Romantic • Lovely • Comedy • Exciting',
    placeholder: 'Tag 1 • Tag 2 • Tag 3 • Tag 4',
    font_family: 'inter',
    font_size_mm: 3.2,
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

  // "Scenes From Content" section heading — small white bold text,
  // left aligned above the thumbnail row
  {
    type: 'text',
    id: 'scenes_heading',
    label: 'Scenes heading',
    x_mm: 12,
    y_mm: 208,
    width_mm: 120,
    height_mm: 5,
    rotation_deg: 0,
    default_text: 'Scenes From Content',
    placeholder: 'Scenes From Content',
    font_family: 'inter',
    font_size_mm: 4,
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

  // Four scene thumbnails — rounded corners, cover-fitted, evenly spaced
  {
    type: 'image',
    id: 'scene_1',
    label: 'Scene 1',
    x_mm: 12,
    y_mm: 214,
    width_mm: 42,
    height_mm: 32,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 2,
    allow_rotate: false,
    allow_zoom: true,
  },
  {
    type: 'image',
    id: 'scene_2',
    label: 'Scene 2',
    x_mm: 57,
    y_mm: 214,
    width_mm: 42,
    height_mm: 32,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 2,
    allow_rotate: false,
    allow_zoom: true,
  },
  {
    type: 'image',
    id: 'scene_3',
    label: 'Scene 3',
    x_mm: 102,
    y_mm: 214,
    width_mm: 42,
    height_mm: 32,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 2,
    allow_rotate: false,
    allow_zoom: true,
  },
  {
    type: 'image',
    id: 'scene_4',
    label: 'Scene 4',
    x_mm: 146,
    y_mm: 214,
    width_mm: 42,
    height_mm: 32,
    rotation_deg: 0,
    fit_mode: 'cover',
    border_radius_mm: 2,
    allow_rotate: false,
    allow_zoom: true,
  },
];

// -----------------------------------------------------------------------------
// 1. Insert the template row. Look-and-match on name so re-runs are safe.
// -----------------------------------------------------------------------------
const NAME = 'My Best Day — Netflix Series Cover';

const existingRes = await fetch(
  `${BASE}/rest/v1/gift_templates?name=eq.${encodeURIComponent(NAME)}&select=id`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
);
const existing = (await existingRes.json())[0];

let templateId;
if (existing) {
  templateId = existing.id;
  const upd = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${templateId}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({
      description:
        'Netflix series-cover layout. Hero photo up top, SERIES/MOVIE label + script title + genre tags in the mid band, "Scenes From Content" strip with 4 thumbnails at the bottom. Upload the Netflix N + nav chrome as foreground_url when ready.',
      zones_json: zones,
      display_order: 10,
      is_active: true,
    }),
  });
  if (!upd.ok) throw new Error(`PATCH template: ${upd.status} ${await upd.text()}`);
  console.log(`✓ Updated existing gift_templates row  (${templateId})`);
} else {
  const ins = await fetch(`${BASE}/rest/v1/gift_templates`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      name: NAME,
      description:
        'Netflix series-cover layout. Hero photo up top, SERIES/MOVIE label + script title + genre tags in the mid band, "Scenes From Content" strip with 4 thumbnails at the bottom. Upload the Netflix N + nav chrome as foreground_url when ready.',
      thumbnail_url: null,
      background_url: null,
      foreground_url: null,
      zones_json: zones,
      display_order: 10,
      is_active: true,
    }),
  });
  if (!ins.ok) throw new Error(`INSERT template: ${ins.status} ${await ins.text()}`);
  templateId = (await ins.json())[0].id;
  console.log(`✓ Inserted new gift_templates row       (${templateId})`);
}

// -----------------------------------------------------------------------------
// 2. Link the template to the Netflix Photo Frame product
// -----------------------------------------------------------------------------
const linkCheck = await fetch(
  `${BASE}/rest/v1/gift_product_templates?gift_product_id=eq.${NETFLIX_FRAME_PRODUCT_ID}&template_id=eq.${templateId}&select=display_order`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
);
const linkRow = (await linkCheck.json())[0];
if (linkRow) {
  console.log('✓ Template already linked to Netflix Photo Frame');
} else {
  const linkIns = await fetch(`${BASE}/rest/v1/gift_product_templates`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      gift_product_id: NETFLIX_FRAME_PRODUCT_ID,
      template_id: templateId,
      display_order: 0,
    }),
  });
  if (!linkIns.ok) throw new Error(`INSERT link: ${linkIns.status} ${await linkIns.text()}`);
  console.log('✓ Linked template to Netflix Photo Frame product');
}

// -----------------------------------------------------------------------------
// 3. Flip template_mode so the template selector is enabled
// -----------------------------------------------------------------------------
const prodUpd = await fetch(
  `${BASE}/rest/v1/gift_products?id=eq.${NETFLIX_FRAME_PRODUCT_ID}`,
  {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ template_mode: 'optional' }),
  },
);
if (!prodUpd.ok) throw new Error(`PATCH product: ${prodUpd.status} ${await prodUpd.text()}`);
console.log('✓ Netflix Photo Frame template_mode → optional');

console.log('\nTemplate is live.');
console.log('Admin editor: /admin/gifts/templates/' + templateId);
console.log('Product page: /gift/netflix-photo-frame');
console.log('\nNext steps for the designer:');
console.log('  1. Upload a Netflix chrome foreground PNG (N logo + TV Shows / Movies / My List nav + dark scene-band gradient) via the template editor foreground_url field.');
console.log('  2. Fine-tune zone positions if the pixel crop doesn\'t line up.');
console.log('  3. Swap fonts once the final typeface is picked.');
