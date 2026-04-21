// Seed the four default pipelines (one per mode) and backfill
// gift_products.pipeline_id so existing rows resolve without code fallback.

import fs from 'node:fs';

const env = fs.readFileSync('/Users/eadayeoh/Desktop/PrintVolution-Tools/.env.local', 'utf8');
const kv = Object.fromEntries(env.trim().split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')];}));
const BASE = kv.NEXT_PUBLIC_SUPABASE_URL, KEY = kv.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' };

const PIPELINES = [
  { slug: 'laser-v1',         kind: 'laser',        name: 'Laser (default)',        description: 'High-contrast binarised output for laser engraving.' },
  { slug: 'uv-flat-v1',       kind: 'uv',           name: 'UV Flat (default)',      description: 'Flat saturated output for UV flatbed print.' },
  { slug: 'embroidery-4c-v1', kind: 'embroidery',   name: 'Embroidery 4-colour',    description: 'Posterised 4-colour output for machine embroidery.' },
  { slug: 'photo-resize-v1',  kind: 'photo-resize', name: 'Photo Resize (default)', description: 'No AI. Crop + bleed only.' },
];

for (const p of PIPELINES) {
  const r = await fetch(`${BASE}/rest/v1/gift_pipelines?on_conflict=slug`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ ...p, default_params: {}, is_active: true }),
  });
  if (!r.ok) throw new Error(`seed ${p.slug}: ${r.status} ${await r.text()}`);
  console.log(`✓ pipeline ${p.slug}`);
}

// Backfill gift_products.pipeline_id from current mode
for (const p of PIPELINES) {
  const byKind = await (await fetch(`${BASE}/rest/v1/gift_pipelines?slug=eq.${p.slug}&select=id`, { headers: H })).json();
  const pid = byKind[0]?.id;
  if (!pid) continue;
  const upd = await fetch(`${BASE}/rest/v1/gift_products?mode=eq.${p.kind}&pipeline_id=is.null`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ pipeline_id: pid }),
  });
  if (!upd.ok) console.warn(`backfill ${p.kind}: ${upd.status}`);
}
console.log('\n✓ Pipelines seeded + existing gift_products backfilled.');
