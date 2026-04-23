// Netflix template — swap picsum placeholders (random, often land-
// scapes or abstracts) for face-portrait placeholders from
// randomuser.me. randomuser.me serves stable, deterministic URLs for
// solo portraits at /api/portraits/{gender}/{1..99}.jpg — free, no
// auth, no rate limits for reasonable use.
//
// The photos are solo portraits (not couples), but the user asked for
// "face photos" so layouts are instantly eyeballable.

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

// Deterministic portrait URLs — one per zone.
const PLACEHOLDERS = {
  hero_photo: 'https://randomuser.me/api/portraits/women/44.jpg',
  scene_1:    'https://randomuser.me/api/portraits/men/32.jpg',
  scene_2:    'https://randomuser.me/api/portraits/women/78.jpg',
  scene_3:    'https://randomuser.me/api/portraits/men/65.jpg',
  scene_4:    'https://randomuser.me/api/portraits/women/12.jpg',
};

const r0 = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${TEMPLATE_ID}&select=zones_json`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const { zones_json: zones } = (await r0.json())[0];

let touched = 0;
const next = zones.map((z) => {
  if (z.type !== 'text' && PLACEHOLDERS[z.id]) {
    touched++;
    return { ...z, default_image_url: PLACEHOLDERS[z.id] };
  }
  return z;
});

const r = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${TEMPLATE_ID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ zones_json: next }),
});
if (!r.ok) throw new Error(await r.text());
console.log(`✓ Updated ${touched} zones with randomuser.me face portraits`);
