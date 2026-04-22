// Netflix template — drop picsum placeholder URLs onto every image
// zone's default_image_url so the editor previews a realistic-looking
// composite out of the box. Admin can replace each one later via the
// per-zone Default image upload.
//
// picsum.photos is CSP-allowed (next.config img-src) + its `/seed/*`
// endpoint returns deterministic images per seed, so the same seed
// always shows the same photo.

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

// Seed-per-zone so each slot shows a distinct, deterministic image.
// Aspect ratios chosen to match the zones (hero is wide, thumbs are
// landscape-ish) so picsum crops sensibly.
const PLACEHOLDERS = {
  hero_photo: 'https://picsum.photos/seed/pv-netflix-hero/1200/800',
  scene_1:    'https://picsum.photos/seed/pv-netflix-s1/600/450',
  scene_2:    'https://picsum.photos/seed/pv-netflix-s2/600/450',
  scene_3:    'https://picsum.photos/seed/pv-netflix-s3/600/450',
  scene_4:    'https://picsum.photos/seed/pv-netflix-s4/600/450',
};

const r0 = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${TEMPLATE_ID}&select=zones_json`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const { zones_json: zones } = (await r0.json())[0];

let updated = 0;
const nextZones = zones.map((z) => {
  if (z.type !== 'text' && PLACEHOLDERS[z.id]) {
    updated++;
    return { ...z, default_image_url: PLACEHOLDERS[z.id] };
  }
  return z;
});

const r = await fetch(`${BASE}/rest/v1/gift_templates?id=eq.${TEMPLATE_ID}`, {
  method: 'PATCH',
  headers: H,
  body: JSON.stringify({ zones_json: nextZones }),
});
if (!r.ok) throw new Error(await r.text());
console.log(`✓ default_image_url set on ${updated} image zone${updated === 1 ? '' : 's'}`);
